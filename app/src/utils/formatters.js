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
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [anio, mes, dia] = iso.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export const Formatters = {
  /** 350 → '$ 350 MXN' */
  precio(monto) {
    return `$ ${new Intl.NumberFormat('es-MX').format(monto)} MXN`;
  },

  /** '2026-09-28' → '28 septiembre 2026' ('' si la fecha es inválida). */
  fechaLarga(iso) {
    const f = aFecha(iso);
    if (!f) return '';
    return `${f.getUTCDate()} ${MESES[f.getUTCMonth()]} ${f.getUTCFullYear()}`;
  },

  /** '2026-09-28' → 'domingo 28 de septiembre de 2026' ('' si es inválida). */
  fechaCompleta(iso) {
    const f = aFecha(iso);
    if (!f) return '';
    return `${DIAS[f.getUTCDay()]} ${f.getUTCDate()} de ${MESES[f.getUTCMonth()]} de ${f.getUTCFullYear()}`;
  },

  /**
   * Fecha de hoy en hora local del navegador ('YYYY-MM-DD').
   * Se usa para comparar con las fechas de torneo (que son locales);
   * usar UTC aquí movía de día los torneos de hoy (México UTC-6/-5).
   */
  hoyLocal() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  },

  /** Días que faltan hasta la fecha (negativo si ya pasó, null si es inválida). */
  diasHasta(iso) {
    const f = aFecha(iso);
    if (!f) return null;
    const hoy = new Date();
    const hoyUtc = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return Math.round((f - hoyUtc) / 86_400_000);
  },

  /**
   * Marca de tiempo ISO → '25 de septiembre de 2026, 14:32' ('' si es inválida).
   * Para datos con hora y fecha (último acceso a la cuenta).
   */
  fechaHora(iso) {
    if (typeof iso !== 'string' || !iso) return '';
    const f = new Date(iso);
    if (Number.isNaN(f.getTime())) return '';
    return f.toLocaleString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /** Devuelve el singular o el plural según el número. */
  plural(n, singular, plural) {
    return `${n} ${n === 1 ? singular : plural}`;
  }
};