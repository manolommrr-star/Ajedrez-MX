/**
 * Sesión por cuenta (Etapa 4 · registro con rol).
 *
 * Recuerda la cuenta activa entre recargas (localStorage). Con Supabase esto
 * se reemplaza por supabase.auth (sesión real); la interfaz no cambia.
 * Según el rol de la cuenta expone el perfil de jugador o de organizador.
 */
import { CuentasRepository } from './cuentasRepository.js';
import { PlayersRepository } from './playersRepository.js';

const CLAVE_SESION = 'ajedrezmx-cuenta-demo';

let cuentaId = null;

function cargarGuardado() {
  try {
    cuentaId = window.localStorage.getItem(CLAVE_SESION) || null;
  } catch {
    cuentaId = null; // sin localStorage disponible (p. ej. pruebas en Node)
  }
}

export const Sesion = {
  /** Abre la sesión de una cuenta (demo) y la recuerda. */
  async iniciar(idCuenta) {
    const cuenta = await CuentasRepository.getPorId(idCuenta);
    if (!cuenta) return null;
    cuentaId = idCuenta;
    try { window.localStorage.setItem(CLAVE_SESION, idCuenta); } catch { /* demo */ }
    return cuenta;
  },

  /** Cuenta con sesión activa, o null. */
  async getCuenta() {
    if (!cuentaId) return null;
    const cuenta = await CuentasRepository.getPorId(cuentaId);
    if (!cuenta) this.cerrar();
    return cuenta;
  },

  /** Perfil de jugador vinculado a la sesión (solo cuentas rol player). */
  async getJugador() {
    const cuenta = await this.getCuenta();
    if (!cuenta || cuenta.rol !== 'player' || !cuenta.playerId) return null;
    return (await PlayersRepository.getPorId(cuenta.playerId)) || null;
  },

  /** Perfil de organizador de la sesión (solo cuentas rol organizer). */
  async getOrganizador() {
    const cuenta = await this.getCuenta();
    if (!cuenta || cuenta.rol !== 'organizer' || !cuenta.organizadorId) return null;
    return {
      id: cuenta.organizadorId,
      nombre: cuenta.organizacion || cuenta.nombre,
      email: cuenta.email
    };
  },

  /** Cierra la sesión y olvida la cuenta guardada. */
  cerrar() {
    cuentaId = null;
    try { window.localStorage.removeItem(CLAVE_SESION); } catch { /* demo */ }
  }
};

cargarGuardado();