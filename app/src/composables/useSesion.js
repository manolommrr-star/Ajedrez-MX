/**
 * Estado reactivo de la sesión (envuelve core/sesion.js).
 * Cualquier componente puede leer `estado` o los computed de rol.
 */
import { reactive, computed } from 'vue';
import { Sesion } from '@/core/sesion.js';

const estado = reactive({
  cuenta: null,
  jugador: null,
  organizador: null,
  listo: false
});

export const esOrganizador = computed(() => estado.cuenta?.rol === 'organizer');
export const esJugador = computed(() => estado.cuenta?.rol === 'player');

/** Relee la sesión desde el núcleo (localStorage) y actualiza el estado. */
export async function refrescarSesion() {
  estado.cuenta = await Sesion.getCuenta();
  estado.jugador = await Sesion.getJugador();
  estado.organizador = await Sesion.getOrganizador();
  estado.listo = true;
  return estado.cuenta;
}

export function useSesion() {
  return {
    estado,
    esOrganizador,
    esJugador,
    refrescarSesion,

    /** Inicia sesión con el id de una cuenta (demo). */
    async iniciarSesion(cuentaId) {
      const cuenta = await Sesion.iniciar(cuentaId);
      await refrescarSesion();
      return cuenta;
    },

    /** Cierra la sesión activa. */
    async cerrarSesion() {
      Sesion.cerrar();
      await refrescarSesion();
    }
  };
}