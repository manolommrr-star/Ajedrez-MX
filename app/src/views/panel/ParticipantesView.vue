<script setup>
/**
 * Panel · Participantes: lista para presentación + exportación
 * a Swiss-Manager (CSV) y CSV auxiliar de check-in.
 */
import { computed, onMounted, ref } from 'vue';
import { OrganizadorRepository } from '@/repositories/organizadorRepository.js';
import { SwissManagerExport } from '@/integrations/swissManagerExport.js';
import { notificar } from '@/composables/useAviso.js';
import EstadoInsignia from '@/components/EstadoInsignia.vue';
import TablaBase from '@/components/TablaBase.vue';

const props = defineProps({ id: { type: String, required: true } });

const torneo = ref(null);
const participantes = ref([]);
const busqueda = ref('');
const cargando = ref(true);
const advertencias = ref([]);

const columnas = ['Jugador', 'FIDE ID', 'Categoría', 'Elo', 'Federación', 'Club', 'Estado'];

const filtrados = computed(() => {
  const t = busqueda.value.trim().toLowerCase();
  if (!t) return participantes.value;
  return participantes.value.filter((p) => p.nombreJugador.toLowerCase().includes(t));
});

onMounted(async () => {
  torneo.value = await OrganizadorRepository.getTorneoPorId(props.id);
  if (torneo.value) participantes.value = await OrganizadorRepository.getParticipantes(props.id);
  cargando.value = false;
});

async function exportarSwiss() {
  try {
    await SwissManagerExport.descargar(props.id, torneo.value ? torneo.value.nombre : props.id);
    notificar('CSV generado (formato propuesto).');
  } catch { notificar('No fue posible generar el CSV.'); }
}

async function exportarTxtSwiss() {
  try {
    const { cuenta, advertencias: avisos } = await SwissManagerExport.descargarTxt(
      props.id,
      torneo.value ? torneo.value.nombre : props.id
    );
    advertencias.value = avisos;
    const resumen = avisos.length
      ? `TXT generado: ${cuenta} jugadores · ${avisos.length} advertencia(s).`
      : `TXT generado: ${cuenta} jugadores, sin advertencias.`;
    notificar(resumen);
  } catch { notificar('No fue posible generar el TXT.'); }
}

async function exportarCheckin() {
  try {
    await SwissManagerExport.descargarCheckin(props.id, torneo.value ? torneo.value.nombre : props.id);
    notificar('CSV de check-in generado.');
  } catch { notificar('No fue posible generar el CSV.'); }
}
</script>

<template>
  <p v-if="cargando" class="texto-suave">Cargando…</p>
  <p v-else-if="!torneo" class="aviso">El torneo no existe o no te pertenece.</p>

  <template v-else>
    <RouterLink class="enlace-volver" :to="{ name: 'panel-torneos' }">← Mis torneos</RouterLink>
    <h1 class="titulo-pagina">Participantes</h1>
    <p class="subtitulo-pagina">Torneo: {{ torneo.nombre }}. Lista para presentación y para Swiss-Manager.</p>

    <div class="chips-fila">
      <RouterLink class="chip" :to="{ name: 'panel-inscripciones', params: { id } }">Gestionar inscripciones</RouterLink>
      <RouterLink class="chip" :to="{ name: 'panel-checkin-torneo', params: { id } }">Check-in del día</RouterLink>
    </div>

    <form class="filtros-fila" @submit.prevent>
      <input v-model="busqueda" class="control" placeholder="Buscar participante…" />
      <button type="button" class="boton boton-verde boton-sm" @click="exportarTxtSwiss">TXT (Swiss Manager)</button>
      <button type="button" class="boton boton-gris boton-sm" @click="exportarSwiss">Exportar CSV (Excel)</button>
      <button type="button" class="boton boton-gris boton-sm" @click="exportarCheckin">Exportar CSV (check-in)</button>
    </form>

    <div v-if="advertencias.length" class="aviso aviso-dorado">
      <p>
        <strong>Advertencias de datos:</strong>
        {{ advertencias.join(' · ') }}.
        Puedes completar estos datos en el asistente de importación de Swiss Manager.
      </p>
    </div>

    <tabla-base :columnas="columnas" :vacia="!filtrados.length" mensaje-vacio="Sin participantes.">
      <tr v-for="p in filtrados" :key="p.id">
        <td data-col="Jugador"><strong>{{ p.nombreJugador }}</strong></td>
        <td data-col="FIDE ID">{{ p.jugador.fideId || '—' }}</td>
        <td data-col="Categoría">{{ p.categoria }}</td>
        <td data-col="Elo">{{ p.jugador.elo || '—' }}</td>
        <td data-col="Federación">{{ p.jugador.federacion || '—' }}</td>
        <td data-col="Club">{{ p.jugador.club || '—' }}</td>
        <td data-col="Estado"><EstadoInsignia :estado="p.estado" /></td>
      </tr>
    </tabla-base>
  </template>
</template>
