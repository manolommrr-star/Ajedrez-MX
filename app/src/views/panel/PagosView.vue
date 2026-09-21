<script setup>
/**
 * Panel · Pagos: consulta, confirmación vía webhook (demo) y reembolso.
 */
import { computed, onMounted, ref } from 'vue';
import { OrganizadorRepository } from '@/repositories/organizadorRepository.js';
import { Formatters } from '@/utils/formatters.js';
import { notificar } from '@/composables/useAviso.js';
import EstadoInsignia from '@/components/EstadoInsignia.vue';
import TablaBase from '@/components/TablaBase.vue';

const pagos = ref([]);
const cargando = ref(true);

const columnas = ['Folio', 'Torneo', 'Jugador', 'Monto', 'Proveedor', 'Estado', 'Fecha'];

const conteo = computed(() => {
  const mapa = {};
  for (const p of pagos.value) mapa[p.estado] = (mapa[p.estado] ?? 0) + 1;
  return Object.entries(mapa);
});

onMounted(async () => {
  pagos.value = await OrganizadorRepository.getPagos();
  cargando.value = false;
});

async function exportar() {
  await OrganizadorRepository.exportarPagosCsv();
  notificar('CSV de pagos exportado.');
}
</script>

<template>
  <h1 class="titulo-pagina">Pagos</h1>
  <p class="subtitulo-pagina">Consulta de pagos en línea. La confirmación llega por webhook del proveedor; el panel no la modifica.</p>

  <p v-if="cargando" class="texto-suave">Cargando…</p>

  <template v-else>
    <div class="chips-fila">
      <span v-for="[estado, n] in conteo" :key="estado" class="chip">{{ estado }}: {{ n }}</span>
    </div>

    <div class="chips-fila">
      <button type="button" class="boton boton-gris boton-sm" @click="exportar">Exportar CSV de pagos</button>
    </div>

    <tabla-base :columnas="columnas" :vacia="!pagos.length" mensaje-vacio="Sin pagos registrados.">
      <tr v-for="p in pagos" :key="p.id">
        <td data-col="Folio">{{ p.folio }}</td>
        <td data-col="Torneo">{{ p.torneo }}</td>
        <td data-col="Jugador">{{ p.jugador }}</td>
        <td data-col="Monto">{{ Formatters.precio(p.monto) }}</td>
        <td data-col="Proveedor">{{ p.proveedor }}</td>
        <td data-col="Estado"><EstadoInsignia :estado="p.estado" /></td>
        <td data-col="Fecha">{{ Formatters.fechaLarga(p.fecha) }}</td>
      </tr>
    </tabla-base>
  </template>
</template>
