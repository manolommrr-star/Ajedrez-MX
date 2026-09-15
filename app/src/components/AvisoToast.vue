/**
 * Toast global: muestra el aviso emitido con notificar().
 */
<script setup>
import { mensaje } from '@/composables/useAviso.js';
</script>

<template>
  <div v-if="mensaje" class="toast" role="status" aria-live="polite">{{ mensaje }}</div>
</template>