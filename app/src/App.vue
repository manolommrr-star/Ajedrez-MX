<script setup>
/**
 * Componente raíz: barra superior, vista activa, pie y toast global.
 */
import { onMounted } from 'vue';
import AppBarra from '@/components/AppBarra.vue';
import AppPie from '@/components/AppPie.vue';
import AvisoToast from '@/components/AvisoToast.vue';
import { asegurarSesion } from '@/composables/useSesion.js';

onMounted(asegurarSesion);
</script>

<template>
  <div class="pagina">
    <AppBarra />
    <main class="contenido">
      <RouterView />
    </main>
    <AppPie />
    <AvisoToast />
  </div>
</template>