<script setup>
/**
 * Detalle de un torneo: banner, características, categorías y CTA de
 * inscripción (reconoce si el jugador ya está inscrito).
 */
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { TournamentRepository } from '@/repositories/tournamentRepository.js';
import { RegistrationsRepository } from '@/core/registrationsRepository.js';
import { Formatters } from '@/utils/formatters.js';
import { useSesion } from '@/composables/useSesion.js';
import { notificar } from '@/composables/useAviso.js';
import EstadoInsignia from '@/components/EstadoInsignia.vue';

const ruta = useRoute();
const { estado, asegurarSesion } = useSesion();

const torneo = ref(null);
const inscripcion = ref(null);
const cargando = ref(true);

const GRADIENTES = [
  'linear-gradient(155deg, #2f6b46 0%, #1b4429 55%, #3a7d55 100%)',
  'linear-gradient(155deg, #2b4a70 0%, #1a2f4a 55%, #375d88 100%)',
  'linear-gradient(155deg, #7a4326 0%, #4d2817 55%, #8f5330 100%)'
];

const gradiente = computed(() => {
  if (!torneo.value) return GRADIENTES[0];
  let suma = 0;
  for (const ch of String(torneo.value.id)) suma += ch.codePointAt(0);
  return GRADIENTES[suma % GRADIENTES.length];
});

const completo = computed(() => torneo.value && torneo.value.inscritos >= torneo.value.cupo);

const caracteristicas = computed(() => {
  const t = torneo.value;
  if (!t) return [];
  return [
    ['Modalidad', t.modalidad],
    ['Sistema', t.sistema],
    ['Rondas', Formatters.plural(t.rondas, 'ronda', 'rondas')],
    ['Ritmo de juego', t.ritmo],
    ['Sede', t.sede],
    ['Dirección', t.direccion],
    ['Ciudad / Estado', `${t.ciudad}, ${t.estado}`]
  ];
});

onMounted(async () => {
  try {
    await asegurarSesion();
    torneo.value = await TournamentRepository.getById(ruta.params.id);
    if (torneo.value && estado.jugador) {
      const mias = await RegistrationsRepository.getPorJugador(estado.jugador.id);
      inscripcion.value = mias.find((r) => r.torneoId === torneo.value.id) || null;
    }
  } catch {
    notificar('No fue posible cargar el torneo.');
  } finally {
    cargando.value = false;
  }
});
</script>

<template>
  <section class="contenedor">
    <p v-if="cargando" class="texto-suave">Cargando torneo…</p>

    <div v-else-if="!torneo" class="tarjeta">
      <h1 class="titulo-pagina">Torneo no encontrado</h1>
      <p class="texto-suave">El torneo no existe o ya no está disponible.</p>
      <RouterLink class="boton boton-verde" to="/">Volver al catálogo</RouterLink>
    </div>

    <template v-else>
      <RouterLink class="enlace-volver" to="/">← Volver al catálogo</RouterLink>

      <div class="detalle-banner" :style="{ backgroundImage: gradiente }">
        <div class="detalle-banner-texto">
          <h1>{{ torneo.nombre }}</h1>
          <p>{{ Formatters.fechaCompleta(torneo.fecha) }} · {{ torneo.hora }} h</p>
          <p>{{ torneo.ciudad }}, {{ torneo.estado }}</p>
        </div>
      </div>

      <div class="detalle-cuerpo">
        <div class="detalle-info">
          <h2 class="detalle-subtitulo">Sobre el torneo</h2>
          <p class="detalle-descripcion">{{ torneo.descripcion }}</p>

          <h2 class="detalle-subtitulo">Características</h2>
          <dl class="detalle-caracteristicas">
            <template v-for="[clave, valor] in caracteristicas" :key="clave">
              <dt>{{ clave }}</dt>
              <dd>{{ valor }}</dd>
            </template>
          </dl>

          <template v-if="torneo.organizador">
            <h2 class="detalle-subtitulo">Organizador</h2>
            <p class="texto-suave">
              {{ torneo.organizador.nombre }}
              <template v-if="torneo.organizador.email"> · {{ torneo.organizador.email }}</template>
            </p>
          </template>

          <template v-if="torneo.chessResultsUrl">
            <h2 class="detalle-subtitulo">Resultados oficiales</h2>
            <p class="texto-suave">La clasificación y los resultados oficiales se publican en Chess-Results.</p>
            <a class="boton boton-borde" :href="torneo.chessResultsUrl" target="_blank" rel="noopener">
              Ver resultados en Chess-Results
            </a>
          </template>
        </div>

        <aside class="detalle-inscripcion">
          <h2 class="detalle-subtitulo">Inscripciones</h2>
          <ul class="lista-categorias">
            <li v-for="categoria in torneo.categorias" :key="categoria.nombre" class="categoria-fila">
              <span>{{ categoria.nombre }}</span>
              <strong>{{ Formatters.precio(categoria.precio) }}</strong>
            </li>
          </ul>

          <p class="detalle-lugares">
            {{ torneo.inscritos }} / {{ torneo.cupo }} lugares{{ completo ? ' · Completo' : '' }}
          </p>

          <template v-if="inscripcion">
            <p class="detalle-lugares">
              Ya estás inscrito · estado: <EstadoInsignia :estado="inscripcion.estado" />
            </p>
            <RouterLink class="boton boton-gris boton-bloque" to="/mis-inscripciones">
              Ver mis inscripciones
            </RouterLink>
          </template>
          <template v-else-if="completo">
            <button type="button" class="boton boton-gris boton-bloque" disabled>Inscribirme</button>
          </template>
          <template v-else>
            <RouterLink class="boton boton-verde boton-bloque" :to="`/torneo/${encodeURIComponent(torneo.id)}/inscribirse`">
              Inscribirme
            </RouterLink>
          </template>

          <p class="detalle-nota">Tu inscripción queda pendiente hasta que el organizador confirme el pago.</p>
        </aside>
      </div>
    </template>
  </section>
</template>