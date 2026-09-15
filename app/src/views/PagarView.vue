<script setup>
/**
 * Checkout del jugador: paga un folio (demo local con espera simulada).
 * Ruta: /pagar/:folio
 */
import { computed, onMounted, ref } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { OrganizadorRepository } from '@/repositories/organizadorRepository.js';
import { Formatters } from '@/utils/formatters.js';
import { notificar } from '@/composables/useAviso.js';

const ruta = useRoute();
const pago = ref(null);
const cargando = ref(true);
const procesando = ref(false);
const confirmado = ref(false);

const folio = computed(() => String(ruta.params.folio || '').toUpperCase());

onMounted(async () => {
  const pagos = await OrganizadorRepository.getPagos();
  pago.value = pagos.find((p) => String(p.folio).toUpperCase() === folio.value) || null;
  cargando.value = false;
});

async function pagar() {
  if (!pago.value || procesando.value || confirmado.value) return;
  procesando.value = true;
  await new Promise((r) => setTimeout(r, 1500));
  const { PaymentsRepository } = await import('@/core/paymentsRepository.js');
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
        <p><strong>Pago confirmado.</strong> Tu inscripción quedó registrada.</p>
        <RouterLink class="boton boton-verde" to="/mis-inscripciones">Ver mis inscripciones</RouterLink>
      </div>

      <button v-else type="button" class="boton boton-verde boton-bloque" :disabled="procesando" @click="pagar">
        {{ procesando ? 'Procesando…' : `Pagar ${Formatters.precio(pago.monto)}` }}
      </button>
      <p class="detalle-nota">Demo: el pago se confirma localmente vía webhook simulado.</p>
    </div>
  </section>
</template>
