/**
 * Núcleo de dominio: PAGOS.
 *
 * Los estados de pago viven en la tabla payments y las inserciones se hacen
 * SOLO desde edge functions con service_role (webhook del proveedor).
 * Aquí solo se leen/agregan para la demostración local.
 */
import { PAGOS_DEMO, INSCRIPCIONES_DEMO } from '../data/mockRelacional.js';
import { transicionValida, registrarHistorial } from './registrationsRepository.js';
import { generarId } from '../utils/ids.js';

/** Folio único con el formato FOLIO-#### que usa la demo. */
function nuevoFolio() {
  let n = 1000 + PAGOS_DEMO.length + 1;
  while (PAGOS_DEMO.some((p) => p.folio === `FOLIO-${n}`)) n += 1;
  return `FOLIO-${n}`;
}

export const PaymentsRepository = {
  /** Pagos del más reciente al más antiguo. */
  async getPagos() {
    return PAGOS_DEMO.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
  },

  /** Un pago por folio (el jugador paga con el folio de su inscripción). */
  async getPorFolio(folio) {
    const buscado = String(folio || '').trim().toUpperCase();
    return PAGOS_DEMO.find((p) => String(p.folio).toUpperCase() === buscado) || null;
  },

  /** Pago asociado a una inscripción (para ofrecer "pagar" en el historial). */
  async getPorInscripcion(registrationId) {
    return PAGOS_DEMO.find((p) => p.registrationId === registrationId) || null;
  },

  /**
   * Crea el pago pendiente de una inscripción nueva (única vía: pago en línea).
   * En Supabase lo crea la edge function y la confirmación llega por webhook;
   * aquí se genera localmente para que la demo tenga folio que pagar.
   */
  async crearParaInscripcion({ inscripcion, torneo, jugador }) {
    const pago = {
      id: generarId('pay'),
      folio: nuevoFolio(),
      registrationId: inscripcion.id,
      torneoId: inscripcion.torneoId,
      playerId: inscripcion.playerId,
      torneo: torneo ? torneo.nombre : inscripcion.torneoId,
      jugador: jugador ? `${jugador.apellidos || ''} ${jugador.nombre || ''}`.trim() : inscripcion.playerId,
      monto: Number(inscripcion.precio) || 0,
      proveedor: 'Mercado Pago',
      estado: 'pendiente',
      fecha: new Date().toISOString().slice(0, 10)
    };
    PAGOS_DEMO.push(pago);
    return pago;
  },

  /**
   * Simula la confirmación de un pago vía webhook (Mercado Pago).
   * Cambia el estado del pago a 'pagado' y actualiza la inscripción asociada.
   * En Supabase esto lo ejecuta una edge function con service_role.
   */
  async simularWebhook(pagoId) {
    const pago = PAGOS_DEMO.find((p) => p.id === pagoId);
    if (!pago) return { ok: false, motivo: 'Pago no encontrado.' };
    if (pago.estado === 'pagado') {
      return { ok: false, motivo: 'El pago ya estaba confirmado.' };
    }
    if (pago.estado !== 'pendiente' && pago.estado !== 'procesando') {
      return { ok: false, motivo: `No se puede confirmar un pago en estado "${pago.estado}".` };
    }
    // Confirmar pago
    pago.estado = 'pagado';
    // La inscripción se confirma sola: con pago en línea nadie la confirma a mano.
    if (pago.registrationId) {
      const inscripcion = INSCRIPCIONES_DEMO.find((r) => r.id === pago.registrationId);
      if (inscripcion) {
        for (const estado of ['pagada', 'confirmada']) {
          if (!transicionValida(inscripcion.estado, estado)) continue;
          const anterior = inscripcion.estado;
          inscripcion.estado = estado;
          registrarHistorial(inscripcion.id, anterior, estado);
        }
      }
    }
    return { ok: true, pago };
  }
};