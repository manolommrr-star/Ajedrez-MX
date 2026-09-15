<script setup>
/**
 * Panel · Resumen: estadísticas, acciones rápidas, mis torneos y
 * últimos pagos.
 */
import { computed, onMounted, ref } from 'vue';
import { OrganizadorRepository } from '@/repositories/organizadorRepository.js';
import { Formatters } from '@/utils/formatters.js';
import EstadoInsignia from '@/components/EstadoInsignia.vue';
import TablaBase from '@/components/TablaBase.vue';

const resumen = ref({ totalInscripciones: 0, inscritos: 0, cupo: 0, ingresosCobrados: 0, pendientesPago: 0 });
const torneos = ref([]);
const pagos = ref([]);
const cargando = ref(true);

const columnasPagos = ['Folio', 'Torneo', 'Jugador', 'Monto', 'Estado', 'Fecha'];

const stats = computed(() => [
  ['Inscripciones', resumen.value.totalInscripciones],
  ['Ocupación', `${resumen.value.inscritos} / ${resumen.value.cupo}`],
  ['Ingresos cobrados', Formatters.precio(resumen.value.ingresosCobrados)],
  ['Pendientes de pago', resumen.value.pendientesPago]
]);

onMounted(async () => {
  resumen.value = await OrganizadorRepository.getResumen();
  torneos.value = await OrganizadorRepository.getTorneos();
  pagos.value = (await OrganizadorRepository.getPagos()).slice(0, 5);
  cargando.value = false;
});
</script>

<template>
  <div class="panel-encabezado">
    <h1 class="panel-titulo">Resumen</h1>
    <div class="panel-acciones-rapidas">
      <RouterLink class="boton boton-verde boton-sm" :to="{ name: 'panel-crear' }">Crear torneo</RouterLink>
      <RouterLink class="boton boton-gris boton-sm" :to="{ name: 'panel-eventos' }">Eventos</RouterLink>
      <RouterLink class="boton boton-gris boton-sm" :to="{ name: 'panel-reportes' }">Reportes</RouterLink>
    </div>
  </div>

  <p v-if="cargando" class="texto-suave">Cargando…</p>

  <template v-else>
    <div class="rejilla-stats">
      <div v-for="[etiqueta, valor] in stats" :key="etiqueta" class="stat">
        <span class="stat-valor">{{ valor }}</span>
        <span class="stat-etiqueta">{{ etiqueta }}</span>
      </div>
    </div>

    <h2 class="seccion-titulo">Mis torneos</h2>

    <div class="lista-filas">
      <div v-for="t in torneos" :key="t.id" class="fila-dato">
        <div>
          <p class="fila-dato-nombre">
            <RouterLink :to="`/torneo/${encodeURIComponent(t.id)}`">{{ t.nombre }}</RouterLink>
          </p>
          <p class="fila-dato-meta">
            {{ Formatters.fechaLarga(t.fecha) }} · {{ t.ciudad }}, {{ t.estado }}
          </p>
        </div>
        <EstadoInsignia :estado="t.estadoPublicacion" />
        <div class="fila-dato-pie">
          <div class="progreso"><i :style="{ width: `${t.cupo ? Math.round((t.inscritos / t.cupo) * 100) : 0}%` }" /></div>
          <p class="fila-dato-meta">{{ t.inscritos }} / {{ t.cupo }} lugares</p>
        </div>
      </div>
      <p v-if="!torneos.length" class="aviso">Aún no tienes torneos.</p>
    </div>

    <h2 class="seccion-titulo">Últimos pagos</h2>

    <tabla-base :columnas="columnasPagos" :vacia="!pagos.length" mensaje-vacio="Sin pagos registrados.">
      <tr v-for="p in pagos" :key="p.id">
        <td data-col="Folio">{{ p.folio }}</td>
        <td data-col="Torneo">{{ p.torneo }}</td>
        <td data-col="Jugador">{{ p.jugador }}</td>
        <td data-col="Monto">{{ Formatters.precio(p.monto) }}</td>
        <td data-col="Estado"><EstadoInsignia :estado="p.estado" /></td>
        <td data-col="Fecha">{{ Formatters.fechaLarga(p.fecha) }}</td>
      </tr>
    </tabla-base>

    <p><RouterLink class="boton boton-texto" :to="{ name: 'panel-pagos' }">Ver todos los pagos</RouterLink></p>
  </template>
</template>