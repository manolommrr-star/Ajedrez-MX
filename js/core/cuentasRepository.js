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

const CLAVE_ALMACEN = 'ajedrezmx-cuentas-demo';
const CLAVE_DEMO = 'demo1234';
const CLAVE_MINIMA = 8;

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
    demo: true
  },
  {
    id: 'user-demo-organizador',
    rol: 'organizer',
    nombre: 'Club de Ajedrez Xalapa',
    email: 'contacto@ajedrezxalapa.mx',
    organizadorId: 'org-demo',
    organizacion: 'Club de Ajedrez Xalapa',
    demo: true
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

export const CuentasRepository = {
  /**
   * Registra una cuenta con rol (demo).
   * Con Supabase: supabase.auth.signUp + fila en profiles con el mismo rol.
   */
  async registrar({ rol, nombre, apellidos = '', email, clave, extras = {} }) {
    const correo = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return { ok: false, motivo: 'Escribe un correo válido.' };
    }
    if (rol !== 'player' && rol !== 'organizer') {
      return { ok: false, motivo: 'Elige un tipo de cuenta válido.' };
    }
    if (!String(nombre || '').trim()) {
      return { ok: false, motivo: 'El nombre es obligatorio.' };
    }
    if (String(clave || '').length < CLAVE_MINIMA) {
      return { ok: false, motivo: `La contraseña debe tener al menos ${CLAVE_MINIMA} caracteres.` };
    }
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
      fechaCreacion: new Date().toISOString().slice(0, 10)
    };

    if (rol === 'player') {
      cuenta.datosJugador = { nombre: cuenta.nombre, apellidos: cuenta.apellidos, email: correo, ...extras };
      const jugador = await PlayersRepository.crearJugador(cuenta.datosJugador);
      cuenta.playerId = jugador.id;
    } else {
      cuenta.organizacion = String(extras.organizacion || cuenta.nombre).trim();
      cuenta.organizadorId = generarId('org');
    }

    CUENTAS.push(cuenta);
    guardar();
    return { ok: true, cuenta };
  },

  /** Verifica correo + contraseña (demo). */
  async acceder({ email, clave }) {
    const correo = String(email || '').trim().toLowerCase();
    const cuenta = CUENTAS.find((c) => c.email === correo);
    if (!cuenta) return { ok: false, motivo: 'Correo o contraseña incorrectos.' };
    const hash = await hashClave(String(clave || ''));
    if (hash !== cuenta.claveHash) return { ok: false, motivo: 'Correo o contraseña incorrectos.' };
    return { ok: true, cuenta };
  },

  async getPorId(id) {
    return CUENTAS.find((c) => c.id === id) || null;
  },

  async existeEmail(email) {
    const correo = String(email || '').trim().toLowerCase();
    return CUENTAS.some((c) => c.email === correo);
  },

  /** Cuenta demo preinstalada por rol (acceso rápido sin contraseña). */
  async getDemo(rol) {
    return CUENTAS.find((c) => c.demo && c.rol === rol) || null;
  }
};

// Contraseña demo para las cuentas preinstaladas + restauración de cuentas.
for (const demo of CUENTAS) demo.claveHash = await hashClave(CLAVE_DEMO);
hidratar();