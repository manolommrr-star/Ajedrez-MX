<script setup>
/**
 * Panel · Inscripciones de un torneo: valida pagos, confirma y
 * registra pagos manuales en efectivo.
 */
import { computed, onMounted, ref } from 'vue';
import { OrganizadorRepository } from '@/repositories/organizadorRepository.js';
import { Formatters } from '@/utils/formatters.js';
import { notificar } from '@/composables/useAviso.js';
import EstadoInsignia from '@/components/EstadoInsignia.vue';
import TablaBase from '@/components/TablaBase.vue';

const props = defineProps({ id: { type: String, required: true } });

const torneo = ref(null);
const participantes = ref([]);
const cargando = ref(true);
const pagoJugador = ref('');
const pagoCategoria = ref('');

const columnas = ['Jugador', 'Categoría', 'Cuota', 'Estado', 'Fecha', 'Acciones'];

const MAPA = {
  'validar-pago': 'pagada', 'marcar-revision': 'pago_en_revision',
  confirmar: 'confirmada', checkin: 'checkin',
  cancelar: 'cancelada', rechazar: 'rechazada', retirar: 'retirada'
};

const pendientes = computed(() => participantes.value.filter(
  (p) => p.estado === 'pago_pendiente' || p.estado === 'pago_en_revision'
).length);

/** Opciones del select de pago: solo inscripciones del torneo con pago pendiente. */
const opcionesPago = computed(() => participantes.value
  .filter((p) => p.estado === 'pago_pendiente' || p.estado === 'pago_en_revision')
  .map((p) => ({ id: p.playerId, etiqueta: p.nombreJugador, categoria: p.categoria })));

/** Al elegir un jugador, preselecciona su categoría registrada. */
function alElegirPago() {
  const opcion = opcionesPago.value.find((o) => o.id === pagoJugador.value);
  if (opcion?.categoria) pagoCategoria.value = opcion.categoria;
}

async function cargar() {
  torneo.value = await OrganizadorRepository.getTorneoPorId(props.id);
  if (torneo.value) {
    participantes.value = await OrganizadorRepository.getParticipantes(props.id);
    if (torneo.value.categorias?.length) pagoCategoria.value = torneo.value.categorias[0].nombre;
  }
  cargando.value = false;
}

onMounted(cargar);

function accionesDe(p) {
  if (p.estado === 'pago_pendiente') return [['marcar-revision', 'Marcar en revisión'], ['validar-pago', 'Validar pago'], ['cancelar', 'Cancelar']];
  if (p.estado === 'pago_en_revision') return [['validar-pago', 'Validar pago'], ['rechazar', 'Rechazar']];
  if (p.estado === 'pagada') return [['confirmar', 'Confirmar'], ['retirar', 'Retirar']];
  if (p.estado === 'confirmada') return [['checkin', 'Check-in'], ['retirar', 'Retirar'], ['cancelar', 'Cancelar']];
  if (p.estado === 'pendiente') return [['cancelar', 'Cancelar']];
  return [];
}

async function aplicar(p, accion) {
  const destino = MAPA[accion];
  if (!destino) return;
  const ok = await OrganizadorRepository.actualizarEstadoInscripcion(p.id, destino);
  notificar(ok ? 'Inscripción actualizada.' : 'Transición no válida.');
  if (ok) p.estado = destino;
}

async function registrarEfectivo() {
  if (!pagoJugador.value || !pagoCategoria.value) {
    notificar('Elige jugador y categoría.');
    return;
  }
  const cat = torneo.value.categorias.find((c) => c.nombre === pagoCategoria.value);
  await OrganizadorRepository.registrarPagoManual({
    torneoId: props.id, eventoId: torneo.value.eventoId || null,
    playerId: pagoJugador.value, categoria: pagoCategoria.value, precio: cat ? cat.precio : 0
  });
  notificar('Pago en efectivo registrado.');
  participantes.value = await OrganizadorRepository.getParticipantes(props.id);
}
</script>

<template>
  <p v-if="cargando" class="texto-suave">Cargando…</p>
  <p v-else-if="!torneo" class="aviso">El torneo no existe o no te pertenece.</p>

  <template v-else>
    <RouterLink class="enlace-volver" :to="{ name: 'panel-torneos' }">← Mis torneos</RouterLink>
    <h1 class="titulo-pagina">Inscripciones · {{ torneo.nombre }}</h1>
    <p class="subtitulo-pagina">
      Valida pagos y confirma jugadores.
      <strong v-if="pendientes">Tienes {{ pendientes }} pago(s) por revisar.</strong>
    </p>

    <div class="chips-fila">
      <span class="chip chip-info">Usa las pestañas de arriba para ver participantes y check-in</span>
    </div>

    <h2 class="seccion-titulo">Registrar pago en efectivo</h2>
    <form class="tarjeta" @submit.prevent="registrarEfectivo">
      <div class="campo-fila">
        <label class="campo"><span class="campo-etiqueta">Jugador (pago pendiente)</span>
          <select v-model="pagoJugador" class="control" @change="alElegirPago">
            <option value="">Seleccionar…</option>
            <option v-for="o in opcionesPago" :key="o.id" :value="o.id">{{ o.etiqueta }}</option>
          </select></label>
        <label class="campo"><span class="campo-etiqueta">Categoría</span>
          <select v-model="pagoCategoria" class="control">
            <option v-for="c in torneo.categorias" :key="c.nombre" :value="c.nombre">{{ c.nombre }} · {{ Formatters.precio(c.precio) }}</option>
          </select></label>
      </div>
      <p v-if="!opcionesPago.length" class="texto-suave">No hay inscripciones con pago pendiente en este torneo.</p>

      <div class="acciones-form"><button type="submit" class="boton boton-verde boton-sm" :disabled="!opcionesPago.length">Registrar pago</button></div>
    </form>

    <h2 class="seccion-titulo">Listado</h2>
    <tabla-base :columnas="columnas" :vacia="!participantes.length" mensaje-vacio="Sin inscripciones todavía.">
      <tr v-for="p in participantes" :key="p.id">
        <td data-col="Jugador"><strong>{{ p.nombreJugador }}</strong></td>
        <td data-col="Categoría">{{ p.categoria }}</td>
        <td data-col="Cuota">{{ Formatters.precio(p.precio) }}</td>
        <td data-col="Estado"><EstadoInsignia :estado="p.estado" /></td>
        <td data-col="Fecha">{{ Formatters.fechaLarga(p.fechaCreacion) }}</td>
        <td data-col="Acciones">
          <span v-if="!accionesDe(p).length" class="texto-suave">—</span>
          <span v-else class="chips-fila">
            <button v-for="[accion, texto] in accionesDe(p)" :key="accion" type="button" class="boton boton-texto" @click="aplicar(p, accion)">{{ texto }}</button>
          </span>
        </td>
      </tr>
    </tabla-base>
  </template>
</template>
