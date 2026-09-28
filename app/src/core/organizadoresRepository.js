/**
 * Núcleo de dominio: USUARIO ORGANIZADOR (un solo archivo).
 *
 * TODA la lógica del organizador vive aquí —alta desde el registro en 3 pasos,
 * perfil de la sesión, ficha de la organización, datos de cobro de Mercado Pago
 * y datos fiscales, verificación de la conexión, migración del modelo anterior
 * y baja de la cuenta— para que conectar Supabase sea cambiar el origen de
 * datos de UN archivo.
 *
 * Tabla `organizations` (1:1 con la cuenta de auth):
 *   id            uuid pk   id estable del organizador (los torneos lo referencian)
 *   user_id       uuid fk   → auth.users.id (id de la cuenta)
 *   organizacion  text
 *   giro          text
 *   telefono      text
 *   ciudad        text
 *   estado        text
 *   web           text
 *   mp_email      text
 *   tipo_persona  text      'fisica' | 'moral'
 *   rfc           text
 *   razon_social  text
 *   regimen       text
 *   cp_fiscal     text
 *   clabe         text
 *   mp_estado     text      'conectado' | 'pendiente'
 *
 * Operación local ↔ operación en Supabase:
 *   crear()                   → insert into organizations (user_id, …) returning *
 *   getPorCuenta()            → select * from organizations where user_id = $1
 *   getPerfil()               → la fila anterior + nombre y correo de la cuenta
 *   actualizarOrganizacion()  → update organizations set … where user_id = $1
 *   actualizarCobro()         → update organizations set … where user_id = $1
 *   conectarMercadoPago()     → edge function con el token OAuth (nunca la tarjeta)
 *   eliminarDe()              → delete from organizations where user_id = $1
 *
 * En la demo la fila se guarda en localStorage (solo las cuentas propias) y se
 * restaura al recargar. El módulo NO conoce cuentasRepository: recibe el id de
 * la cuenta y devuelve datos, así se puede probar solo y contra Supabase.
 */
import { generarId } from '../utils/ids.js';
import { esCorreo, claveAceptable } from '../utils/validacionesCuenta.js';
import { cobroValido } from '../utils/validacionesFiscales.js';
import { ORGANIZADOR_DEMO } from '../data/mockRelacional.js';

const CLAVE_ALMACEN = 'ajedrezmx-organizadores-demo';
const GIRO_POR_DEFECTO = 'Club o academia';
const REGIMEN_POR_DEFECTO = '605';
const TIPOS_PERSONA = ['fisica', 'moral'];
const ESTADOS_MP = ['conectado', 'pendiente'];
/** Celular mexicano: 10 dígitos, sin lada ni espacios. */
const CELULAR = /^\d{10}$/;

/** Campos de la ficha de organización (los edita "Mi cuenta"). */
const CAMPOS_ORGANIZACION = ['organizacion', 'giro', 'telefono', 'ciudad', 'estado', 'web'];
/** Campos de cobro (Mercado Pago + fiscales); los edita "Cobros y cuenta". */
const CAMPOS_COBRO = ['mpEmail', 'tipoPersona', 'rfc', 'razonSocial', 'regimen', 'cpFiscal', 'clabe'];
/** Campos de texto de la fila: se recortan siempre antes de guardar. */
const CAMPOS_TEXTO = [...CAMPOS_ORGANIZACION, ...CAMPOS_COBRO, 'mpEstado'];

/** Datos de cobro del club de prueba (su id/nombre/correo viven en la cuenta). */
const { id: ID_DEMO, nombre: NOMBRE_DEMO, email: EMAIL_DEMO, ...cobroDemo } = ORGANIZADOR_DEMO;

/**
 * Filas en memoria (la "tabla" organizations).
 * La primera es la del club de prueba (se reinstala al recargar); las demás son
 * cuentas propias y se persisten en el navegador.
 */
const ORGANIZADORES = [
  { id: ID_DEMO, cuentaId: 'user-demo-organizador', demo: true, ...normalizar(cobroDemo) }
];

/** Copia solo los campos indicados, recortando los de texto. */
function soloCampos(datos, campos) {
  const salida = {};
  for (const campo of campos) {
    if (!datos || datos[campo] === undefined) continue;
    salida[campo] = String(datos[campo] ?? '').trim();
  }
  return salida;
}

/** Normaliza la fila: recorta el texto, sube el RFC y baja el correo de MP. */
function normalizar(datos = {}) {
  const fila = soloCampos(datos, CAMPOS_TEXTO);
  if (fila.rfc) fila.rfc = fila.rfc.toUpperCase();
  if (fila.mpEmail) fila.mpEmail = fila.mpEmail.toLowerCase();
  return fila;
}

/** Guarda las filas propias (las de prueba se reinstalan al recargar). */
function guardar() {
  try {
    const propias = ORGANIZADORES.filter((o) => !o.demo).map((o) => ({ ...o }));
    window.localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(propias));
  } catch { /* demo: sin localStorage disponible */ }
}

/** Restaura las filas guardadas en el navegador. */
async function hidratar() {
  let guardadas = [];
  try {
    guardadas = JSON.parse(window.localStorage.getItem(CLAVE_ALMACEN) || '[]');
  } catch {
    guardadas = [];
  }
  for (const fila of guardadas) {
    if (!fila || !fila.id || !fila.cuentaId) continue;
    if (ORGANIZADORES.some((o) => o.id === fila.id || o.cuentaId === fila.cuentaId)) continue;
    ORGANIZADORES.push({ ...fila });
  }
}

/**
 * Preparación inicial del módulo (promesa): nadie lo lee "a medio preparar",
 * igual que cuentasListas en las cuentas.
 */
export const organizadoresListos = (async () => {
  await hidratar();
})();

export const OrganizadoresRepository = {
  // ── Validaciones del alta y de la edición (fuente única) ──────────────────

  /** Paso 1 · cuenta de acceso (la comparte el alta de jugador). */
  validarPasoCuenta(datos = {}) {
    if (!String(datos.nombre || '').trim()) return 'Escribe tu nombre.';
    if (!esCorreo(datos.email)) return 'Escribe un correo válido.';
    const motivoClave = claveAceptable(datos.clave);
    if (motivoClave) return motivoClave;
    if (datos.clave !== datos.confirmar) return 'Las contraseñas no coinciden.';
    // Base legal del cobro: el organizador firma términos; el jugador no.
    if (datos.rol === 'organizer' && !datos.aceptaTerminos) {
      return 'Debes aceptar los términos y el aviso de privacidad.';
    }
    return '';
  },

  /** Paso 2 · organización. */
  validarPasoOrganizacion(datos = {}) {
    if (!String(datos.organizacion || '').trim()) return 'Escribe el nombre de la organización.';
    if (!CELULAR.test(String(datos.telefono || '').trim())) return 'El celular debe tener 10 dígitos.';
    return '';
  },

  /** Paso 3 · cobro (delega en las reglas fiscales compartidas). */
  validarPasoCobro(datos = {}) {
    return cobroValido(datos);
  },

  /**
   * Valida el alta completa y devuelve el PRIMER paso con error
   * (`{ enPaso, motivo }`; motivo vacío si todo está bien), para que el
   * asistente lleve al usuario al paso exacto que debe corregir.
   */
  validarAlta(datos = {}) {
    const pasos = [
      { enPaso: 1, motivo: this.validarPasoCuenta(datos) },
      { enPaso: 2, motivo: this.validarPasoOrganizacion(datos) },
      { enPaso: 3, motivo: this.validarPasoCobro(datos) }
    ];
    return pasos.find((p) => p.motivo) || { enPaso: 0, motivo: '' };
  },

  // ── Lectura ───────────────────────────────────────────────────────────────

  /** Fila del organizador de una cuenta (o null). */
  async getPorCuenta(cuentaId) {
    await organizadoresListos;
    if (!cuentaId) return null;
    return ORGANIZADORES.find((o) => o.cuentaId === cuentaId) || null;
  },

  /** Fila del organizador por su id (los torneos guardan organizadorId). */
  async getPorId(id) {
    await organizadoresListos;
    if (!id) return null;
    return ORGANIZADORES.find((o) => o.id === id) || null;
  },

  /** ¿La cuenta ya tiene su fila de organización? */
  async existePara(cuentaId) {
    return Boolean(await this.getPorCuenta(cuentaId));
  },

  /**
   * Perfil del organizador para la sesión y la exportación: la fila más el
   * nombre y el correo de la cuenta (en Supabase viven en profiles/auth.users).
   * Fuente única del perfil: `nombre` es el de la organización.
   * Devuelve null si la cuenta no es de organizador o no tiene fila.
   */
  async getPerfil(cuenta) {
    if (!cuenta || cuenta.rol !== 'organizer') return null;
    const fila = await this.getPorCuenta(cuenta.id);
    if (!fila) return null;
    const { cuentaId, demo, ...organizacion } = fila;
    return {
      id: fila.id,
      nombre: fila.organizacion || cuenta.nombre,
      email: cuenta.email,
      ...organizacion
    };
  },

  /**
   * Perfil del organizador de prueba: respaldo del panel cuando no hay sesión.
   * Se arma con la misma fila semilla (no es una copia aparte).
   */
  async getPerfilDemo() {
    await organizadoresListos;
    const fila = ORGANIZADORES.find((o) => o.demo);
    return this.getPerfil({
      id: fila ? fila.cuentaId : null,
      rol: 'organizer',
      nombre: NOMBRE_DEMO,
      email: EMAIL_DEMO
    });
  },

  // ── Escritura ─────────────────────────────────────────────────────────────

  /**
   * Fila canónica a partir de los datos de un formulario (registro o edición):
   * aplica los valores por defecto del esquema, como hará Supabase.
   */
  _filaDesdeDatos(datos = {}) {
    const limpio = normalizar(datos);
    return {
      organizacion: limpio.organizacion || '',
      giro: limpio.giro || GIRO_POR_DEFECTO,
      telefono: limpio.telefono || '',
      ciudad: limpio.ciudad || '',
      estado: limpio.estado || '',
      web: limpio.web || '',
      mpEmail: limpio.mpEmail || '',
      tipoPersona: TIPOS_PERSONA.includes(limpio.tipoPersona) ? limpio.tipoPersona : 'fisica',
      rfc: limpio.rfc || '',
      razonSocial: limpio.razonSocial || '',
      regimen: limpio.regimen || REGIMEN_POR_DEFECTO,
      cpFiscal: limpio.cpFiscal || '',
      clabe: limpio.clabe || '',
      mpEstado: ESTADOS_MP.includes(limpio.mpEstado) ? limpio.mpEstado : 'conectado'
    };
  },

  /**
   * Alta del organizador (la llama CuentasRepository.registrar cuando el rol es
   * organizer). En Supabase: insert into organizations (user_id, …) returning *.
   *
   * Acepta datos parciales a propósito: el asistente del registro ya exigió el
   * juego completo con validarAlta(); aquí se guarda lo que llegue y es la
   * edición de cobro (actualizarCobro) la que vuelve a validar el conjunto.
   */
  async crear({ cuentaId, nombre = '', email = '', datos = {} }) {
    await organizadoresListos;
    if (!cuentaId) return { ok: false, motivo: 'Falta la cuenta del organizador.' };
    if (await this.existePara(cuentaId)) {
      return { ok: false, motivo: 'Esa cuenta ya tiene una organización registrada.' };
    }
    const correo = String(email || '').trim().toLowerCase();
    // La organización toma el nombre de la cuenta si el formulario no lo trae,
    // y el correo de Mercado Pago, el de la cuenta (como en el registro).
    const base = {
      ...datos,
      organizacion: String(datos.organizacion || '').trim() || String(nombre || '').trim(),
      mpEmail: String(datos.mpEmail || '').trim() || correo
    };
    const organizador = {
      id: generarId('org'),
      cuentaId,
      demo: false,
      fechaCreacion: new Date().toISOString().slice(0, 10),
      ...this._filaDesdeDatos(base)
    };
    ORGANIZADORES.push(organizador);
    guardar();
    return { ok: true, organizador };
  },

  /**
   * Edita la ficha de la organización (la llama "Mi cuenta").
   * Valida solo los campos que llegan —así una ficha antigua e incompleta se
   * puede arreglar— y nunca toca los datos fiscales ni de cobro.
   */
  async actualizarOrganizacion(cuentaId, cambios = {}) {
    await organizadoresListos;
    const fila = await this.getPorCuenta(cuentaId);
    if (!fila) return { ok: false, motivo: 'Esta cuenta no tiene datos de organización.' };
    const limpios = soloCampos(cambios, CAMPOS_ORGANIZACION);
    if (limpios.organizacion !== undefined && !limpios.organizacion) {
      return { ok: false, motivo: 'Escribe el nombre de la organización.' };
    }
    if (limpios.telefono !== undefined && !CELULAR.test(limpios.telefono)) {
      return { ok: false, motivo: 'El celular debe tener 10 dígitos.' };
    }
    Object.assign(fila, limpios);
    guardar();
    return { ok: true, organizador: fila };
  },

  /**
   * Edita los datos de cobro (la llama "Cobros y cuenta"): correo de Mercado
   * Pago y datos fiscales. Valida el conjunto completo con las reglas
   * compartidas (utils/validacionesFiscales) y nunca toca la organización.
   */
  async actualizarCobro(cuentaId, cambios = {}) {
    await organizadoresListos;
    const fila = await this.getPorCuenta(cuentaId);
    if (!fila) return { ok: false, motivo: 'Esta cuenta no tiene datos de cobro.' };
    const datos = this._filaDesdeDatos({ ...fila, ...soloCampos(cambios, CAMPOS_COBRO) });
    const motivo = cobroValido(datos);
    if (motivo) return { ok: false, motivo };
    Object.assign(fila, datos);
    guardar();
    return { ok: true, organizador: fila };
  },

  /**
   * Marca la cuenta de Mercado Pago como conectada.
   * Demo: simula el OAuth Authorization Code; en producción el access_token lo
   * devuelve el backend y se guarda la conexión, nunca la tarjeta.
   */
  async conectarMercadoPago(cuentaId) {
    await organizadoresListos;
    const fila = await this.getPorCuenta(cuentaId);
    if (!fila) return { ok: false, motivo: 'Esta cuenta no tiene datos de cobro.' };
    const mpEmail = String(fila.mpEmail || '').trim().toLowerCase();
    if (!esCorreo(mpEmail)) {
      return { ok: false, motivo: 'Escribe un correo válido para tu cuenta de Mercado Pago.' };
    }
    fila.mpEmail = mpEmail;
    fila.mpEstado = 'conectado';
    guardar();
    return { ok: true, organizador: fila };
  },

  /**
   * Baja de la fila al eliminar la cuenta (derecho de supresión).
   * Los torneos publicados no se borran: son el registro de la organización.
   */
  async eliminarDe(cuentaId) {
    await organizadoresListos;
    const indice = ORGANIZADORES.findIndex((o) => o.cuentaId === cuentaId);
    if (indice === -1) return { ok: false, motivo: 'No había datos de organización.' };
    ORGANIZADORES.splice(indice, 1);
    guardar();
    return { ok: true };
  },

  /**
   * Migración del modelo anterior (Etapa 4): los datos del organizador vivían
   * DENTRO de la cuenta (`organizacion`, `organizadorId`, `datosOrganizador`).
   * Al hidratar se traspasan a esta tabla para que haya una sola fuente.
   * Devuelve la fila del organizador, o null si no hay nada que migrar.
   */
  async migrarDeCuenta(cuenta) {
    await organizadoresListos;
    if (!cuenta || cuenta.rol !== 'organizer') return null;
    const existente = await this.getPorCuenta(cuenta.id);
    if (existente) return existente;
    if (!cuenta.organizacion && !cuenta.datosOrganizador) return null;
    const organizador = {
      id: cuenta.organizadorId || generarId('org'),
      cuentaId: cuenta.id,
      demo: Boolean(cuenta.demo),
      fechaCreacion: String(cuenta.fechaCreacion || '').slice(0, 10)
        || new Date().toISOString().slice(0, 10),
      ...this._filaDesdeDatos({
        organizacion: cuenta.organizacion,
        mpEmail: cuenta.email,
        ...(cuenta.datosOrganizador || {})
      })
    };
    ORGANIZADORES.push(organizador);
    guardar();
    return organizador;
  }
};
