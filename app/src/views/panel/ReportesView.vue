<script setup>
/**
 * Panel · Reportes: ocupación por torneo (en Supabase: SQL).
 */
import { onMounted, ref } from 'vue';
import { OrganizadorRepository } from '@/repositories/organizadorRepository.js';

const torneos = ref([]);
const cargando = ref(true);

onMounted(async () => {
  torneos.value = await OrganizadorRepository.getTorneos();
  cargando.value = false;
});

function ocupacion(t) {
  return t.cupo ? Math.round((t.inscritos / t.cupo) * 100) : 0;
}
</script>

<template>
  <h1 class="titulo-pagina">Reportes</h1>
  <p class="subtitulo-pagina">Ocupación por torneo (en Supabase: SQL).</p>

  <p v-if="cargando" class="texto-suave">Cargando…</p>

  <div v-else class="lista-filas">
    <div v-for="t in torneos" :key="t.id" class="fila-dato">
      <div>
        <p class="fila-dato-nombre">{{ t.nombre }}</p>
        <p class="fila-dato-meta">{{ t.inscritos }} / {{ t.cupo }} lugares ({{ ocupacion(t) }} %)</p>
      </div>
      <div class="fila-dato-pie">
        <div class="progreso"><i :style="{ width: `${ocupacion(t)}%` }" /></div>
      </div>
    </div>
    <p v-if="!torneos.length" class="aviso">Aún no tienes torneos.</p>
  </div>
</template>
