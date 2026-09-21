<script setup>
/**
 * Panel · Check-in de un torneo (solo confirmados + presentes).
 */
import { computed, onMounted, ref } from 'vue';
import { OrganizadorRepository } from '@/repositories/organizadorRepository.js';
import { notificar } from '@/composables/useAviso.js';
import EstadoInsignia from '@/components/EstadoInsignia.vue';
import TablaBase from '@/components/TablaBase.vue';

const props = defineProps({ id: { type: String, required: true } });

const torneo = ref(null);
const participantes = ref([]);
const busqueda = ref('');
const cargando = ref(true);

const columnas = ['Jugador', 'Categoría', 'Estado', 'Acción'];

const elegibles = computed(() => {
  const t = busqueda.value.trim().toLowerCase();
  return participantes.value
    .filter((p) => p.estado === 'confirmada' || p.estado === 'checkin')
    .filter((p) => !t || p.nombreJugador.toLowerCase().includes(t));
});

const hechos = computed(() => participantes.value.filter((p) => p.estado === 'checkin').length);

onMounted(async () => {
  try {
    torneo.value = await OrganizadorRepository.getTorneoPorId(props.id);
    if (torneo.value) participantes.value = await OrganizadorRepository.getParticipantes(props.id);
  } catch {
    notificar('No fue posible cargar el check-in.');
  } finally {
    cargando.value = false;
  }
});

async function registrar(p) {
  const ok = await OrganizadorRepository.actualizarEstadoInscripcion(p.id, 'checkin');
  notificar(ok ? 'Check-in registrado.' : 'Transición no válida.');
  if (ok) p.estado = 'checkin';
}
</script>

<template>
  <p v-if="cargando" class="texto-suave">Cargando…</p>
  <p v-else-if="!torneo" class="aviso">El torneo no existe o no te pertenece.</p>

  <template v-else>
    <h1 class="titulo-pagina">Check-in · {{ torneo.nombre }}</h1>
    <p class="subtitulo-pagina">{{ hechos }} de {{ elegibles.length }} confirmados ya registraron asistencia.</p>

    <form class="filtros-fila" @submit.prevent>
      <input v-model="busqueda" class="control" placeholder="Buscar jugador…" />
    </form>

    <tabla-base :columnas="columnas" :vacia="!elegibles.length" mensaje-vacio="Aún no hay jugadores confirmados.">
      <tr v-for="p in elegibles" :key="p.id">
        <td data-col="Jugador"><strong>{{ p.nombreJugador }}</strong></td>
        <td data-col="Categoría">{{ p.categoria }}</td>
        <td data-col="Estado"><EstadoInsignia :estado="p.estado" /></td>
        <td data-col="Acción">
          <button v-if="p.estado === 'confirmada'" type="button" class="boton boton-verde boton-sm" @click="registrar(p)">Registrar check-in</button>
          <span v-else class="texto-suave">Presente</span>
        </td>
      </tr>
    </tabla-base>
  </template>
</template>
