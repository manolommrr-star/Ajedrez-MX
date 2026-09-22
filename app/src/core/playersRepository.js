/**
 * Núcleo de dominio: JUGADORES (entidad independiente del torneo).
 *
 * En Supabase esta lectura será:
 *   select * from players where id = $playerId
 *   select * from players where lower(nombre) like $texto...
 */
import { JUGADORES_DEMO } from '../data/mockRelacional.js';
import { generarId } from '../utils/ids.js';

export const PlayersRepository = {
  async getPorId(id) {
    return JUGADORES_DEMO.find((p) => p.id === id);
  },

  /** Búsqueda simple por nombre, apellidos, FIDE ID o club. */
  async buscar(texto = '') {
    const t = texto.trim().toLowerCase();
    if (!t) return JUGADORES_DEMO.slice();
    return JUGADORES_DEMO.filter((p) =>
      p.nombre.toLowerCase().includes(t) ||
      p.apellidos.toLowerCase().includes(t) ||
      (p.fideId || '').includes(t) ||
      (p.club || '').toLowerCase().includes(t)
    );
  },

  /**
   * Crea el registro del jugador (Etapa 3 · inscripción online).
   * En Supabase será un insert en players, ligado a user_id cuando exista
   * cuenta de auth; aquí solo datos locales con la misma forma.
   */
  async crearJugador(datos) {
    const limpiar = (v) => {
      const texto = String(v ?? '').trim();
      return texto === '' ? null : texto;
    };
    const nuevo = {
      id: generarId('j'),
      nombre: limpiar(datos.nombre),
      apellidos: limpiar(datos.apellidos),
      fechaNacimiento: limpiar(datos.fechaNacimiento),
      fideId: limpiar(datos.fideId),
      federacion: limpiar(datos.federacion),
      club: limpiar(datos.club),
      elo: String(datos.elo ?? '').trim() !== '' ? Number(datos.elo) : null,
      titulo: limpiar(datos.titulo),
      sexo: limpiar(datos.sexo),
      email: limpiar(datos.email),
      telefono: limpiar(datos.telefono),
      ciudad: limpiar(datos.ciudad),
      estado: limpiar(datos.estado),
      fechaCreacion: new Date().toISOString().slice(0, 10)
    };
    JUGADORES_DEMO.push(nuevo);
    return nuevo;
  }
};