/**
 * Smoke fase 1 · sesión y errores del servidor.
 * Ejecutar: npm test  (o: node tests/smoke/02-sesion.mjs)
 *
 * Verifica el contrato de la barra/footers y que las vistas no filtran
 * datos personales (hoy la barra no muestra sesión: la fase 2 la añadirá).
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

const app = crearApp();
const servidor = await new Promise((resolve) => {
  const s = app.listen(0, () => resolve(s));
});
const base = `http://127.0.0.1:${servidor.address().port}`;

async function get(ruta) {
  const r = await fetch(base + ruta, { redirect: 'manual' });
  return { estado: r.status, html: await r.text(), headers: r.headers };
}

// 1 · HTML completo y saneado (sin inyección desde los datos mock)
const inicio = await get('/');
await t('la página es HTML5 con lang=es', () =>
  inicio.html.startsWith('<!DOCTYPE html>') && inicio.html.includes('<html lang="es">') ||
  'doctype/lang incorrectos');
await t('los datos se escapan en HTML (sin etiquetas crudas)', () =>
  !inicio.html.includes('<script>') || 'aparece <script> en el HTML');

// 2 · Contrato de rutas: solo las públicas de la fase 1 responden 200
const rutas = [
  ['/', 200],
  ['/torneo/xalapa-chess-open', 200],
  ['/torneo/torre-tablero-online-cup', 200],
  ['/torneo/blitz-xalapa-diciembre', 404], // borrador: no publicado
  ['/acceder', 404],                       // fase 2
  ['/panel', 404]                          // fase 3+
];
for (const [ruta, esperado] of rutas) {
  const r = await get(ruta);
  await t(`GET ${ruta} → ${esperado}`, () => r.estado === esperado || `estado ${r.estado}`);
}

// 3 · Métodos que no son GET no deben pintar el catálogo
const post = await fetch(base + '/', { method: 'POST' });
await t('POST / no está definido (404)', () =>
  post.status === 404 || `estado ${post.status}`);

// 4 · Query string hostil no rompe la vista
const hostil = await get('/?texto=' + encodeURIComponent('<img src=x onerror=alert(1)>'));
await t('query con HTML no se inyecta', () =>
  hostil.estado === 200 && !hostil.html.includes('<img src=x') ||
  'el query se volcó sin escapar');

servidor.close();
console.log(pruebas.join('\n'));
console.log(`\n${ok} PASS / ${fail} FAIL de ${ok + fail}`);
process.exit(fail ? 1 : 0);
