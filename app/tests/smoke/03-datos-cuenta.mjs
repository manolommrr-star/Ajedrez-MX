/**
 * Smoke Fase 3 · datos de la cuenta (exportar, eliminar, fecha de aceptación).
 * NOTA: sin sesión multi-pestaña (queda fuera de esta fase, por indicación).
 * Ejecutar: npm test  (o: node tests/smoke/03-datos-cuenta.mjs)
 */

const mem = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k)
  }
};

const base = new URL('../../src/', import.meta.url).href;
const { CuentasRepository, cuentasListas, perfilOrganizador } =
  await import(base + 'core/cuentasRepository.js');
const { DatosCuenta } = await import(base + 'core/datosCuenta.js');
const { Sesion } = await import(base + 'core/sesion.js');
const { PlayersRepository } = await import(base + 'core/playersRepository.js');
const { RegistrationsRepository } = await import(base + 'core/registrationsRepository.js');
await cuentasListas;

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

// 1 · Fecha de aceptación de términos
await t('el organizador registra la fecha de aceptación', async () => {
  const r = await CuentasRepository.registrar({
    rol: 'organizer', nombre: 'Org A', email: 'orga@prueba.mx', clave: 'clave1234',
    extras: { organizacion: 'Org A', aceptaTerminos: true }
  });
  return r.ok && r.cuenta.aceptaTerminos === true && !Number.isNaN(Date.parse(r.cuenta.fechaAceptacion));
});
await t('sin aceptación la fecha queda en null', async () => {
  const r = await CuentasRepository.registrar({
    rol: 'organizer', nombre: 'Org B', email: 'orgb@prueba.mx', clave: 'clave1234',
    extras: { organizacion: 'Org B', aceptaTerminos: false }
  });
  return r.ok && r.cuenta.aceptaTerminos === false && r.cuenta.fechaAceptacion === null;
});
await t('la cuenta demo del organizador trae fecha de ejemplo', async () => {
  const demo = await CuentasRepository.getDemo('organizer');
  return !Number.isNaN(Date.parse(demo.fechaAceptacion));
});
await t('el perfil del organizador se arma igual en sesión y en núcleo', async () => {
  await Sesion.iniciar('user-demo-organizador');
  const desdeSesion = await Sesion.getOrganizador();
  const desdeNucleo = perfilOrganizador(await CuentasRepository.getPorId('user-demo-organizador'));
  return JSON.stringify(desdeSesion) === JSON.stringify(desdeNucleo);
});

// 2 · Exportación de datos
await t('exporta los datos del jugador con cuenta, perfil e inscripciones', async () => {
  await Sesion.iniciar('user-demo-jugador');
  const datos = await DatosCuenta.reunir('user-demo-jugador');
  return datos !== null && datos.version === 1
    && datos.cuenta.email === 'ana.torres@correo.mx'
    && datos.jugador && datos.jugador.id === 'j1'
    && Array.isArray(datos.inscripciones) && datos.inscripciones.length > 0
    && Array.isArray(datos.pagos);
});
await t('la exportación nunca incluye el hash de la contraseña', async () => {
  const datos = await DatosCuenta.reunir('user-demo-jugador');
  const texto = JSON.stringify(datos);
  return !('claveHash' in datos.cuenta) && !texto.includes('claveHash') && !texto.includes('clave:');
});
await t('exporta los datos del organizador con sus datos fiscales', async () => {
  const datos = await DatosCuenta.reunir('user-demo-organizador');
  return datos.organizacion && datos.organizacion.rfc && datos.organizacion.clabe
    && datos.organizacion.email === 'contacto@ajedrezxalapa.mx'
    && datos.jugador === null && datos.inscripciones.length === 0;
});
await t('exportar una cuenta inexistente devuelve null',
  async () => (await DatosCuenta.reunir('user-xyz')) === null);
await t('nombre de archivo con la fecha del día', () =>
  /^ajedrezmx-datos-\d{4}-\d{2}-\d{2}\.json$/.test(DatosCuenta.nombreArchivo()));

// 3 · Eliminar cuenta
const jug = await CuentasRepository.registrar({
  rol: 'player', nombre: 'Borrable', email: 'borrable@prueba.mx', clave: 'clave1234'
});
await t('eliminar exige la contraseña correcta', async () => {
  const r = await CuentasRepository.eliminarCuenta({ id: jug.cuenta.id, clave: 'mala' });
  return r.ok === false && (await CuentasRepository.getPorId(jug.cuenta.id)) !== null;
});
await t('eliminar borra la cuenta y ya no se puede acceder', async () => {
  const r = await CuentasRepository.eliminarCuenta({ id: jug.cuenta.id, clave: 'clave1234' });
  const acceso = await CuentasRepository.acceder({ email: 'borrable@prueba.mx', clave: 'clave1234' });
  return r.ok && (await CuentasRepository.getPorId(jug.cuenta.id)) === null && acceso.ok === false;
});
await t('el perfil del jugador queda anonimizado, no borrado', async () => {
  const j = await PlayersRepository.getPorId(jug.cuenta.playerId);
  return j !== null && j.nombre === 'Eliminado' && j.apellidos === null && j.email === null;
});
await t('las inscripciones del jugador se conservan como registro', async () => {
  const antes = await RegistrationsRepository.getPorJugador('j1');
  await CuentasRepository.eliminarCuenta({ id: 'user-demo-jugador', clave: 'demo1234' });
  const despues = await RegistrationsRepository.getPorJugador('j1');
  return antes.length === despues.length && despues.length > 0;
});
await t('eliminar la cuenta demo limpia su hash guardado', async () => {
  await CuentasRepository.cambiarClave({
    id: 'user-demo-organizador', claveActual: 'demo1234', claveNueva: 'orgclave77'
  });
  const antes = JSON.parse(mem.get('ajedrezmx-claves-demo') || '{}');
  if (!antes['contacto@ajedrezxalapa.mx']) return 'el hash demo no se guardó';
  const r = await CuentasRepository.eliminarCuenta({
    id: 'user-demo-organizador', claveActual: undefined, clave: 'orgclave77'
  });
  const despues = JSON.parse(mem.get('ajedrezmx-claves-demo') || '{}');
  return r.ok && despues['contacto@ajedrezxalapa.mx'] === undefined
    && (await CuentasRepository.getDemo('organizer')) === null;
});
await t('las cuentas eliminadas desaparecen del almacenamiento', () => {
  const crudo = mem.get('ajedrezmx-cuentas-demo') || '';
  return !crudo.includes('borrable@prueba.mx') && !crudo.includes('seguridad@prueba.mx');
});
await t('eliminar una cuenta ya borrada responde con error',
  async () => (await CuentasRepository.eliminarCuenta({ id: jug.cuenta.id, clave: 'x' })).ok === false);

console.log(pruebas.join('\n'));
console.log(`\n${ok} PASS / ${fail} FAIL de ${ok + fail}`);
process.exit(fail ? 1 : 0);


