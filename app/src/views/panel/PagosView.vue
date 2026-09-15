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

const columnas = ['Folio', 'Torneo', 'Jugador', 'Monto', 'Proveedor', 'Estado', 'Fecha', 'Acciones'];

const conteo = computed(() => {
  const mapa = {};
  for (const p of pagos.value) mapa[p.estado] = (mapa[p.estado] ?? 0) + 1;
  return Object.entries(mapa);
});

onMounted(async () => {
  pagos.value = await OrganizadorRepository.getPagos();
  cargando.value = false;
});

function puedeConfirmar(p) {
  return p.estado === 'pendiente' || p.estado === 'procesando';
}

async function simularWebhook(p) {
  const { PaymentsRepository } = await import('@/core/paymentsRepository.js');
  const resultado = await PaymentsRepository.simularWebhook(p.id);
  notificar(resultado.ok ? 'Pago confirmado vía webhook.' : resultado.motivo);
  if (resultado.ok) pagos.value = await OrganizadorRepository.getPagos();
}

async function reembolsar(p) {
  const ok = await OrganizadorRepository.reembolsarPago(p.id);
  notificar(ok ? 'Pago reembolsado.' : 'Ese pago no admite reembolso.');
  if (ok) pagos.value = await OrganizadorRepository.getPagos();
}

async function exportar() {
  await OrganizadorRepository.exportarPagosCsv();
  notificar('CSV de pagos exportado.');
}
</script>

<template>
  <h1 class="titulo-pagina">Pagos</h1>
  <p class="subtitulo-pagina">Los pagos solo se confirman vía webhook. Aquí solo se consultan.</p>

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
        <td data-col="Acciones">
          <button v-if="puedeConfirmar(p)" type="button" class="boton boton-texto" @click="simularWebhook(p)">Simular webhook</button>
          <button v-else-if="p.estado === 'pagado'" type="button" class="boton boton-texto" @click="reembolsar(p)">Reembolsar</button>
          <span v-else class="texto-suave">—</span>
        </td>
      </tr>
    </tabla-base>
  </template>
</template>
