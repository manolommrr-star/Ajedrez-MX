/**
 * Proveedor local de datos de torneos (prototipo).
 *
 * Implementa la MISMA interfaz que tendrá FirestoreTournamentProvider:
 *   getAll(), getById(id), search(filtros)
 * De esta forma, la vista nunca sabe de dónde vienen los datos y la
 * migración a Firestore no requiere tocar la interfaz.
 */
import { MOCK_TOURNAMENTS } from '../data/mockTournaments.js';

export const MockTournamentProvider = {
  async getAll() {
    return MOCK_TOURNAMENTS.slice();
  },

  async getById(id) {
    return MOCK_TOURNAMENTS.find((t) => t.id === id);
  },

  /**
   * Filtros del MVP:
   *   textoTorneo → coincide con nombre, ciudad o estado
   *   ciudad      → coincide exacta
   *   modalidad   → coincide exacta ('Presencial' | 'Online')
   */
  async search({ textoTorneo = '', ciudad = '', modalidad = '' } = {}) {
    const texto = textoTorneo.trim().toLowerCase();

    return MOCK_TOURNAMENTS.filter((t) => {
      const coincideTexto =
        !texto ||
        t.nombre.toLowerCase().includes(texto) ||
        t.ciudad.toLowerCase().includes(texto) ||
        t.estado.toLowerCase().includes(texto);
      const coincideCiudad = !ciudad || t.ciudad === ciudad;
      const coincideModalidad = !modalidad || t.modalidad === modalidad;
      return coincideTexto && coincideCiudad && coincideModalidad;
    });
  }
};