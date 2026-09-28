/**
 * Modelos de vista: convierten un torneo crudo (del puente) en un objeto
 * listo para plantilla, calculando SOLO presentación (precio, gradiente,
 * fechas legibles…).
 *
 * Regla: las plantillas EJS no calculan nada; si una vista necesita un
 * dato derivado, nace aquí. Así se leen las plantillas de un vistazo.
 */
import { Formatters, AppConfig } from './puente/torneos.js';

/** Gradientes con tono de tablero para torneos sin foto (igual que el SPA). */
const GRADIENTES = [
  'linear-gradient(155deg, #2f6b46 0%, #1b4429 55%, #3a7d55 100%)',
  'linear-gradient(155deg, #2b4a70 0%, #1a2f4a 55%, #375d88 100%)',
  'linear-gradient(155deg, #7a4326 0%, #4d2817 55%, #8f5330 100%)'
];

/** Elige gradiente estable a partir del id (mismo criterio que el SPA). */
function gradienteDe(id) {
  let suma = 0;
  for (const ch of String(id)) suma += ch.codePointAt(0);
  return GRADIENTES[suma % GRADIENTES.length];
}

/** Torneo → datos de tarjeta del catálogo. */
export function aTarjeta(torneo) {
  const precios = torneo.categorias.map((c) => c.precio);
  const minimo = precios.length ? Math.min(...precios) : 0;
  const precioTexto = torneo.categorias.length > 1
    ? `Desde ${Formatters.precio(minimo)}`
    : Formatters.precio(minimo);

  return {
    ...torneo,
    enlace: `/torneo/${encodeURIComponent(torneo.id)}`,
    fechaLarga: Formatters.fechaLarga(torneo.fecha),
    rondasTexto: Formatters.plural(torneo.rondas, 'ronda', 'rondas'),
    precioTexto,
    completo: torneo.inscritos >= torneo.cupo,
    gradiente: gradienteDe(torneo.id)
  };
}

/** Torneo → datos de la página de detalle (características y panel lateral). */
export function aDetalle(torneo) {
  const base = aTarjeta(torneo);
  return {
    ...base,
    fechaCompleta: Formatters.fechaCompleta(torneo.fecha),
    caracteristicas: [
      ['Modalidad', torneo.modalidad],
      ['Sistema', torneo.sistema],
      ['Rondas', base.rondasTexto],
      ['Ritmo de juego', torneo.ritmo],
      ['Sede', torneo.sede],
      ['Dirección', torneo.direccion],
      ['Ciudad / Estado', `${torneo.ciudad}, ${torneo.estado}`]
    ],
    categorias: torneo.categorias.map((c) => ({
      nombre: c.nombre,
      precio: Formatters.precio(c.precio)
    })),
    lugaresTexto: `${torneo.inscritos} / ${torneo.cupo} lugares`
  };
}

/**
 * Secciones del inicio cuando NO hay filtros:
 * destacados, cercanos (hoy..rangoCercanosDias) y próximos por fecha.
 */
export function secciones(torneos) {
  const cercanos = torneos.filter((t) => {
    const dias = Formatters.diasHasta(t.fecha);
    return dias !== null && dias >= 0 && dias <= AppConfig.rangoCercanosDias;
  });

  return {
    destacados: torneos.filter((t) => t.destacado).slice(0, 4).map(aTarjeta),
    cercanos: cercanos.slice(0, 4).map(aTarjeta),
    proximos: torneos.slice(0, 8).map(aTarjeta)
  };
}

/** Valores únicos para los selects de ciudad y modalidad. */
export function valoresDeFiltro(torneos) {
  return {
    ciudades: [...new Set(torneos.map((t) => t.ciudad))].sort(),
    modalidades: [...new Set(torneos.map((t) => t.modalidad))].sort()
  };
}
