<script setup>
/**
 * "Mis inscripciones": listado del jugador con estado y cancelación
 * temprana (solo estados pendiente/pago_pendiente).
 */
import { computed, onMounted, ref } from 'vue';
import { RegistrationsRepository } from '@/core/registrationsRepository.js';
import { PaymentsRepository } from '@/core/paymentsRepository.js';
import { Formatters } from '@/utils/formatters.js';
import { useSesion } from '@/composables/useSesion.js';
import { notificar } from '@/composables/useAviso.js';
import EstadoInsignia from '@/components/EstadoInsignia.vue';
import TablaBase from '@/components/TablaBase.vue';

const { estado, asegurarSesion } = useSesion();
const inscripciones = ref([]);
const cargando = ref(true);

const columnas = ['Torneo', 'Fecha', 'Categoría', 'Cuota', 'Estado', 'Inscrito', 'Acciones'];

onMounted(async () => {
  await asegurarSesion();
  if (!estado.jugador) {
    cargando.value = false;
    return;
  }
  try {
    const mias = await RegistrationsRepository.getPorJugador(estado.jugador.id);
    inscripciones.value = await Promise.all(
      mias
        .slice()
        .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
        .map(async (r) => ({
          ...r,
          torneo: await RegistrationsRepository.getInfoTorneo(r.torneoId),
          pago: await PaymentsRepository.getPorInscripcion(r.id)
        }))
    );
  } catch {
    notificar('No fue posible cargar tus inscripciones.');
  } finally {
    cargando.value = false;
  }
});

const nombreJugador = computed(() => Formatters.nombre(estado.jugador));

function cancelable(r) {
  return r.estado === 'pendiente' || r.estado === 'pago_pendiente';
}

async function cancelar(r) {
  if (!confirm(`¿Cancelar tu inscripción a ${r.torneo?.nombre || r.torneoId}?`)) return;
  const ok = await RegistrationsRepository.cancelarDeJugador(r.id, estado.jugador.id);
  notificar(ok ? 'Inscripción cancelada.' : 'No fue posible cancelar la inscripción.');
  if (ok) r.estado = 'cancelada';
}
</script>

<template>
  <section class="contenedor">
    <h1 class="titulo-pagina">Mis inscripciones</h1>

    <p v-if="cargando" class="texto-suave">Cargando…</p>

    <div v-else-if="!estado.jugador" class="aviso aviso-info">
      <p>
        Aún no hay una sesión de jugador. Usa <strong>Acceder</strong> en la barra superior
        o inscríbete a un torneo desde el <RouterLink to="/">catálogo</RouterLink>.
      </p>
    </div>

    <template v-else>
      <p class="subtitulo-pagina">Jugador: <strong>{{ nombreJugador }}</strong></p>

      <tabla-base :columnas="columnas" :vacia="!inscripciones.length" mensaje-vacio="Aún no tienes inscripciones.">
        <tr v-for="r in inscripciones" :key="r.id">
          <td data-col="Torneo"><strong>{{ r.torneo?.nombre || r.torneoId }}</strong></td>
          <td data-col="Fecha">{{ r.torneo ? Formatters.fechaLarga(r.torneo.fecha) : '—' }}</td>
          <td data-col="Categoría">{{ r.categoria }}</td>
          <td data-col="Cuota">{{ Formatters.precio(r.precio) }}</td>
          <td data-col="Estado"><EstadoInsignia :estado="r.estado" /></td>
          <td data-col="Inscrito">{{ Formatters.fechaLarga(r.fechaCreacion) }}</td>
          <td data-col="Acciones">
            <span class="chips-fila">
              <RouterLink
                v-if="r.pago && r.pago.estado === 'pendiente'"
                class="boton boton-verde boton-sm"
                :to="`/pagar/${encodeURIComponent(r.pago.folio)}`"
              >Pagar</RouterLink>
              <button v-if="cancelable(r)" type="button" class="boton boton-texto" @click="cancelar(r)">
                Cancelar
              </button>
              <span v-if="!cancelable(r) && !(r.pago && r.pago.estado === 'pendiente')" class="texto-suave">—</span>
            </span>
          </td>
        </tr>
      </tabla-base>
    </template>
  </section>
</template>