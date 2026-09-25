/**
 * Smoke Fase 4 · P0 (contraseña en alta, playerId estable, nombre tolerante)
 * + edición de datos de cobro del organizador.
 * Ejecutar: npm test  (o: node tests/smoke/04-cobro-y-nombres.mjs)
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
const { PlayersRepository } = await import(base + 'core/playersRepository.js');
const { RegistrationsRepository } = await import(base + 'core/registrationsRepository.js');
const { clabeValida, rfcValido, cobroValido } = await import(base + 'utils/validacionesFiscales.js');
const { Formatters } = await import(base + 'utils/formatters.js');
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

const CLABE_OK = '012180000000000659'; // 18 dígitos, DV válido
const RFC_FISICA = 'GODE561231GR8';
const RFC_MORAL = 'AAA010101AAA';

// 1 · Validaciones fiscales compartidas
await t('clabeValida acepta una CLABE correcta', () => clabeValida(CLABE_OK) === true);
await t('clabeValida rechaza longitud y DV', () =>
  clabeValida('012180000000000658') === false && clabeValida('123') === false);
await t('rfcValido distingue persona física y moral', () =>
  rfcValido(RFC_FISICA, 'fisica') === true
  && rfcValido(RFC_MORAL, 'moral') === true
  && rfcValido(RFC_MORAL, 'fisica') === false);
await t('cobroValido usa el correo de la cuenta si mpEmail viene vacío', () => {
  const base = { tipoPersona: 'fisica', rfc: RFC_FISICA, cpFiscal: '91000', clabe: CLABE_OK };
  return cobroValido({ ...base, email: 'org@prueba.mx' }) === ''
    && cobroValido({ ...base, mpEmail: 'malo' }) !== '';
});
await t('cobroValido detecta cada dato faltante con su motivo', () => {
  const base = { mpEmail: 'mp@prueba.mx', tipoPersona: 'fisica', rfc: RFC_FISICA, cpFiscal: '91000', clabe: CLABE_OK };
  const motivos = [
    cobroValido({ ...base, rfc: 'X' }),
    cobroValido({ ...base, cpFiscal: '91' }),
    cobroValido({ ...base, clabe: '1' }),
    cobroValido({ ...base, tipoPersona: 'moral', rfc: RFC_MORAL, razonSocial: ' ' })
  ];
  return motivos.every((m) => typeof m === 'string' && m.length > 0);
});

// 2 · Edición de datos de cobro
const ORG = 'user-demo-organizador';
await t('actualizarCobro rechaza correo de MP inválido', async () =>
  (await CuentasRepository.actualizarCobro(ORG, { mpEmail: 'no-correo' })).ok === false);
await t('actualizarCobro rechaza RFC inválido', async () =>
  (await CuentasRepository.actualizarCobro(ORG, { rfc: 'CORTITO' })).ok === false);
await t('actualizarCobro rechaza CLABE con DV incorrecto', async () =>
  (await CuentasRepository.actualizarCobro(ORG, { clabe: '012180000000000658' })).ok === false);
await t('actualizarCobro guarda y normaliza el RFC a mayúsculas', async () => {
  const r = await CuentasRepository.actualizarCobro(ORG, {
    mpEmail: 'mp.nuevo@prueba.mx', rfc: RFC_MORAL, tipoPersona: 'moral',
    razonSocial: 'Club de Prueba', regimen: '601', cpFiscal: '91000', clabe: CLABE_OK
  });
  const org = perfilOrganizador(await CuentasRepository.getPorId(ORG));
  return r.ok && org.mpEmail === 'mp.nuevo@prueba.mx' && org.rfc === RFC_MORAL
    && org.clabe === CLABE_OK && org.razonSocial === 'Club de Prueba';
});
await t('actualizarCobro no toca la organización', async () => {
  const org = perfilOrganizador(await CuentasRepository.getPorId(ORG));
  return org.organizacion === 'Club de Ajedrez Xalapa' && Boolean(org.giro);
});
await t('actualizarCobro no aplica a cuentas de jugador', async () =>
  (await CuentasRepository.actualizarCobro('user-demo-jugador', { cpFiscal: '91000' })).ok === false);
await t('conectarMercadoPago deja la cuenta conectada', async () => {
  const cuenta = await CuentasRepository.getPorId(ORG);
  cuenta.datosOrganizador = { ...cuenta.datosOrganizador, mpEstado: 'pendiente' };
  const r = await CuentasRepository.conectarMercadoPago(ORG);
  return r.ok && perfilOrganizador(await CuentasRepository.getPorId(ORG)).mpEstado === 'conectado';
});
await t('los datos de cobro de una cuenta propia quedan persistidos sin contraseña', async () => {
  // Las cuentas demo no se guardan en localStorage (por diseño): para probar la
  // persistencia se usa una cuenta de organizador creada aquí.
  const alta = await CuentasRepository.registrar({
    rol: 'organizer', nombre: 'Org Persist', email: 'orgpersist@prueba.mx', clave: 'clave1234',
    extras: {
      organizacion: 'Org Persist', giro: 'Club o academia', telefono: '5512345678',
      mpEmail: 'mp.persist@prueba.mx', tipoPersona: 'fisica', rfc: RFC_FISICA,
      regimen: '601', cpFiscal: '91000', clabe: CLABE_OK, aceptaTerminos: true
    }
  });
  if (!alta.ok) return 'no se pudo crear la cuenta de prueba';
  await CuentasRepository.actualizarCobro(alta.cuenta.id, { mpEmail: 'mp.persist2@prueba.mx' });
  const crudo = mem.get('ajedrezmx-cuentas-demo') || '';
  return crudo.includes('mp.persist2@prueba.mx') && crudo.includes('orgpersist@prueba.mx')
    && !crudo.includes('clave1234') && !crudo.includes('mp.persist2@prueba.mx".:1234');
});

// 3 · playerId estable (rehidratación)
await t('crearJugador respeta el id informado', async () => {
  const j = await PlayersRepository.crearJugador({ id: 'j-estable', nombre: 'Estable', apellidos: 'Uno' });
  return j.id === 'j-estable';
});
await t('crearJugador con el mismo id no recrea el perfil', async () => {
  const otro = await PlayersRepository.crearJugador({ id: 'j-estable', nombre: 'Otro' });
  const mismo = await PlayersRepository.getPorId('j-estable');
  // Si hubiera duplicado, el nombre del perfil sería el de la segunda llamada.
  return otro.id === 'j-estable' && mismo.nombre === 'Estable';
});

// 4 · Nombre tolerante (perfil anonimizado)
await t('Formatters.nombre omite los apellidos vacíos', () =>
  Formatters.nombre({ nombre: 'Eliminado', apellidos: null }) === 'Eliminado'
  && Formatters.nombre({ nombre: 'Ana', apellidos: 'Torres' }) === 'Torres Ana'
  && Formatters.nombre(null) === '');
await t('el panel no muestra "null" tras anonimizar al jugador', async () => {
  const mias = await RegistrationsRepository.getPorJugador('j1');
  if (!mias.length) return 'el jugador demo no tiene inscripciones';
  const torneoId = mias[0].torneoId;
  await PlayersRepository.anonimizar('j1');
  const filas = await RegistrationsRepository.getParticipantes(torneoId);
  const fila = filas.find((f) => f.playerId === 'j1');
  return fila && fila.nombreJugador === 'Eliminado' && !fila.nombreJugador.includes('null');
});

console.log(pruebas.join('\n'));
console.log(`\n${ok} PASS / ${fail} FAIL de ${ok + fail}`);
process.exit(fail ? 1 : 0);


