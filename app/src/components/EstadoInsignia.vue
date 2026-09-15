/**
 * Insignia de estado (inscripción, pago o publicación) con el color
 * correspondiente. Reemplaza a insignia() del prototipo vanilla.
 */
<script setup>
import { computed } from 'vue';

const props = defineProps({
  estado: { type: String, default: '' }
});

/** Misma tabla de colores que el prototipo (ui/components.js). */
const CLASES = {
  pagado: 'insignia-exito',
  publicado: 'insignia-exito',
  confirmada: 'insignia-exito',
  checkin: 'insignia-exito',
  procesando: 'insignia-info',
  pago_en_revision: 'insignia-info',
  borrador: 'insignia-info',
  reembolsado: 'insignia-info',
  retirada: 'insignia-info',
  pendiente: 'insignia-pendiente',
  pago_pendiente: 'insignia-pendiente',
  cancelado: 'insignia-peligro',
  cancelada: 'insignia-peligro',
  rechazada: 'insignia-peligro'
};

const clase = computed(() => CLASES[props.estado] || 'insignia-info');
</script>

<template>
  <span class="insignia" :class="clase">{{ estado }}</span>
</template>