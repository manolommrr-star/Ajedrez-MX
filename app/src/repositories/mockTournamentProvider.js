/**
 * Proveedor local de datos de torneos (demo).
 *
 * Implementa la MISMA interfaz que tendrá SupabaseTournamentProvider:
 *   getAll(), getById(id), search(filtros)
 * De esta forma, la vista nunca sabe de dónde vienen los datos y la
 * migración a Supabase no requiere tocar la interfaz.
 */
import { TORNEOS_DEMO } from '../data/mockRelacional.js';

export const MockTournamentProvider = {
  async getAll() {
    return TORNEOS_DEMO.slice();
  },

  async getById(id) {
    return TORNEOS_DEMO.find((t) => t.id === id);
  },

  /**
   * Filtros del MVP:
   *   textoTorneo → coincide con nombre, ciudad o estado
   *   ciudad      → coincide exacta
   *   modalidad   → coincide exacta ('Presencial' | 'Online')
   */
  async search({ textoTorneo = '', ciudad = '', modalidad = '' } = {}) {
    const texto = textoTorneo.trim().toLowerCase();

    return TORNEOS_DEMO.filter((t) => {
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