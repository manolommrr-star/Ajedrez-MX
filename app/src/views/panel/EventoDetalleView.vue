<script setup>
/**
 * Panel · Ficha de evento con sus torneos.
 */
import { onMounted, ref } from 'vue';
import { OrganizadorRepository } from '@/repositories/organizadorRepository.js';
import { Formatters } from '@/utils/formatters.js';
import EstadoInsignia from '@/components/EstadoInsignia.vue';
import TablaBase from '@/components/TablaBase.vue';

const props = defineProps({ id: { type: String, required: true } });

const evento = ref(null);
const torneos = ref([]);
const cargando = ref(true);

const columnas = ['Torneo', 'Fecha', 'Lugares', 'Estado', 'Acciones'];

onMounted(async () => {
  evento.value = await OrganizadorRepository.getEventoPorId(props.id);
  if (evento.value) torneos.value = await OrganizadorRepository.getTorneosDeEvento(props.id);
  cargando.value = false;
});
</script>

<template>
  <p v-if="cargando" class="texto-suave">Cargando…</p>
  <p v-else-if="!evento" class="aviso">El evento no existe.</p>

  <template v-else>
    <RouterLink class="enlace-volver" :to="{ name: 'panel-eventos' }">← Eventos</RouterLink>
    <h1 class="titulo-pagina">{{ evento.nombre }}</h1>
    <p class="subtitulo-pagina">{{ evento.descripcion }}</p>

    <tabla-base :columnas="columnas" :vacia="!torneos.length" mensaje-vacio="Este evento aún no tiene torneos.">
      <tr v-for="t in torneos" :key="t.id">
        <td data-col="Torneo"><strong>{{ t.nombre }}</strong><br /><span class="texto-suave">{{ t.grupo || '—' }}</span></td>
        <td data-col="Fecha">{{ Formatters.fechaLarga(t.fecha) }}</td>
        <td data-col="Lugares">{{ t.inscritos }} / {{ t.cupo }}</td>
        <td data-col="Estado"><EstadoInsignia :estado="t.estadoPublicacion" /></td>
        <td data-col="Acciones">
          <RouterLink class="boton boton-texto" :to="{ name: 'panel-inscripciones', params: { id: t.id } }">Inscripciones</RouterLink>
        </td>
      </tr>
    </tabla-base>
  </template>
</template>
