/**
 * Avisos tipo toast.
 * `mensaje` es reactivo: el componente <AvisoToast> lo muestra.
 */
import { ref } from 'vue';

export const mensaje = ref('');

let temporizador = null;

/** Muestra un aviso breve; se limpia solo a los 3.5 s. */
export function notificar(texto) {
  mensaje.value = String(texto ?? '');
  clearTimeout(temporizador);
  temporizador = setTimeout(() => { mensaje.value = ''; }, 3500);
}