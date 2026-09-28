/**
 * PUENTE con la app Vue.
 *
 * ÚNICO archivo del servidor que importa desde ../../app/src.
 * Mientras dure la migración gradual reutilizamos los repositorios y
 * utilidades existentes (son JavaScript puro, sin Vue ni navegador):
 *
 *   TournamentRepository → datos de torneos (mock con forma de Supabase)
 *   Formatters           → fechas, precios y plurales
 *   AppConfig            → constantes (p. ej. rango de "torneos cercanos")
 *
 * Cuando el núcleo se copie/porte a esta carpeta, solo habrá que cambiar
 * estas tres líneas: el resto del servidor no se entera.
 */
export { TournamentRepository } from '../../../app/src/repositories/tournamentRepository.js';
export { Formatters } from '../../../app/src/utils/formatters.js';
export { AppConfig } from '../../../app/src/config.js';
