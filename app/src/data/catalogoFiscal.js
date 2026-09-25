/**
 * Catálogo fiscal (códigos del SAT) compartido por el registro de organizador
 * (RegistroView) y el panel de cobros (CobrosView). Fuente única: si el
 * registro añade un régimen, el panel lo muestra sin tocar dos sitios.
 */

export const REGIMENES = [
  { codigo: '601', texto: '601 · General de Ley Personas Morales' },
  { codigo: '603', texto: '603 · Personas morales sin fines de lucro' },
  { codigo: '605', texto: '605 · Sueldos y salarios' },
  { codigo: '606', texto: '606 · Arrendamiento' },
  { codigo: '607', texto: '607 · Régimen de incorporación fiscal' },
  { codigo: '608', texto: '608 · Demás ingresos' },
  { codigo: '611', texto: '611 · Venta de bienes' },
  { codigo: '612', texto: '612 · Actividades empresariales (RESICO PF)' },
  { codigo: '614', texto: '614 · Actividades profesionales (RESICO PF)' }
];

/** Texto completo de un régimen por su código ('' si no existe). */
export function regimenTexto(codigo) {
  const r = REGIMENES.find((x) => x.codigo === String(codigo || '').trim());
  return r ? r.texto : String(codigo || '').trim();
}
