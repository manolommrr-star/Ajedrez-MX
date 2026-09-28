/**
 * Smoke fase 1 · servidor Node (catálogo y detalle).
 * Ejecutar: npm test  (o: node tests/smoke/01-catalogo.mjs)
 *
 * Arranca la app real en un puerto efímero y la consulta con fetch:
 * comprueba rutas, filtros por query string, 404 y que el HTML replicue
 * el comportamiento del SPA (secciones, tarjetas, precio, categorías).
 */
import { crearApp } from '../../src/app.js';

let ok = 0;
let fail = 0;
const pruebas = [];
async function t(nombre, fn) {
  try {
    const r = await fn();
    if (r === true) { ok += 1; pruebas.push(`PASS  ${nombre}`); }
    else { fail += 1; pruebas.push(`FAIL  ${nombre} → ${r}`); }
  } catch (e) {
    fail += 1;
    pruebas.push(`FAIL  ${nombre} → ${e.message}`);
  }
}

// --- Servidor en puerto efímero (0 = que el SO elija) ---
const app = crearApp();
const servidor = await new Promise((resolve) => {
  const s = app.listen(0, () => resolve(s));
});
const base = `http://127.0.0.1:${servidor.address().port}`;

async function get(ruta) {
  const r = await fetch(base + ruta, { redirect: 'manual' });
  return { estado: r.status, html: await r.text() };
}

// 1 · Catálogo
const inicio = await get('/');
await t('GET / responde 200', () => inicio.estado === 200 || `estado ${inicio.estado}`);
await t('catálogo muestra el hero', () =>
  inicio.html.includes('Encuentra tu próximo torneo de ajedrez') || 'falta el hero');
await t('catálogo lista torneos en tarjetas', () =>
  inicio.html.includes('rejilla-torneos') && inicio.html.includes('tarjeta-torneo') || 'faltan tarjetas');
await t('el torneo borrador NO aparece', () =>
  !inicio.html.includes('Blitz Xalapa de Diciembre') || 'se filtró un borrador');
await t('la barra y el pie están presentes', () =>
  inicio.html.includes('class="barra"') && inicio.html.includes('class="pie"') || 'falta layout');

// 2 · Filtros por query string (equivalente server-side de los filtros del SPA)
const filtrado = await get('/?texto=xalapa&modalidad=Presencial');
await t('filtro texto+modalidad devuelve 200', () => filtrado.estado === 200 || `estado ${filtrado.estado}`);
await t('filtro encuentra torneos de Xalapa presenciales', () =>
  filtrado.html.includes('Xalapa Chess Open') || 'no encontró Xalapa Chess Open');
await t('filtro excluye los online', () =>
  !filtrado.html.includes('Torre & Tablero Online Cup') || 'no excluyó el torneo online');

const vacio = await get('/?texto=zzzz-no-existe');
await t('sin coincidencias muestra el aviso', () =>
  vacio.html.includes('No encontramos torneos con esos criterios.') || 'falta el aviso vacío');

// 3 · Detalle
const detalle = await get('/torneo/xalapa-chess-open');
await t('GET /torneo/:id responde 200', () => detalle.estado === 200 || `estado ${detalle.estado}`);
await t('detalle muestra el nombre y la fecha completa', () =>
  detalle.html.includes('Xalapa Chess Open') && detalle.html.includes('20 de marzo de 2027') ||
  'falta nombre o fecha');
await t('detalle lista categorías con precio', () =>
  detalle.html.includes('Primera Fuerza') && detalle.html.includes('$ 400 MXN') ||
  'faltan categorías/precios');
await t('detalle muestra el organizador', () =>
  detalle.html.includes('Club de Ajedrez Xalapa') || 'falta organizador');
await t('detalle muestra lugares 72/100', () =>
  detalle.html.includes('72 / 100 lugares') || 'faltan los lugares');

// 4 · Errores
const noExiste = await get('/torneo/no-existe');
await t('torneo inexistente responde 404', () => noExiste.estado === 404 || `estado ${noExiste.estado}`);
await t('404 del torneo explica el motivo', () =>
  noExiste.html.includes('Torneo no encontrado') || 'falta mensaje 404');

const rutaRara = await get('/ruta-que-no-existe');
await t('ruta desconocida responde 404', () => rutaRara.estado === 404 || `estado ${rutaRara.estado}`);
await t('404 genérico muestra la vista de error', () =>
  rutaRara.html.includes('Página no encontrada') || 'falta vista de error');

// 5 · Estáticos compartidos con la app Vue
const css = await fetch(base + '/estilos/base.css');
await t('CSS de app/src/styles se sirve', () => css.status === 200 || `estado ${css.status}`);

// --- Resumen (mismo formato que los smokes de app/) ---
servidor.close();
console.log(pruebas.join('\n'));
console.log(`\n${ok} PASS / ${fail} FAIL de ${ok + fail}`);
process.exit(fail ? 1 : 0);
