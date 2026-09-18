<script setup>
/**
 * Insignia de estado (inscripción, pago o publicación) con el color
 * correspondiente.
 */
import { computed } from 'vue';

const props = defineProps({
  estado: { type: String, default: '' }
});

/** Tabla de colores por estado. */
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