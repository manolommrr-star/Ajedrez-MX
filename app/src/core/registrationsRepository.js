/**
 * Núcleo de dominio: INSCRIPCIONES (jugador × torneo).
 *
 * Incluye la MÁQUINA DE ESTADOS de la inscripción: las transiciones válidas
 * se declaran aquí y la UI las respeta al pedir cambios de estado.
 *
 * En Supabase estas transiciones se validarán en edge functions
 * (service_role) y se auditarán en registration_historial.
 */
import { INSCRIPCIONES_DEMO, JUGADORES_DEMO, TORNEOS_DEMO } from '../data/mockRelacional.js';
import { generarId } from '../utils/ids.js';

/** Transiciones permitidas entre estados. */
const TRANSICIONES_ESTADO = {
  pendiente: ['pago_pendiente', 'pagada', 'cancelada', 'rechazada'],
  pago_pendiente: ['pago_en_revision', 'pagada', 'cancelada'],
  pago_en_revision: ['pagada', 'rechazada', 'cancelada'],
  pagada: ['confirmada', 'retirada'],
  confirmada: ['checkin', 'retirada', 'cancelada'],
  cancelada: [],
  rechazada: [],
  checkin: ['retirada'],
  retirada: []
};

/** Mock de la tabla registration_historial (auditoría de cambios de estado). */
const HISTORIAL_DEMO = [];

/** Registra un cambio de estado (equivalente a insert en registration_historial). */
export function registrarHistorial(regId, anterior, nuevo) {
  HISTORIAL_DEMO.push({
    id: HISTORIAL_DEMO.length + 1,
    registrationId: regId,
    estadoAnterior: anterior,
    estadoNuevo: nuevo,
    fecha: new Date().toISOString()
  });
}

/** ¿Es válido pasar de `desde` a `hacia`? */
export function transicionValida(desde, hacia) {
  const permitidas = TRANSICIONES_ESTADO[desde] ?? [];
  return permitidas.includes(hacia);
}

export const RegistrationsRepository = {
  async getPorTorneo(torneoId) {
    return INSCRIPCIONES_DEMO
      .filter((r) => r.torneoId === torneoId)
      .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));
  },

  async getPorJugador(playerId) {
    return INSCRIPCIONES_DEMO.filter((r) => r.playerId === playerId);
  },

  /**
   * Participantes de un torneo: hace JOIN de inscripción + jugador.
   * Devuelve filas con toda la información para la tabla del panel.
   */
  async getParticipantes(torneoId) {
    const inscripciones = await this.getPorTorneo(torneoId);
    return inscripciones.map((r) => {
      const jugador = JUGADORES_DEMO.find((j) => j.id === r.playerId);
      return {
        ...r,
        jugador: jugador || { nombre: '¿?' },
        nombreJugador: jugador ? `${jugador.apellidos} ${jugador.nombre}` : '—'
      };
    });
  },

  /** Cambia el estado si la transición es válida (devuelve false si no). */
  async actualizarEstado(regId, nuevoEstado) {
    const inscripcion = INSCRIPCIONES_DEMO.find((r) => r.id === regId);
    if (!inscripcion) return false;
    if (!transicionValida(inscripcion.estado, nuevoEstado)) return false;
    const anterior = inscripcion.estado;
    inscripcion.estado = nuevoEstado;
    registrarHistorial(regId, anterior, nuevoEstado);
    return true;
  },

  /**
   * Inscripción desde el jugador (Etapa 3 · registro online).
   * Aplica las mismas reglas que las políticas RLS de registrations:
   * torneo publicado, cupo disponible, una inscripción por jugador/torneo
   * (unique player_id+torneo_id) y categoría válida del torneo.
   */
  async inscribir({ playerId, torneoId, categoria }) {
    const torneo = TORNEOS_DEMO.find((t) => t.id === torneoId);
    if (!torneo || torneo.estadoPublicacion !== 'publicado') {
      return { ok: false, motivo: 'El torneo no acepta inscripciones.' };
    }
    const existente = INSCRIPCIONES_DEMO.find(
      (r) => r.playerId === playerId && r.torneoId === torneoId
    );
    if (existente) {
      return { ok: false, motivo: `Ya tienes una inscripción en este torneo (estado: ${existente.estado}).` };
    }
    if ((torneo.inscritos || 0) >= torneo.cupo) {
      return { ok: false, motivo: 'El torneo está completo.' };
    }
    const categoriaTorneo = torneo.categorias.find((c) => c.nombre === categoria);
    if (!categoriaTorneo) {
      return { ok: false, motivo: 'Selecciona una categoría del torneo.' };
    }
    const inscripcion = {
      id: generarId('reg'),
      playerId,
      torneoId,
      eventoId: torneo.eventoId || null,
      categoria: categoriaTorneo.nombre,
      precio: categoriaTorneo.precio,
      // Con pago en línea la inscripción nace esperando el pago.
      estado: 'pago_pendiente',
      fechaCreacion: new Date().toISOString().slice(0, 10)
    };
    INSCRIPCIONES_DEMO.push(inscripcion);
    torneo.inscritos = (torneo.inscritos || 0) + 1;
    registrarHistorial(inscripcion.id, null, 'pago_pendiente');
    return { ok: true, inscripcion };
  },

  /**
   * Cancela la inscripción del propio jugador (solo estados tempranos).
   * En Supabase esto pasará por edge function: la RLS solo permite al
   * jugador insertar su inscripción, no actualizarla.
   */
  async cancelarDeJugador(regId, playerId) {
    const inscripcion = INSCRIPCIONES_DEMO.find((r) => r.id === regId && r.playerId === playerId);
    if (!inscripcion || !transicionValida(inscripcion.estado, 'cancelada')) return false;
    const torneo = TORNEOS_DEMO.find((t) => t.id === inscripcion.torneoId);
    if (torneo) torneo.inscritos = Math.max(0, (torneo.inscritos || 0) - 1);
    return this.actualizarEstado(regId, 'cancelada');
  },

  /** Datos mínimos del torneo para "Mis inscripciones" (aunque se despublique). */
  async getInfoTorneo(torneoId) {
    const t = TORNEOS_DEMO.find((x) => x.id === torneoId);
    return t
      ? { id: t.id, nombre: t.nombre, fecha: t.fecha, ciudad: t.ciudad, estado: t.estado, modalidad: t.modalidad }
      : null;
  }
};