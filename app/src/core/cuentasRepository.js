/**
 * Núcleo de dominio: CUENTAS (Etapa 4 · registro con rol, demo).
 *
 * Mock de auth.users + profiles de Supabase: guarda cuentas con correo,
 * hash de contraseña y rol (player | organizer). Las cuentas creadas en la
 * demo se conservan en localStorage del navegador (solo el hash, nunca la
 * contraseña); al recargar se restauran y se vuelve a enlazar el perfil.
 */
import { PlayersRepository } from './playersRepository.js';
import { generarId } from '../utils/ids.js';
import { esCorreo, claveAceptable } from '../utils/validacionesCuenta.js';
import { ORGANIZADOR_DEMO } from '../data/mockRelacional.js';

const CLAVE_ALMACEN = 'ajedrezmx-cuentas-demo';
const CLAVE_DEMO = 'demo1234';
/* Contraseñas propias de las cuentas demo y códigos de recuperación pendientes. */
const CLAVE_DEMO_ALMACEN = 'ajedrezmx-claves-demo';
const CLAVE_RECUPERACION = 'ajedrezmx-recuperacion';
const RECUPERACION_MINUTOS = 15;
/* Seguridad de acceso: bloqueo temporal tras varios intentos fallidos. */
const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 10;

/**
 * Datos de cuenta y cobro de la cuenta de prueba de organizador.
 * Se toman de ORGANIZADOR_DEMO (fuente única) descartando el perfil base
 * (id/nombre/email), que vive en la cuenta y no dentro de los datos.
 */
const { id: _orgId, nombre: _orgNombre, email: _orgEmail, ...datosOrganizadorDemo } = ORGANIZADOR_DEMO;

/** Hash demo de la contraseña (SHA-256; respaldo simple si no hay crypto). */
async function hashClave(clave) {
  const semilla = `ajedrezmx:${clave}`;
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(semilla));
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    let hash = 2166136261;
    for (const ch of semilla) {
      hash ^= ch.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return `f${(hash >>> 0).toString(16)}`;
  }
}

/** Cuentas en memoria. Las dos primeras son accesos demo preinstalados. */
const CUENTAS = [
  {
    id: 'user-demo-jugador',
    rol: 'player',
    nombre: 'Ana',
    apellidos: 'Torres',
    email: 'ana.torres@correo.mx',
    playerId: 'j1',
    // Sin verificar a propósito: así se puede probar el aviso de "Mi cuenta".
    correoVerificado: false,
    demo: true
  },
  {
    id: 'user-demo-organizador',
    rol: 'organizer',
    nombre: 'Club de Ajedrez Xalapa',
    email: 'contacto@ajedrezxalapa.mx',
    organizadorId: 'org-demo',
    organizacion: 'Club de Ajedrez Xalapa',
    correoVerificado: true,
    demo: true,
    // Datos de prueba del panel de cobros (misma forma que el registro).
    datosOrganizador: { ...datosOrganizadorDemo }
  }
];

function guardar() {
  try {
    const propias = CUENTAS.filter((c) => !c.demo).map((c) => ({ ...c }));
    window.localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(propias));
  } catch { /* demo: sin localStorage disponible */ }
}

/** Restaura cuentas guardadas y vuelve a crear su perfil de jugador si falta. */
async function hidratar() {
  let guardadas = [];
  try {
    guardadas = JSON.parse(window.localStorage.getItem(CLAVE_ALMACEN) || '[]');
  } catch {
    guardadas = [];
  }
  for (const cuenta of guardadas) {
    if (CUENTAS.some((c) => c.id === cuenta.id)) continue;
    if (cuenta.rol === 'player') {
      // El jugador mock vive solo en memoria: se recrea desde la cuenta.
      const jugador = await PlayersRepository.crearJugador(cuenta.datosJugador || {});
      cuenta.playerId = jugador.id;
    }
    CUENTAS.push(cuenta);
  }
}

/** Lee un mapa simple ({ llave: valor }) de localStorage con tolerancia a fallos. */
function leerMapa(claveAlmacen) {
  try {
    return JSON.parse(window.localStorage.getItem(claveAlmacen) || '{}') || {};
  } catch {
    return {};
  }
}

/** Escribe un mapa simple en localStorage (demo: sin almacenamiento, se omite). */
function escribirMapa(claveAlmacen, mapa) {
  try {
    window.localStorage.setItem(claveAlmacen, JSON.stringify(mapa));
  } catch { /* sin localStorage disponible */ }
}

/** Copia solo los campos definidos, recortando los de tipo texto. */
function soloDefinidos(obj) {
  const salida = {};
  for (const [campo, valor] of Object.entries(obj || {})) {
    if (valor === undefined) continue;
    salida[campo] = typeof valor === 'string' ? valor.trim() : valor;
  }
  return salida;
}

/**
 * Minutos que le quedan de bloqueo a una cuenta (0 si no está bloqueada).
 * Al vencer el plazo se limpia sola: el bloqueo es temporal, no permanente.
 */
function minutosDeBloqueo(cuenta) {
  if (!cuenta.bloqueadaHasta) return 0;
  const restante = cuenta.bloqueadaHasta - Date.now();
  if (restante <= 0) {
    cuenta.bloqueadaHasta = null;
    cuenta.intentosFallidos = 0;
    return 0;
  }
  return Math.ceil(restante / 60000);
}

/**
 * Suma un intento fallido y, al llegar al máximo, bloquea la cuenta.
 * Devuelve cuántos intentos quedan antes del bloqueo.
 */
function registrarIntentoFallido(cuenta) {
  cuenta.intentosFallidos = (cuenta.intentosFallidos || 0) + 1;
  if (cuenta.intentosFallidos >= MAX_INTENTOS) {
    cuenta.bloqueadaHasta = Date.now() + BLOQUEO_MINUTOS * 60 * 1000;
    cuenta.intentosFallidos = 0;
  }
  guardar();
  return MAX_INTENTOS - cuenta.intentosFallidos;
}

export const CuentasRepository = {
  /**
   * Registra una cuenta con rol (demo).
   * Con Supabase: supabase.auth.signUp + fila en profiles con el mismo rol.
   */
  async registrar({ rol, nombre, apellidos = '', email, clave, extras = {} }) {
    await cuentasListas;
    const correo = String(email || '').trim().toLowerCase();
    if (!esCorreo(correo)) {
      return { ok: false, motivo: 'Escribe un correo válido.' };
    }
    if (rol !== 'player' && rol !== 'organizer') {
      return { ok: false, motivo: 'Elige un tipo de cuenta válido.' };
    }
    if (!String(nombre || '').trim()) {
      return { ok: false, motivo: 'El nombre es obligatorio.' };
    }
    const motivoClave = claveAceptable(clave);
    if (motivoClave) return { ok: false, motivo: motivoClave };
    if (await this.existeEmail(correo)) {
      return { ok: false, motivo: 'Ese correo ya está registrado.' };
    }

    const cuenta = {
      id: generarId('user'),
      rol,
      nombre: String(nombre).trim(),
      apellidos: String(apellidos || '').trim(),
      email: correo,
      claveHash: await hashClave(String(clave)),
      fechaCreacion: new Date().toISOString().slice(0, 10),
      // El registro no confirma el correo: se verifica desde "Mi cuenta".
      correoVerificado: false
    };

    if (rol === 'player') {
      cuenta.datosJugador = { nombre: cuenta.nombre, apellidos: cuenta.apellidos, email: correo, ...extras };
      const jugador = await PlayersRepository.crearJugador(cuenta.datosJugador);
      cuenta.playerId = jugador.id;
    } else {
      cuenta.organizacion = String(extras.organizacion || cuenta.nombre).trim();
      cuenta.organizadorId = generarId('org');
      cuenta.datosOrganizador = {
        organizacion: cuenta.organizacion,
        giro: extras.giro || 'Club o academia',
        telefono: String(extras.telefono || '').trim(),
        ciudad: String(extras.ciudad || '').trim(),
        estado: String(extras.estado || '').trim(),
        web: String(extras.web || '').trim(),
        mpEmail: String(extras.mpEmail || correo).trim().toLowerCase(),
        tipoPersona: extras.tipoPersona || 'fisica',
        rfc: String(extras.rfc || '').trim().toUpperCase(),
        razonSocial: String(extras.razonSocial || '').trim(),
        regimen: String(extras.regimen || '605').trim(),
        cpFiscal: String(extras.cpFiscal || '').trim(),
        clabe: String(extras.clabe || '').trim(),
        mpEstado: extras.mpEstado || 'conectado'
      };
    }

    CUENTAS.push(cuenta);
    guardar();
    return { ok: true, cuenta };
  },

  /**
   * Verifica correo + contraseña (demo).
   *
   * Lleva la cuenta de intentos fallidos: al llegar al máximo la bloquea de
   * forma temporal y, al entrar bien, registra el último acceso.
   */
  async acceder({ email, clave }) {
    await cuentasListas;
    const correo = String(email || '').trim().toLowerCase();
    const cuenta = CUENTAS.find((c) => c.email === correo);
    if (!cuenta) return { ok: false, motivo: 'Correo o contraseña incorrectos.' };

    const minutos = minutosDeBloqueo(cuenta);
    if (minutos > 0) {
      return {
        ok: false,
        motivo: `Cuenta bloqueada por intentos fallidos. Inténtalo en ${minutos} min.`
      };
    }

    const hash = await hashClave(String(clave || ''));
    if (hash !== cuenta.claveHash) {
      const restantes = registrarIntentoFallido(cuenta);
      // Aviso de intentos restantes solo cuando quedan pocos: no ayuda a
      // probar contraseñas de una en una.
      const aviso = restantes > 0 && restantes <= 2
        ? ` Te quedan ${restantes} ${restantes === 1 ? 'intento' : 'intentos'}.`
        : '';
      return { ok: false, motivo: `Correo o contraseña incorrectos.${aviso}` };
    }

    cuenta.intentosFallidos = 0;
    cuenta.bloqueadaHasta = null;
    cuenta.ultimoAcceso = new Date().toISOString();
    guardar();
    return { ok: true, cuenta };
  },

  /**
   * Marca el correo de la cuenta como verificado.
   * Demo: sustituye al enlace de confirmación de Supabase
   * (supabase.auth.verifyOtp con token de un solo uso).
   */
  async verificarCorreo(id) {
    await cuentasListas;
    const cuenta = CUENTAS.find((c) => c.id === id);
    if (!cuenta) return { ok: false, motivo: 'La cuenta ya no existe.' };
    cuenta.correoVerificado = true;
    guardar();
    return { ok: true, cuenta };
  },

  async getPorId(id) {
    await cuentasListas;
    return CUENTAS.find((c) => c.id === id) || null;
  },

  async existeEmail(email) {
    await cuentasListas;
    const correo = String(email || '').trim().toLowerCase();
    return CUENTAS.some((c) => c.email === correo);
  },

  /** Cuenta demo preinstalada por rol (acceso rápido sin contraseña). */
  async getDemo(rol) {
    await cuentasListas;
    return CUENTAS.find((c) => c.demo && c.rol === rol) || null;
  },

  /**
   * Actualiza datos de la cuenta y sus perfiles desde "Mi cuenta" (fuente única).
   *
   * - Validaciones compartidas: correo único y válida, nombre obligatorio.
   * - Rol player: espeja nombre/apellidos/email al perfil de jugador
   *   (PlayersRepository) y mantiene datosJugador para restaurar la sesión.
   * - Rol organizer: mantiene organizacion y datosOrganizador sincronizados
   *   (Sesion.getOrganizador se arma de aquí, sin duplicados).
   */
  async actualizar(id, cambios = {}) {
    await cuentasListas;
    const cuenta = CUENTAS.find((c) => c.id === id);
    if (!cuenta) return { ok: false, motivo: 'La cuenta ya no existe.' };

    if (cambios.email !== undefined) {
      const correo = String(cambios.email || '').trim().toLowerCase();
      if (!esCorreo(correo)) return { ok: false, motivo: 'Escribe un correo válido.' };
      if (CUENTAS.some((c) => c.id !== cuenta.id && c.email === correo)) {
        return { ok: false, motivo: 'Ese correo ya está registrado.' };
      }
      // Cambiar el correo invalida la verificación anterior.
      if (correo !== cuenta.email) cuenta.correoVerificado = false;
      cuenta.email = correo;
    }
    if (cambios.nombre !== undefined) {
      const nombre = String(cambios.nombre || '').trim();
      if (!nombre) return { ok: false, motivo: 'El nombre es obligatorio.' };
      cuenta.nombre = nombre;
    }
    if (cambios.apellidos !== undefined) cuenta.apellidos = String(cambios.apellidos || '').trim();

    if (cuenta.rol === 'player') {
      if (cambios.datosJugador) {
        cuenta.datosJugador = { ...cuenta.datosJugador, ...soloDefinidos(cambios.datosJugador) };
      }
      // La identidad de la cuenta es la fuente del perfil de jugador.
      cuenta.datosJugador = {
        ...cuenta.datosJugador,
        nombre: cuenta.nombre,
        apellidos: cuenta.apellidos,
        email: cuenta.email
      };
      if (cuenta.playerId) {
        await PlayersRepository.actualizar(cuenta.playerId, cuenta.datosJugador);
      }
    } else {
      if (cambios.datosOrganizador) {
        cuenta.datosOrganizador = {
          ...cuenta.datosOrganizador,
          ...soloDefinidos(cambios.datosOrganizador)
        };
        if (cuenta.datosOrganizador.organizacion) {
          cuenta.organizacion = String(cuenta.datosOrganizador.organizacion).trim();
        }
      }
      if (cambios.organizacion !== undefined) {
        cuenta.organizacion = String(cambios.organizacion || '').trim();
        cuenta.datosOrganizador = {
          ...cuenta.datosOrganizador,
          organizacion: cuenta.organizacion
        };
      }
    }

    guardar();
    return { ok: true, cuenta };
  },

  /** Cambia la contraseña validando la actual (solo se guarda el hash). */
  async cambiarClave({ id, claveActual, claveNueva }) {
    await cuentasListas;
    const cuenta = CUENTAS.find((c) => c.id === id);
    if (!cuenta) return { ok: false, motivo: 'La cuenta ya no existe.' };
    const hashActual = await hashClave(String(claveActual || ''));
    if (hashActual !== cuenta.claveHash) {
      return { ok: false, motivo: 'La contraseña actual no es correcta.' };
    }
    const motivo = claveAceptable(claveNueva);
    if (motivo) return { ok: false, motivo };
    // Quien demuestra la clave actual no es un atacante: se levanta el bloqueo.
    cuenta.intentosFallidos = 0;
    cuenta.bloqueadaHasta = null;
    await this._fijarClave(cuenta, claveNueva);
    return { ok: true };
  },

  /**
   * Genera un código de un solo uso para restablecer la contraseña.
   * Con Supabase: supabase.auth.resetPasswordForEmail(email).
   * Demo: devuelve el código aquí (en producción lo enviaría el correo).
   */
  async solicitarRecuperacion(email) {
    await cuentasListas;
    const correo = String(email || '').trim().toLowerCase();
    const cuenta = CUENTAS.find((c) => c.email === correo);
    if (!cuenta) return { ok: false, motivo: 'No hay cuenta con ese correo.' };
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    escribirMapa(CLAVE_RECUPERACION, {
      email: correo,
      codigo,
      expira: Date.now() + RECUPERACION_MINUTOS * 60 * 1000
    });
    return { ok: true, codigo };
  },

  /** Valida el código de recuperación (15 min, un solo uso) y fija la clave. */
  async restablecerClave({ email, codigo, claveNueva }) {
    await cuentasListas;
    const correo = String(email || '').trim().toLowerCase();
    const pendiente = leerMapa(CLAVE_RECUPERACION);
    if (!pendiente.email || pendiente.email !== correo || !pendiente.codigo) {
      return { ok: false, motivo: 'Solicita primero un código de recuperación.' };
    }
    if (Date.now() > pendiente.expira) {
      escribirMapa(CLAVE_RECUPERACION, {});
      return { ok: false, motivo: 'El código expiró. Solicita uno nuevo.' };
    }
    if (String(codigo || '').trim() !== String(pendiente.codigo)) {
      return { ok: false, motivo: 'El código no coincide.' };
    }
    const motivo = claveAceptable(claveNueva);
    if (motivo) return { ok: false, motivo };
    const cuenta = CUENTAS.find((c) => c.email === correo);
    if (!cuenta) return { ok: false, motivo: 'No hay cuenta con ese correo.' };
    // Restablecer la contraseña también levanta el bloqueo por intentos.
    cuenta.intentosFallidos = 0;
    cuenta.bloqueadaHasta = null;
    await this._fijarClave(cuenta, claveNueva);
    escribirMapa(CLAVE_RECUPERACION, {});
    return { ok: true };
  },

  /**
   * Fija la contraseña de una cuenta (solo hash). Las cuentas demo no se
   * persisten con `guardar()`, así que su hash propio va en un mapa aparte
   * para que el cambio sobreviva a la recarga de la página.
   */
  async _fijarClave(cuenta, clave) {
    const hash = await hashClave(String(clave));
    cuenta.claveHash = hash;
    if (cuenta.demo) {
      escribirMapa(CLAVE_DEMO_ALMACEN, {
        ...leerMapa(CLAVE_DEMO_ALMACEN),
        [cuenta.email]: hash
      });
    } else {
      guardar();
    }
  }
};

/**
 * Preparación inicial de las cuentas: contraseña de las cuentas demo y
 * restauración de las cuentas guardadas en el navegador.
 *
 * Se expone como promesa para que nadie lea el repositorio "a medio preparar".
 * Leerlo antes de que terminara provocaba dos fallos reales: el acceso demo
 * fallaba (claveHash todavía sin asignar) y, al recargar, la sesión guardada se
 * daba por perdida porque la cuenta aún no estaba en memoria.
 */
export const cuentasListas = (async () => {
  const clavesPropias = leerMapa(CLAVE_DEMO_ALMACEN);
  for (const demo of CUENTAS) {
    demo.claveHash = clavesPropias[demo.email] || (await hashClave(CLAVE_DEMO));
  }
  await hidratar();
})();