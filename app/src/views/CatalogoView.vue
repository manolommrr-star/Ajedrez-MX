<script setup>
/**
 * Catálogo de torneos (página principal).
 * Hero tipo tablero + buscador, filtros de ciudad/modalidad y secciones
 * (destacados, cercanos, próximos) o resultados de búsqueda.
 */
import { computed, onMounted, reactive, ref } from 'vue';
import { TournamentRepository } from '@/repositories/tournamentRepository.js';
import { Formatters } from '@/utils/formatters.js';
import { AppConfig } from '@/config.js';
import { notificar } from '@/composables/useAviso.js';
import TarjetaTorneo from '@/components/TarjetaTorneo.vue';

const torneos = ref([]);
const filtros = reactive({ texto: '', ciudad: '', modalidad: '' });

onMounted(async () => {
  try {
    torneos.value = await TournamentRepository.getAll();
  } catch {
    notificar('No fue posible cargar los torneos. Inténtalo de nuevo.');
  }
});

const ciudades = computed(() => [...new Set(torneos.value.map((t) => t.ciudad))].sort());
const modalidades = computed(() => [...new Set(torneos.value.map((t) => t.modalidad))].sort());

const hayFiltros = computed(() =>
  filtros.texto.trim() !== '' || filtros.ciudad !== '' || filtros.modalidad !== ''
);

/** Filtro local equivalente a TournamentRepository.search(). */
const resultados = computed(() => {
  const texto = filtros.texto.trim().toLowerCase();
  return torneos.value.filter((t) => {
    const coincideTexto = !texto
      || t.nombre.toLowerCase().includes(texto)
      || t.ciudad.toLowerCase().includes(texto)
      || t.estado.toLowerCase().includes(texto);
    const coincideCiudad = !filtros.ciudad || t.ciudad === filtros.ciudad;
    const coincideModalidad = !filtros.modalidad || t.modalidad === filtros.modalidad;
    return coincideTexto && coincideCiudad && coincideModalidad;
  });
});

const destacados = computed(() => torneos.value.filter((t) => t.destacado).slice(0, 4));

const cercanos = computed(() =>
  torneos.value
    .filter((t) => {
      const dias = Formatters.diasHasta(t.fecha);
      return dias >= 0 && dias <= AppConfig.rangoCercanosDias;
    })
    .slice(0, 4)
);

const proximos = computed(() => torneos.value.slice(0, 8));

function limpiarFiltros() {
  filtros.texto = '';
  filtros.ciudad = '';
  filtros.modalidad = '';
}
</script>

<template>
  <div>
    <section class="hero">
      <h1 class="hero-titulo">Encuentra tu próximo torneo de ajedrez</h1>
      <p class="hero-subtitulo">Busca, compara e inscríbete en torneos de ajedrez en México.</p>

      <form class="buscador" role="search" @submit.prevent>
        <div class="buscador-fila">
          <label class="sr-only" for="busqueda">Buscar torneos por nombre, ciudad o estado</label>
          <input
            id="busqueda"
            v-model="filtros.texto"
            class="control"
            type="search"
            placeholder="Busca por nombre, ciudad o estado…"
            autocomplete="off"
          >
          <button type="submit" class="boton boton-dorado">Buscar</button>
        </div>

        <div class="filtros-fila">
          <label class="filtro">
            <span class="filtro-etiqueta">Ciudad</span>
            <select v-model="filtros.ciudad" class="control">
              <option value="">Todas las ciudades</option>
              <option v-for="ciudad in ciudades" :key="ciudad" :value="ciudad">{{ ciudad }}</option>
            </select>
          </label>

          <label class="filtro">
            <span class="filtro-etiqueta">Modalidad</span>
            <select v-model="filtros.modalidad" class="control">
              <option value="">Todas las modalidades</option>
              <option v-for="modalidad in modalidades" :key="modalidad" :value="modalidad">{{ modalidad }}</option>
            </select>
          </label>

          <button type="button" class="boton boton-texto" @click="limpiarFiltros">Limpiar filtros</button>
        </div>
      </form>
    </section>

    <section class="contenedor">
      <!-- Resultados de búsqueda -->
      <template v-if="hayFiltros">
        <h2 class="seccion-titulo">Resultados ({{ resultados.length }})</h2>
        <p v-if="!resultados.length" class="aviso">No encontramos torneos con esos criterios.</p>
        <div v-else class="rejilla-torneos">
          <TarjetaTorneo v-for="torneo in resultados" :key="torneo.id" :torneo="torneo" />
        </div>
      </template>

      <!-- Secciones del inicio -->
      <template v-else>
        <template v-if="destacados.length">
          <h2 class="seccion-titulo">Torneos destacados</h2>
          <div class="rejilla-torneos">
            <TarjetaTorneo v-for="torneo in destacados" :key="torneo.id" :torneo="torneo" />
          </div>
        </template>

        <template v-if="cercanos.length">
          <h2 class="seccion-titulo">Torneos cercanos</h2>
          <div class="rejilla-torneos">
            <TarjetaTorneo v-for="torneo in cercanos" :key="torneo.id" :torneo="torneo" />
          </div>
        </template>

        <template v-if="proximos.length">
          <h2 class="seccion-titulo">Próximos torneos</h2>
          <div class="rejilla-torneos">
            <TarjetaTorneo v-for="torneo in proximos" :key="torneo.id" :torneo="torneo" />
          </div>
        </template>
      </template>
    </section>
  </div>
</template>