/**
 * Smoke Fase 1 · lógica de usuarios (Mi cuenta + recuperación de contraseña).
 * Ejecutar: npm test  (o: node tests/smoke/01-cuenta.mjs)
 */

// --- Stub de navegador (localStorage en memoria) ---
const mem = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k)
  }
};

const base = new URL('../../src/', import.meta.url).href;
const { CuentasRepository, cuentasListas } = await import(base + 'core/cuentasRepository.js');
const { PlayersRepository } = await import(base + 'core/playersRepository.js');
const { Sesion } = await import(base + 'core/sesion.js');
const { esCorreo, claveAceptable } = await import(base + 'utils/validacionesCuenta.js');

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
await cuentasListas;

// 1 · Validaciones compartidas
await t('esCorreo acepta correo válido', () => esCorreo('ana@correo.mx') === true);
await t('esCorreo rechaza correo roto', () => esCorreo('ana@correo') === false);
await t('esCorreo rechaza vacío', () => esCorreo('') === false);
await t('claveAceptable rechaza <8', () => claveAceptable('1234567') !== '');
await t('claveAceptable acepta 8', () => claveAceptable('12345678') === '');
await t('registrar usa esCorreo compartido', async () =>
  (await CuentasRepository.registrar({ rol: 'player', nombre: 'X', email: 'malo', clave: 'clave1234' })).ok === false);

// 2 · Registro jugador propio
const alta = await CuentasRepository.registrar({
  rol: 'player', nombre: 'Lucas', apellidos: 'Ríos', email: 'lucas@nuevo.mx',
  clave: 'clave1234', extras: { fideId: '2103456', elo: 1900, club: 'Club A' }
});
await t('registra jugador nuevo', () => alta.ok === true && Boolean(alta.cuenta.playerId));
const id = alta.cuenta.id;

// 3 · Sesión del jugador
await Sesion.iniciar(id);
const jugadorAntes = await Sesion.getJugador();
await t('sesión expone el perfil de jugador', () => jugadorAntes?.email === 'lucas@nuevo.mx');

// 4 · Identidad sincronizada cuenta ↔ jugador
await t('actualizar nombre sincroniza cuenta, jugador y datosJugador', async () => {
  const r = await CuentasRepository.actualizar(id, { nombre: 'Lucas Andrés' });
  const j = await PlayersRepository.getPorId(alta.cuenta.playerId);
  return r.ok && r.cuenta.nombre === 'Lucas Andrés' && j.nombre === 'Lucas Andrés'
    && r.cuenta.datosJugador.nombre === 'Lucas Andrés';
});

// 5 · Validaciones de actualizar
await t('rechaza correo duplicado', async () =>
  (await CuentasRepository.actualizar(id, { email: 'contacto@ajedrezxalapa.mx' })).ok === false);
await t('rechaza correo inválido', async () =>
  (await CuentasRepository.actualizar(id, { email: 'no-es-correo' })).ok === false);
await t('rechaza nombre vacío', async () =>
  (await CuentasRepository.actualizar(id, { nombre: '   ' })).ok === false);
await t('rechaza cuenta inexistente', async () =>
  (await CuentasRepository.actualizar('user-xyz', { nombre: 'X' })).ok === false);
await t('cambia correo y permite acceder', async () => {
  const r = await CuentasRepository.actualizar(id, { email: 'lucas.2@nuevo.mx' });
  const a = await CuentasRepository.acceder({ email: 'lucas.2@nuevo.mx', clave: 'clave1234' });
  return r.ok && a.ok && a.cuenta.id === id;
});

// 6 · Perfil de jugador (datos extra)
await t('guarda datos del perfil jugador', async () => {
  await CuentasRepository.actualizar(id, { datosJugador: { club: 'Club B', elo: 2050, fideId: '' } });
  const j = await PlayersRepository.getPorId(alta.cuenta.playerId);
  return j.club === 'Club B' && j.elo === 2050 && j.fideId === null;
});
await t('datosJugador conserva la identidad de la cuenta', async () => {
  const c = await CuentasRepository.getPorId(id);
  return c.datosJugador.email === 'lucas.2@nuevo.mx' && c.datosJugador.club === 'Club B';
});
await t('actualizar jugador inexistente devuelve null',
  async () => (await PlayersRepository.actualizar('j-xyz', { club: 'X' })) === null);

// 7 · Cambio de contraseña
await t('cambiarClave rechaza actual incorrecta', async () =>
  (await CuentasRepository.cambiarClave({ id, claveActual: 'mala', claveNueva: 'nuevaclave1' })).ok === false);
await t('cambiarClave rechaza nueva corta', async () =>
  (await CuentasRepository.cambiarClave({ id, claveActual: 'clave1234', claveNueva: 'corta' })).ok === false);
await t('cambiarClave ok deja entrar con la nueva', async () => {
  const r = await CuentasRepository.cambiarClave({ id, claveActual: 'clave1234', claveNueva: 'nuevaclave1' });
  const nuevo = await CuentasRepository.acceder({ email: 'lucas.2@nuevo.mx', clave: 'nuevaclave1' });
  const viejo = await CuentasRepository.acceder({ email: 'lucas.2@nuevo.mx', clave: 'clave1234' });
  return r.ok && nuevo.ok && !viejo.ok;
});

// 8 · Recuperación de contraseña
await t('solicitarRecuperacion rechaza correo sin cuenta', async () =>
  (await CuentasRepository.solicitarRecuperacion('nadie@nuevo.mx')).ok === false);
await t('restablecer sin código pendiente falla', async () =>
  (await CuentasRepository.restablecerClave({ email: 'lucas.2@nuevo.mx', codigo: '000000', claveNueva: 'otra12345' })).ok === false);
const sol = await CuentasRepository.solicitarRecuperacion('lucas.2@nuevo.mx');
await t('solicitarRecuperacion genera código de 6 dígitos', () =>
  sol.ok === true && /^\d{6}$/.test(sol.codigo));
await t('restablecerClave rechaza código incorrecto', async () =>
  (await CuentasRepository.restablecerClave({ email: 'lucas.2@nuevo.mx', codigo: '000000', claveNueva: 'otra12345' })).ok === false);
await t('restablecerClave rechaza clave corta', async () =>
  (await CuentasRepository.restablecerClave({ email: 'lucas.2@nuevo.mx', codigo: sol.codigo, claveNueva: 'corta' })).ok === false);
await t('restablecerClave ok deja entrar con la nueva', async () => {
  const r = await CuentasRepository.restablecerClave({ email: 'lucas.2@nuevo.mx', codigo: sol.codigo, claveNueva: 'otra12345' });
  const nuevo = await CuentasRepository.acceder({ email: 'lucas.2@nuevo.mx', clave: 'otra12345' });
  const viejo = await CuentasRepository.acceder({ email: 'lucas.2@nuevo.mx', clave: 'nuevaclave1' });
  return r.ok && nuevo.ok && !viejo.ok;
});
await t('el código de un solo uso se borra tras usarse', () =>
  (mem.get('ajedrezmx-recuperacion') || '{}') === '{}');

// 9 · Organización del organizador
await t('actualizar organización se refleja en getOrganizador', async () => {
  const r = await CuentasRepository.actualizar('user-demo-organizador', {
    organizacion: 'Club Nuevo Xalapa',
    datosOrganizador: { giro: 'Escuela', telefono: '5511111111', ciudad: 'Xalapa', estado: 'Veracruz' }
  });
  await Sesion.iniciar('user-demo-organizador');
  const org = await Sesion.getOrganizador();
  return r.ok && org.nombre === 'Club Nuevo Xalapa' && org.organizacion === 'Club Nuevo Xalapa'
    && org.giro === 'Escuela' && org.ciudad === 'Xalapa';
});
await t('los datos fiscales no se tocan al editar la organización', async () => {
  const org = await Sesion.getOrganizador();
  return Boolean(org.rfc) && Boolean(org.clabe) && Boolean(org.mpEmail);
});

// 10 · Persistencia de las cuentas propias (sin claves en claro)
await t('las cuentas propias se guardan sin la contraseña', () => {
  const crudo = mem.get('ajedrezmx-cuentas-demo') || '';
  return crudo.includes('lucas.2@nuevo.mx') && !crudo.includes('clave1234') && !crudo.includes('otra12345');
});

// 11 · Cambio de clave en cuenta demo (sobrevive a la recarga)
await t('cambiarClave en cuenta demo guarda su propio hash', async () => {
  const r = await CuentasRepository.cambiarClave({
    id: 'user-demo-organizador', claveActual: 'demo1234', claveNueva: 'orgclave99'
  });
  const mapa = JSON.parse(mem.get('ajedrezmx-claves-demo') || '{}');
  const nuevo = await CuentasRepository.acceder({ email: 'contacto@ajedrezxalapa.mx', clave: 'orgclave99' });
  const viejo = await CuentasRepository.acceder({ email: 'contacto@ajedrezxalapa.mx', clave: 'demo1234' });
  return r.ok && nuevo.ok && !viejo.ok && Boolean(mapa['contacto@ajedrezxalapa.mx']);
});

console.log(pruebas.join('\n'));
console.log(`\n${ok} PASS / ${fail} FAIL de ${ok + fail}`);
process.exit(fail ? 1 : 0);


