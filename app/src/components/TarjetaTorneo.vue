<script setup>
/**
 * Tarjeta de torneo del catálogo (estilo chess.com):
 * franja superior con gradiente de tablero, datos y CTA.
 */
import { computed } from 'vue';
import { Formatters } from '@/utils/formatters.js';

const props = defineProps({
  torneo: { type: Object, required: true }
});

/** Gradientes con tono de tablero cuando el torneo no tiene foto. */
const GRADIENTES = [
  'linear-gradient(155deg, #2f6b46 0%, #1b4429 55%, #3a7d55 100%)',
  'linear-gradient(155deg, #2b4a70 0%, #1a2f4a 55%, #375d88 100%)',
  'linear-gradient(155deg, #7a4326 0%, #4d2817 55%, #8f5330 100%)'
];

const indice = computed(() => {
  let suma = 0;
  for (const ch of String(props.torneo.id)) suma += ch.codePointAt(0);
  return suma % GRADIENTES.length;
});

const completo = computed(() => props.torneo.inscritos >= props.torneo.cupo);

const precioMinimo = computed(() => Math.min(...props.torneo.categorias.map((c) => c.precio)));

const precioTexto = computed(() =>
  props.torneo.categorias.length > 1
    ? `Desde ${Formatters.precio(precioMinimo.value)}`
    : Formatters.precio(precioMinimo.value)
);

const enlace = computed(() => `/torneo/${encodeURIComponent(props.torneo.id)}`);
</script>

<template>
  <article class="tarjeta-torneo">
    <RouterLink
      class="tarjeta-imagen"
      :style="{ backgroundImage: GRADIENTES[indice] }"
      :to="enlace"
      tabindex="-1"
      aria-hidden="true"
    >
      <span class="tarjeta-simbolo">♞</span>
      <span v-if="completo" class="etiqueta-flotante etiqueta-completo">Completo</span>
      <span v-else-if="torneo.destacado" class="etiqueta-flotante etiqueta-destacado">Destacado</span>
    </RouterLink>

    <div class="tarjeta-cuerpo">
      <h3 class="tarjeta-nombre">
        <RouterLink :to="enlace">{{ torneo.nombre }}</RouterLink>
      </h3>

      <div class="tarjeta-meta">
        <p>{{ Formatters.fechaLarga(torneo.fecha) }} · {{ torneo.hora }} h</p>
        <p>{{ torneo.ciudad }}, {{ torneo.estado }}</p>
        <p>{{ torneo.modalidad }} · {{ torneo.sistema }} · {{ Formatters.plural(torneo.rondas, 'ronda', 'rondas') }}</p>
      </div>

      <div class="tarjeta-pie">
        <span>
          <span class="precio">{{ precioTexto }}</span>
          <span class="precio-desde"> · {{ torneo.inscritos }}/{{ torneo.cupo }} lugares</span>
        </span>
        <RouterLink class="boton boton-verde boton-sm" :to="enlace">Ver torneo</RouterLink>
      </div>
    </div>
  </article>
</template>