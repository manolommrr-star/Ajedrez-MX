<script setup>
/**
 * Panel · Índice de check-in: elige el torneo para registrar asistencia.
 */
import { onMounted, ref } from 'vue';
import { OrganizadorRepository } from '@/repositories/organizadorRepository.js';

const torneos = ref([]);
const cargando = ref(true);

onMounted(async () => {
  const todos = await OrganizadorRepository.getTorneos();
  torneos.value = todos.filter((t) => t.estadoPublicacion !== 'cancelado');
  cargando.value = false;
});
</script>

<template>
  <h1 class="titulo-pagina">Check-in</h1>
  <p class="subtitulo-pagina">Elige el torneo para registrar la asistencia del día.</p>

  <p v-if="cargando" class="texto-suave">Cargando…</p>

  <div v-else class="chips-fila">
    <RouterLink
      v-for="t in torneos"
      :key="t.id"
      class="chip"
      :to="{ name: 'panel-checkin-torneo', params: { id: t.id } }"
    >{{ t.nombre }}</RouterLink>
    <p v-if="!torneos.length" class="aviso">No hay torneos disponibles.</p>
  </div>
</template>
