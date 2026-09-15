<script setup>
/**
 * Panel · Eventos: agrupa torneos en un mismo evento.
 */
import { onMounted, ref } from 'vue';
import { OrganizadorRepository } from '@/repositories/organizadorRepository.js';
import { Formatters } from '@/utils/formatters.js';
import { notificar } from '@/composables/useAviso.js';
import EstadoInsignia from '@/components/EstadoInsignia.vue';

const eventos = ref([]);
const nombre = ref('');
const cargando = ref(true);

onMounted(async () => {
  eventos.value = await OrganizadorRepository.getEventos();
  cargando.value = false;
});

async function crear() {
  const texto = nombre.value.trim();
  if (!texto) { notificar('Escribe el nombre del evento.'); return; }
  await OrganizadorRepository.crearEvento(texto);
  notificar('Evento creado.');
  nombre.value = '';
  eventos.value = await OrganizadorRepository.getEventos();
}
</script>

<template>
  <h1 class="titulo-pagina">Eventos</h1>
  <p class="subtitulo-pagina">Agrupa tus torneos en un mismo evento.</p>

  <form class="filtros-fila" @submit.prevent="crear">
    <input v-model="nombre" class="control" placeholder="Nombre del nuevo evento…" />
    <button type="submit" class="boton boton-verde boton-sm">Nuevo evento</button>
  </form>

  <p v-if="cargando" class="texto-suave">Cargando…</p>
  <div v-else class="lista-filas">
    <div v-for="e in eventos" :key="e.id" class="fila-dato">
      <div>
        <p class="fila-dato-nombre">
          <RouterLink :to="{ name: 'panel-evento', params: { id: e.id } }">{{ e.nombre }}</RouterLink>
        </p>
        <p class="fila-dato-meta">{{ e.ciudad }}{{ e.estado ? `, ${e.estado}` : '' }}</p>
      </div>
      <EstadoInsignia :estado="e.estadoPublicacion" />
    </div>
    <p v-if="!eventos.length" class="aviso">Aún no tienes eventos.</p>
  </div>
</template>
