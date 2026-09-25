/**
 * Sesión por cuenta (Etapa 4 · registro con rol).
 *
 * Recuerda la cuenta activa entre recargas (localStorage). Con Supabase esto
 * se reemplaza por supabase.auth (sesión real); la interfaz no cambia.
 * Según el rol de la cuenta expone el perfil de jugador o de organizador.
 */
import { CuentasRepository, cuentasListas, perfilOrganizador } from './cuentasRepository.js';
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
    await cuentasListas;
    const cuenta = await CuentasRepository.getPorId(idCuenta);
    if (!cuenta) return null;
    cuentaId = idCuenta;
    try { window.localStorage.setItem(CLAVE_SESION, idCuenta); } catch { /* demo */ }
    return cuenta;
  },

  /**
   * Cuenta con sesión activa, o null.
   *
   * Espera a que el repositorio termine de restaurar las cuentas guardadas y NO
   * borra la sesión cuando no encuentra la cuenta: antes, una lectura temprana
   * (justo al recargar) devolvía null y `cerrar()` eliminaba la sesión
   * guardada, dejando al usuario deslogueado sin motivo aparente.
   */
  async getCuenta() {
    await cuentasListas;
    if (!cuentaId) return null;
    return (await CuentasRepository.getPorId(cuentaId)) || null;
  },

  /** Perfil de jugador vinculado a la sesión (solo cuentas rol player). */
  async getJugador() {
    const cuenta = await this.getCuenta();
    if (!cuenta || cuenta.rol !== 'player' || !cuenta.playerId) return null;
    return (await PlayersRepository.getPorId(cuenta.playerId)) || null;
  },

  /** Perfil de organizador de la sesión (solo cuentas rol organizer). */
  async getOrganizador() {
    return perfilOrganizador(await this.getCuenta());
  },

  /** Cierra la sesión y olvida la cuenta guardada. */
  cerrar() {
    cuentaId = null;
    try { window.localStorage.removeItem(CLAVE_SESION); } catch { /* demo */ }
  }
};

cargarGuardado();