/**
 * Smoke Fase 5 · USUARIO ORGANIZADOR (core/organizadoresRepository.js).
 *
 * Es el archivo que se probará PRIMERO contra Supabase: cubre el alta, el
 * perfil, la organización, los datos de cobro, la conexión de Mercado Pago, la
 * migración del modelo anterior y la baja. Un solo módulo bajo prueba.
 * Ejecutar: npm test  (o: node tests/smoke/05-organizador.mjs)
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
const { OrganizadoresRepository, organizadoresListos } =
  await import(base + 'core/organizadoresRepository.js');
const { CuentasRepository, cuentasListas } = await import(base + 'core/cuentasRepository.js');
const { Sesion } = await import(base + 'core/sesion.js');
await Promise.all([organizadoresListos, cuentasListas]);

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
const CUENTA_DEMO = 'user-demo-organizador';

/** Formulario completo del asistente de alta (3 pasos), como lo manda la vista. */
const ALTA = {
  rol: 'organizer', nombre: 'Club Noble', email: 'club@noble.mx',
  clave: 'clave1234', confirmar: 'clave1234',
  organizacion: 'Club Noble', giro: 'Escuela', telefono: '5512345678',
  ciudad: 'Puebla', estado: 'Puebla', web: 'https://noble.mx',
  mpEmail: 'MP@Noble.mx', tipoPersona: 'fisica', rfc: 'gode561231gr8',
  razonSocial: '', regimen: '612', cpFiscal: '72000', clabe: CLABE_OK,
  aceptaTerminos: true
};

// 1 · Validaciones del asistente (una sola fuente para registro y edición)
await t('paso 1 exige nombre, correo, contraseña y confirmación', () =>
  OrganizadoresRepository.validarPasoCuenta({ ...ALTA, nombre: ' ' }) === 'Escribe tu nombre.'
  && /correo/.test(OrganizadoresRepository.validarPasoCuenta({ ...ALTA, email: 'malo' }))
  && /8 caracteres/.test(OrganizadoresRepository.validarPasoCuenta({ ...ALTA, clave: 'corta' }))
  && /no coinciden/.test(OrganizadoresRepository.validarPasoCuenta({ ...ALTA, confirmar: 'otra12345' })));
await t('paso 1 exige aceptar términos al organizador (el jugador no los firma)', () =>
  /términos/.test(OrganizadoresRepository.validarPasoCuenta({ ...ALTA, aceptaTerminos: false }))
  && OrganizadoresRepository.validarPasoCuenta({ ...ALTA, rol: 'player', aceptaTerminos: false }) === ''
  && OrganizadoresRepository.validarPasoCuenta(ALTA) === '');
await t('paso 2 exige organización y celular de 10 dígitos', () =>
  /organización/.test(OrganizadoresRepository.validarPasoOrganizacion({ ...ALTA, organizacion: '' }))
  && /10 dígitos/.test(OrganizadoresRepository.validarPasoOrganizacion({ ...ALTA, telefono: '551234567' }))
  && OrganizadoresRepository.validarPasoOrganizacion(ALTA) === '');
await t('paso 3 usa las reglas fiscales compartidas', () =>
  OrganizadoresRepository.validarPasoCobro(ALTA) === ''
  && /RFC/.test(OrganizadoresRepository.validarPasoCobro({ ...ALTA, rfc: 'CORTITO' }))
  && /CLABE/.test(OrganizadoresRepository.validarPasoCobro({ ...ALTA, clabe: '1' })));
await t('validarAlta señala el primer paso con error', () => {
  const paso1 = OrganizadoresRepository.validarAlta({ ...ALTA, aceptaTerminos: false });
  const paso2 = OrganizadoresRepository.validarAlta({ ...ALTA, telefono: '' });
  const paso3 = OrganizadoresRepository.validarAlta({ ...ALTA, cpFiscal: '72' });
  const bien = OrganizadoresRepository.validarAlta(ALTA);
  return paso1.enPaso === 1 && paso2.enPaso === 2 && paso3.enPaso === 3
    && bien.enPaso === 0 && bien.motivo === '';
});


// 2 · Alta desde el registro (insert into organizations)
const alta = await CuentasRepository.registrar({
  rol: 'organizer', nombre: ALTA.nombre, email: ALTA.email, clave: ALTA.clave,
  extras: {
    organizacion: ALTA.organizacion, giro: ALTA.giro, telefono: ALTA.telefono,
    ciudad: ALTA.ciudad, estado: ALTA.estado, web: ALTA.web, mpEmail: ALTA.mpEmail,
    tipoPersona: ALTA.tipoPersona, rfc: ALTA.rfc, razonSocial: ALTA.razonSocial,
    regimen: ALTA.regimen, cpFiscal: ALTA.cpFiscal, clabe: ALTA.clabe,
    aceptaTerminos: ALTA.aceptaTerminos
  }
});
const CUENTA = alta.cuenta ? alta.cuenta.id : null;

await t('el alta del organizador crea su fila con id estable', async () => {
  const fila = await OrganizadoresRepository.getPorCuenta(CUENTA);
  return alta.ok === true && Boolean(fila) && /^org-/.test(fila.id)
    && fila.organizacion === 'Club Noble' && fila.giro === 'Escuela';
});
await t('el alta normaliza el RFC y el correo de Mercado Pago', async () => {
  const fila = await OrganizadoresRepository.getPorCuenta(CUENTA);
  return fila.rfc === RFC_FISICA && fila.mpEmail === 'mp@noble.mx'
    && fila.mpEstado === 'conectado';
});
await t('la cuenta no guarda la organización dentro de sí misma', async () => {
  const cuenta = await CuentasRepository.getPorId(CUENTA);
  return cuenta.organizacion === undefined && cuenta.organizadorId === undefined
    && cuenta.datosOrganizador === undefined && cuenta.aceptaTerminos === true;
});
await t('el perfil reúne la fila con el nombre y el correo de la cuenta', async () => {
  const perfil = await OrganizadoresRepository.getPerfil(await CuentasRepository.getPorId(CUENTA));
  const fila = await OrganizadoresRepository.getPorCuenta(CUENTA);
  return perfil.id === fila.id && perfil.nombre === 'Club Noble'
    && perfil.email === 'club@noble.mx' && perfil.cuentaId === undefined
    && perfil.demo === undefined;
});
await t('la sesión del organizador expone ese mismo perfil', async () => {
  await Sesion.iniciar(CUENTA);
  const desdeSesion = await Sesion.getOrganizador();
  const desdeModulo = await OrganizadoresRepository.getPerfil(await CuentasRepository.getPorId(CUENTA));
  return JSON.stringify(desdeSesion) === JSON.stringify(desdeModulo);
});
await t('el perfil de un jugador (o de una cuenta sin fila) es null', async () =>
  (await OrganizadoresRepository.getPerfil(await CuentasRepository.getPorId('user-demo-jugador'))) === null
  && (await OrganizadoresRepository.getPerfil({ id: 'user-x', rol: 'organizer' })) === null);
await t('una cuenta no puede tener dos filas de organización', async () =>
  (await OrganizadoresRepository.crear({
    cuentaId: CUENTA, nombre: 'Otra', email: 'otra@noble.mx'
  })).ok === false);

// 3 · Organización (la edita "Mi cuenta")
await t('actualizarOrganizacion guarda la ficha y valida el celular', async () => {
  const malo = await OrganizadoresRepository.actualizarOrganizacion(CUENTA, { telefono: '123' });
  const bien = await OrganizadoresRepository.actualizarOrganizacion(CUENTA, {
    organizacion: 'Club Noble de Puebla', giro: 'Club o academia',
    ciudad: 'Puebla', telefono: '2221234567'
  });
  const fila = await OrganizadoresRepository.getPorCuenta(CUENTA);
  return malo.ok === false && bien.ok === true
    && fila.organizacion === 'Club Noble de Puebla' && fila.telefono === '2221234567';
});
await t('la organización y el cobro no se pisan entre sí', async () => {
  await OrganizadoresRepository.actualizarCobro(CUENTA, { mpEmail: 'cobros@noble.mx' });
  const fila = await OrganizadoresRepository.getPorCuenta(CUENTA);
  return fila.mpEmail === 'cobros@noble.mx' && fila.organizacion === 'Club Noble de Puebla';
});
await t('editar la organización de una cuenta sin fila falla con motivo', async () => {
  const r = await OrganizadoresRepository.actualizarOrganizacion('user-demo-jugador', { giro: 'Escuela' });
  return r.ok === false && Boolean(r.motivo);
});

// 4 · Datos de cobro y Mercado Pago (los edita "Cobros y cuenta")
await t('actualizarCobro valida el conjunto fiscal completo', async () => {
  const malos = [
    await OrganizadoresRepository.actualizarCobro(CUENTA, { rfc: 'CORTITO' }),
    await OrganizadoresRepository.actualizarCobro(CUENTA, { cpFiscal: '72' }),
    await OrganizadoresRepository.actualizarCobro(CUENTA, { clabe: '012180000000000658' }),
    await OrganizadoresRepository.actualizarCobro(CUENTA, { mpEmail: 'no-correo' })
  ];
  const bien = await OrganizadoresRepository.actualizarCobro(CUENTA, {
    tipoPersona: 'moral', rfc: 'aaa010101aaa', razonSocial: 'Club Noble, A.C.',
    regimen: '601', cpFiscal: '72000', clabe: CLABE_OK
  });
  const fila = await OrganizadoresRepository.getPorCuenta(CUENTA);
  return malos.every((m) => m.ok === false && Boolean(m.motivo)) && bien.ok === true
    && fila.rfc === 'AAA010101AAA' && fila.tipoPersona === 'moral' && fila.regimen === '601';
});
await t('conectarMercadoPago exige correo válido y deja el estado conectado', async () => {
  const fila = await OrganizadoresRepository.getPorCuenta(CUENTA);
  fila.mpEstado = 'pendiente';
  fila.mpEmail = '';
  const sinCorreo = await OrganizadoresRepository.conectarMercadoPago(CUENTA);
  await OrganizadoresRepository.actualizarCobro(CUENTA, { mpEmail: 'PAGOS@Noble.mx' });
  fila.mpEstado = 'pendiente';
  const bien = await OrganizadoresRepository.conectarMercadoPago(CUENTA);
  return sinCorreo.ok === false && bien.ok === true
    && fila.mpEstado === 'conectado' && fila.mpEmail === 'pagos@noble.mx';
});
await t('los datos de cobro de una cuenta sin fila fallan con motivo', async () =>
  (await OrganizadoresRepository.actualizarCobro('user-demo-jugador', { cpFiscal: '72000' })).ok === false
  && (await OrganizadoresRepository.conectarMercadoPago('user-demo-jugador')).ok === false);

// 5 · Persistencia de la tabla (solo las cuentas propias)
await t('la fila propia se persiste sin la contraseña de la cuenta', () => {
  const crudo = mem.get('ajedrezmx-organizadores-demo') || '';
  return crudo.includes('Club Noble') && crudo.includes('pagos@noble.mx')
    && !crudo.includes('clave1234') && !crudo.includes(CUENTA_DEMO);
});
await t('la fila del club de prueba no se persiste (se reinstala al recargar)', () => {
  const filas = JSON.parse(mem.get('ajedrezmx-organizadores-demo') || '[]');
  return Array.isArray(filas) && filas.length > 0 && filas.every((f) => f.demo === false);
});

// 6 · Migración del modelo anterior (los datos vivían dentro de la cuenta)
await t('migrarDeCuenta traspasa la organización y el cobro a la fila', async () => {
  const fila = await OrganizadoresRepository.migrarDeCuenta({
    id: 'user-viejo', rol: 'organizer', nombre: 'Org Vieja', email: 'viejo@noble.mx',
    organizacion: 'Org Vieja', organizadorId: 'org-viejo', demo: false,
    datosOrganizador: {
      giro: 'Escuela', telefono: '2221112233', mpEmail: 'viejo@noble.mx',
      tipoPersona: 'fisica', rfc: RFC_FISICA, regimen: '601', cpFiscal: '72000',
      clabe: CLABE_OK, mpEstado: 'pendiente'
    }
  });
  const perfil = await OrganizadoresRepository.getPerfil({
    id: 'user-viejo', rol: 'organizer', email: 'viejo@noble.mx'
  });
  return fila.id === 'org-viejo' && perfil.nombre === 'Org Vieja'
    && perfil.mpEstado === 'pendiente' && perfil.rfc === RFC_FISICA
    && (await OrganizadoresRepository.getPorId('org-viejo')) !== null;
});
await t('migrar una cuenta ya migrada no duplica la fila', async () => {
  const antes = await OrganizadoresRepository.getPorCuenta('user-viejo');
  const otra = await OrganizadoresRepository.migrarDeCuenta({
    id: 'user-viejo', rol: 'organizer', organizacion: 'Org Vieja'
  });
  const despues = await OrganizadoresRepository.getPorCuenta('user-viejo');
  return antes.id === despues.id && otra.id === antes.id;
});
await t('migrar una cuenta de jugador no hace nada', async () =>
  (await OrganizadoresRepository.migrarDeCuenta({ id: 'user-x', rol: 'player' })) === null);

// 7 · Club de prueba (respaldo del panel sin sesión)
await t('la fila semilla de la demo trae el perfil completo', async () => {
  const demo = await OrganizadoresRepository.getPerfilDemo();
  return demo.id === 'org-demo' && demo.nombre === 'Club de Ajedrez Xalapa'
    && demo.email === 'contacto@ajedrezxalapa.mx' && Boolean(demo.rfc && demo.clabe);
});

// 8 · Baja de la cuenta (derecho de supresión)
await t('eliminar la cuenta del organizador borra también su fila', async () => {
  const otra = await CuentasRepository.registrar({
    rol: 'organizer', nombre: 'Org Borrable', email: 'orgborrable@noble.mx', clave: 'clave1234',
    extras: { organizacion: 'Org Borrable', telefono: '2221112233', aceptaTerminos: true }
  });
  if (!otra.ok) return 'no se pudo crear la cuenta de prueba';
  const antes = await OrganizadoresRepository.getPorCuenta(otra.cuenta.id);
  const r = await CuentasRepository.eliminarCuenta({ id: otra.cuenta.id, clave: 'clave1234' });
  const despues = await OrganizadoresRepository.getPorCuenta(otra.cuenta.id);
  return Boolean(antes) && r.ok === true && despues === null;
});
await t('eliminarDe borra la fila y deja el perfil en null', async () => {
  const r = await OrganizadoresRepository.eliminarDe(CUENTA);
  const luego = await OrganizadoresRepository.getPorCuenta(CUENTA);
  const perfil = await OrganizadoresRepository.getPerfil(await CuentasRepository.getPorId(CUENTA));
  return r.ok === true && luego === null && perfil === null;
});
await t('eliminar una fila que ya no está responde con error', async () =>
  (await OrganizadoresRepository.eliminarDe(CUENTA)).ok === false);

console.log(pruebas.join('\n'));
console.log(`\n${ok} PASS / ${fail} FAIL de ${ok + fail}`);
process.exit(fail ? 1 : 0);
