/**
 * Núcleo de dominio: EVENTOS (Etapa 2 · objetivo Supabase).
 *
 * En Supabase esta lectura será:
 *   select * from events where organizador_id = $uid
 *   select * from tournaments where evento_id = $id
 * La interfaz de este repositorio no cambia al cambiar el origen.
 */
import { EVENTOS_DEMO, TORNEOS_DEMO } from '../data/mockRelacional.js';

export const EventsRepository = {
  /** Eventos del organizador, del más antiguo al más reciente. */
  async getEventos(organizadorId) {
    return EVENTOS_DEMO
      .filter((e) => !organizadorId || e.organizadorId === organizadorId)
      .sort((a, b) => (a.fechaInicio || '').localeCompare(b.fechaInicio || ''));
  },

  async getEventoPorId(id) {
    return EVENTOS_DEMO.find((e) => e.id === id);
  },

  /** Torneos/grupos que pertenecen a un evento, por fecha. */
  async getTorneosDeEvento(eventoId) {
    return TORNEOS_DEMO
      .filter((t) => t.eventoId === eventoId)
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  }
};