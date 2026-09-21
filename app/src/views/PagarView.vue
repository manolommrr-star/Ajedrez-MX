<script setup>
/**
 * Checkout del jugador: paga un folio (demo local con espera simulada).
 * Ruta: /pagar/:folio
 */
import { computed, onMounted, ref } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { PaymentsRepository } from '@/core/paymentsRepository.js';
import { useSesion } from '@/composables/useSesion.js';
import { Formatters } from '@/utils/formatters.js';
import { notificar } from '@/composables/useAviso.js';

const ruta = useRoute();
const { estado, asegurarSesion } = useSesion();

const pago = ref(null);
const cargando = ref(true);
const procesando = ref(false);
const confirmado = ref(false);
const noAutorizado = ref(false);

const folio = computed(() => String(ruta.params.folio || '').toUpperCase());
const puedePagar = computed(() => !!pago.value && pago.value.estado === 'pendiente');

onMounted(async () => {
  try {
    await asegurarSesion();
    const encontrado = await PaymentsRepository.getPorFolio(folio.value);
    // El folio solo lo puede ver y pagar su dueño (nunca un visitante anónimo).
    if (encontrado && (!estado.jugador || encontrado.playerId !== estado.jugador.id)) {
      noAutorizado.value = true;
    } else {
      pago.value = encontrado;
    }
  } catch {
    notificar('No fue posible cargar el pago.');
  } finally {
    cargando.value = false;
  }
});

async function pagar() {
  if (!puedePagar.value || procesando.value || confirmado.value) return;
  procesando.value = true;
  await new Promise((r) => setTimeout(r, 1500)); // espera simulada del proveedor
  const resultado = await PaymentsRepository.simularWebhook(pago.value.id);
  procesando.value = false;
  if (resultado.ok) {
    pago.value = resultado.pago;
    confirmado.value = true;
    notificar('Pago confirmado.');
  } else {
    notificar(resultado.motivo);
  }
}
</script>

<template>
  <section class="contenedor">
    <RouterLink class="enlace-volver" to="/">← Catálogo</RouterLink>
    <h1 class="titulo-pagina">Pagar inscripción</h1>

    <p v-if="cargando" class="texto-suave">Cargando…</p>

    <div v-else-if="noAutorizado" class="aviso aviso-info">
      <p>
        Este folio no corresponde a tu cuenta.
        <RouterLink :to="{ name: 'acceder', query: { redir: ruta.fullPath } }">Inicia sesión</RouterLink>
        con la cuenta que hizo la inscripción para pagarlo.
      </p>
    </div>

    <p v-else-if="!pago" class="aviso aviso-peligro">Folio {{ folio }} no encontrado.</p>

    <div v-else class="checkout tarjeta">
      <div class="checkout-fila"><span class="checkout-label">Folio</span><strong>{{ pago.folio }}</strong></div>
      <div class="checkout-fila"><span class="checkout-label">Torneo</span><strong>{{ pago.torneo }}</strong></div>
      <div class="checkout-fila"><span class="checkout-label">Jugador</span><strong>{{ pago.jugador }}</strong></div>
      <div class="checkout-fila"><span class="checkout-label">Proveedor</span><strong>{{ pago.proveedor }}</strong></div>
      <div class="checkout-fila"><span class="checkout-label">Estado</span><strong>{{ pago.estado }}</strong></div>
      <div class="checkout-fila checkout-fila-total"><span>Total</span><span>{{ Formatters.precio(pago.monto) }}</span></div>

      <div v-if="confirmado || pago.estado === 'pagado'" class="pago-exito">
        <span class="pago-exito-icono">✓</span>
        <p><strong>Pago confirmado.</strong> Tu inscripción quedó confirmada para el torneo.</p>
        <RouterLink class="boton boton-verde" to="/mis-inscripciones">Ver mis inscripciones</RouterLink>
      </div>

      <button v-else-if="puedePagar" type="button" class="boton boton-verde boton-bloque" :disabled="procesando" @click="pagar">
        {{ procesando ? 'Procesando…' : `Pagar ${Formatters.precio(pago.monto)}` }}
      </button>

      <p v-else class="aviso">Este pago está en estado <strong>{{ pago.estado }}</strong> y no admite pago en línea.</p>

      <p class="detalle-nota">Pago en línea (demo): la pasarela está simulada en el navegador. En producción el pago lo confirma el webhook del proveedor, nunca el cliente.</p>
    </div>
  </section>
</template>
