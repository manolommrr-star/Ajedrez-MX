/**
 * Funciones de formato (fechas, precios, cantidades).
 * Separadas de las vistas para poder reutilizarlas en cualquier parte.
 */

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const DIAS = [
  'domingo', 'lunes', 'martes', 'miércoles',
  'jueves', 'viernes', 'sábado'
];

/** Convierte 'YYYY-MM-DD' a Date (a medianoche UTC, sin zona horaria). */
function aFecha(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

export const Formatters = {
  /** 350 → '$ 350 MXN' */
  precio(monto) {
    return `$ ${new Intl.NumberFormat('es-MX').format(monto)} MXN`;
  },

  /** '2026-09-28' → '28 septiembre 2026' */
  fechaLarga(iso) {
    const f = aFecha(iso);
    return `${f.getUTCDate()} ${MESES[f.getUTCMonth()]} ${f.getUTCFullYear()}`;
  },

  /** '2026-09-28' → 'domingo 28 de septiembre de 2026' */
  fechaCompleta(iso) {
    const f = aFecha(iso);
    return `${DIAS[f.getUTCDay()]} ${f.getUTCDate()} de ${MESES[f.getUTCMonth()]} de ${f.getUTCFullYear()}`;
  },

  /** Días que faltan hasta la fecha (negativo si ya pasó). */
  diasHasta(iso) {
    const hoy = new Date();
    const hoyUtc = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return Math.round((aFecha(iso) - hoyUtc) / 86_400_000);
  },

  /** Devuelve el singular o el plural según el número. */
  plural(n, singular, plural) {
    return `${n} ${n === 1 ? singular : plural}`;
  }
};