/**
 * Smoke Fase 2 · guardas de ruta + seguridad de cuenta
 * (verificación de correo, bloqueo por intentos, último acceso).
 * Ejecutar: npm test  (o: node tests/smoke/02-seguridad.mjs)
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
const { evaluarAcceso } = await import(base + 'router/guardas.js');
const { CuentasRepository, cuentasListas } = await import(base + 'core/cuentasRepository.js');
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

const JUGADOR = { id: 'u1', rol: 'player' };
const ORGANIZADOR = { id: 'u2', rol: 'organizer' };

// 1 · Guardas de ruta
await t('ruta pública sin metas: acceso libre', () => evaluarAcceso({}, null) === true);
await t('ruta pública con cuenta: acceso libre', () => evaluarAcceso({}, JUGADOR) === true);
await t('requiereSesion sin cuenta: va a acceder con redirección', () => {
  const d = evaluarAcceso({ requiereSesion: true }, null);
  return d.nombre === 'acceder' && d.conRedir === true;
});
await t('requiereSesion con jugador: acceso libre', () =>
  evaluarAcceso({ requiereSesion: true }, JUGADOR) === true);
await t('requiereSesion con organizador: acceso libre', () =>
  evaluarAcceso({ requiereSesion: true }, ORGANIZADOR) === true);
await t('requiereOrganizador sin cuenta: va a acceder', () => {
  const d = evaluarAcceso({ requiereOrganizador: true }, null);
  return d.nombre === 'acceder' && d.conRedir === true;
});
await t('requiereOrganizador con organizador: acceso libre', () =>
  evaluarAcceso({ requiereOrganizador: true }, ORGANIZADOR) === true);
await t('requiereOrganizador con jugador: va a mis inscripciones', () =>
  evaluarAcceso({ requiereOrganizador: true }, JUGADOR).nombre === 'mis-inscripciones');
await t('requiereJugador con organizador: va a Mi cuenta', () => {
  const d = evaluarAcceso({ requiereSesion: true, requiereJugador: true }, ORGANIZADOR);
  return d.nombre === 'mi-cuenta' && d.conRedir === undefined;
});
await t('requiereJugador sin cuenta: va a acceder', () => {
  const d = evaluarAcceso({ requiereSesion: true, requiereJugador: true }, null);
  return d.nombre === 'acceder' && d.conRedir === true;
});
await t('requiereJugador con jugador: acceso libre', () =>
  evaluarAcceso({ requiereSesion: true, requiereJugador: true }, JUGADOR) === true);

// 2 · Verificación de correo
const alta = await CuentasRepository.registrar({
  rol: 'player', nombre: 'Prueba', email: 'seguridad@prueba.mx', clave: 'clave1234'
});
const id = alta.cuenta.id;
await t('la cuenta recién registrada nace sin verificar', () =>
  alta.cuenta.correoVerificado === false);
await t('verificarCorreo marca el correo', async () => {
  const r = await CuentasRepository.verificarCorreo(id);
  return r.ok === true && (await CuentasRepository.getPorId(id)).correoVerificado === true;
});
await t('verificarCorreo falla con cuenta inexistente', async () =>
  (await CuentasRepository.verificarCorreo('user-xyz')).ok === false);
await t('la cuenta demo del organizador viene verificada', async () =>
  (await CuentasRepository.getDemo('organizer')).correoVerificado === true);
await t('la cuenta demo del jugador viene sin verificar', async () =>
  (await CuentasRepository.getDemo('player')).correoVerificado === false);
await t('cambiar el correo invalida la verificación', async () => {
  await CuentasRepository.actualizar(id, { email: 'seguridad2@prueba.mx' });
  const c = await CuentasRepository.getPorId(id);
  return c.correoVerificado === false && c.email === 'seguridad2@prueba.mx';
});
await t('verificar de nuevo y conservar el correo', async () => {
  await CuentasRepository.verificarCorreo(id);
  await CuentasRepository.actualizar(id, { apellidos: 'Dos' });
  const c = await CuentasRepository.getPorId(id);
  return c.correoVerificado === true;
});

// 3 · Último acceso
await t('el acceso correcto registra ultimoAcceso (ISO)', async () => {
  const r = await CuentasRepository.acceder({ email: 'seguridad2@prueba.mx', clave: 'clave1234' });
  return r.ok === true && !Number.isNaN(Date.parse(r.cuenta.ultimoAcceso));
});
await t('ultimoAcceso queda persistido en la cuenta propia', () => {
  const crudo = mem.get('ajedrezmx-cuentas-demo') || '';
  return crudo.includes('ultimoAcceso') && crudo.includes('seguridad2@prueba.mx');
});

// 4 · Bloqueo por intentos fallidos
const CORREO = 'seguridad2@prueba.mx';
const motivos = [];
for (let i = 0; i < 5; i += 1) {
  motivos.push((await CuentasRepository.acceder({ email: CORREO, clave: 'mala' })).motivo);
}
await t('los primeros fallos no revelan cuántos intentos quedan', () =>
  !motivos[0].includes('quedan') && !motivos[1].includes('quedan'));
await t('avisa intentos restantes cuando quedan pocos', () =>
  motivos[2].includes('Te quedan 2 intentos') && motivos[3].includes('Te quedan 1 intento'));
await t('tras 5 fallos la cuenta queda bloqueada', async () => {
  const r = await CuentasRepository.acceder({ email: CORREO, clave: 'clave1234' });
  return r.ok === false && /bloqueada/i.test(r.motivo) && /min/.test(r.motivo);
});
await t('el bloqueo expira solo y deja entrar de nuevo', async () => {
  const c = await CuentasRepository.getPorId(id);
  c.bloqueadaHasta = Date.now() - 1000;
  const r = await CuentasRepository.acceder({ email: CORREO, clave: 'clave1234' });
  return r.ok === true && c.bloqueadaHasta === null && c.intentosFallidos === 0;
});

// 5 · El bloqueo se levanta al recuperar la contraseña
async function bloquear(correo) {
  for (let i = 0; i < 5; i += 1) {
    await CuentasRepository.acceder({ email: correo, clave: 'mala' });
  }
  return CuentasRepository.acceder({ email: correo, clave: 'clave1234' });
}
await t('restablecer la contraseña desbloquea la cuenta', async () => {
  const correo = 'contacto@ajedrezxalapa.mx';
  const bloqueada = await bloquear(correo);
  if (bloqueada.ok) return 'no se pudo bloquear la cuenta demo';
  const sol = await CuentasRepository.solicitarRecuperacion(correo);
  const r = await CuentasRepository.restablecerClave({
    email: correo, codigo: sol.codigo, claveNueva: 'nuevaclave7'
  });
  const acceso = await CuentasRepository.acceder({ email: correo, clave: 'nuevaclave7' });
  return r.ok && acceso.ok;
});
await t('cambiar la contraseña con la actual también desbloquea', async () => {
  const correo = 'ana.torres@correo.mx';
  const bloqueada = await bloquear(correo);
  if (bloqueada.ok) return 'no se pudo bloquear la cuenta demo';
  const r = await CuentasRepository.cambiarClave({
    id: 'user-demo-jugador', claveActual: 'demo1234', claveNueva: 'jugador1234'
  });
  const acceso = await CuentasRepository.acceder({ email: correo, clave: 'jugador1234' });
  return r.ok && acceso.ok;
});

// 6 · Límite de intentos y de reenvíos del código de recuperación
const REC = 'recuperacion@prueba.mx';
await t('el código admite 5 intentos y luego se invalida', async () => {
  await CuentasRepository.registrar({ rol: 'player', nombre: 'Rec', email: REC, clave: 'clave1234' });
  const sol = await CuentasRepository.solicitarRecuperacion(REC);
  const motivos = [];
  for (let i = 0; i < 5; i += 1) {
    motivos.push((await CuentasRepository.restablecerClave({
      email: REC, codigo: '000000', claveNueva: 'nuevaclave1'
    })).motivo);
  }
  const conCodigo = await CuentasRepository.restablecerClave({
    email: REC, codigo: sol.codigo, claveNueva: 'nuevaclave1'
  });
  const acceso = await CuentasRepository.acceder({ email: REC, clave: 'nuevaclave1' });
  return /quedan 4 intentos/.test(motivos[0]) && /quedan 1 intento\./.test(motivos[3])
    && /Demasiados intentos/.test(motivos[4]) && conCodigo.ok === false
    && /Solicita uno nuevo/.test(conCodigo.motivo) && acceso.ok === false;
});
await t('en la misma ventana se permiten 3 códigos y el cuarto se rechaza', async () => {
  const p1 = await CuentasRepository.solicitarRecuperacion(REC);
  const p2 = await CuentasRepository.solicitarRecuperacion(REC);
  const p3 = await CuentasRepository.solicitarRecuperacion(REC);
  const p4 = await CuentasRepository.solicitarRecuperacion(REC);
  return p1.ok && p2.ok && p3.ok && p4.ok === false && /varios códigos/.test(p4.motivo);
});
await t('el código vigente sigue sirviendo aunque se hayan reenviado varios', async () => {
  // Tras el límite de reenvíos hay que esperar a que expire la ventana, así que
  // el código que quedó pendiente es el único que debe servir.
  const pendiente = JSON.parse(mem.get('ajedrezmx-recuperacion') || '{}');
  const r = await CuentasRepository.restablecerClave({
    email: REC, codigo: pendiente.codigo, claveNueva: 'recuperada1'
  });
  const acceso = await CuentasRepository.acceder({ email: REC, clave: 'recuperada1' });
  return r.ok === true && acceso.ok === true;
});

console.log(pruebas.join('\n'));
console.log(`\n${ok} PASS / ${fail} FAIL de ${ok + fail}`);
process.exit(fail ? 1 : 0);


