/**
 * Repositorio de torneos.
 *
 * Es la ÚNICA puerta de acceso a los datos de torneos desde las vistas.
 * En el prototipo se usa el proveedor local con datos ficticios;
 * cuando conectemos Firestore solo cambiará `provider` aquí.
 */
import { MockTournamentProvider } from './mockTournamentProvider.js';

function ordenarPorFecha(torneos) {
  return torneos
    .filter((t) => t.estadoPublicacion === 'publicado')
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export const TournamentRepository = {
  provider: MockTournamentProvider,

  /** Todos los torneos publicados, ordenados por fecha (los más próximos primero). */
  async getAll() {
    const torneos = await this.provider.getAll();
    return ordenarPorFecha(torneos);
  },

  /** Un torneo por id, o null si no existe o no está publicado. */
  async getById(id) {
    const torneo = await this.provider.getById(id);
    return torneo && torneo.estadoPublicacion === 'publicado' ? torneo : null;
  },

  /** Busca con los filtros del MVP y devuelve solo publicados, ordenados por fecha. */
  async search(filtros = {}) {
    const torneos = await this.provider.search(filtros);
    return ordenarPorFecha(torneos);
  }
};