<script setup>
/**
 * Panel · Validación QR: valida un folio de pago (demo).
 * Avance visual: el QR real se generará por inscripción pagada.
 */
import { computed, ref } from 'vue';
import { OrganizadorRepository } from '@/repositories/organizadorRepository.js';
import { notificar } from '@/composables/useAviso.js';

const folio = ref('');
const resultado = ref(null);

/** Marcador QR demo: patrón fijo, solo ilustrativo. */
const modulos = computed(() => {
  const n = 29;
  let semilla = 7;
  const aleatorio = () => {
    semilla = (semilla * 1664525 + 1013904223) & 0xffffffff;
    return (semilla & 1) === 1;
  };
  const enMarcador = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const lista = [];
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      if (!enMarcador(x, y) && aleatorio()) lista.push(`${x},${y}`);
    }
  }
  return lista;
});

function marcador(cx, cy) {
  let rects = '';
  for (let y = cy; y < cy + 7; y += 1) {
    for (let x = cx; x < cx + 7; x += 1) {
      const borde = x === cx || x === cx + 6 || y === cy || y === cy + 6;
      const centro = x >= cx + 2 && x <= cx + 4 && y >= cy + 2 && y <= cy + 4;
      if (borde || centro) rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  }
  return rects;
}

function cuadradosVista() {
  let s = '';
  for (const par of modulos.value) {
    const [x, y] = par.split(',').map(Number);
    s += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return s;
}

async function validar() {
  const texto = folio.value.trim().toUpperCase();
  if (!texto) {
    notificar('Escribe un folio para validar.');
    return;
  }
  const pagos = await OrganizadorRepository.getPagos();
  const pago = pagos.find((p) => String(p.folio).toUpperCase() === texto);
  if (!pago) {
    resultado.value = 'Folio no encontrado.';
  } else if (pago.estado === 'pagado') {
    resultado.value = `Folio válido · ${pago.jugador} · ${pago.torneo}`;
  } else {
    resultado.value = `Folio sin pago confirmado (estado: ${pago.estado}).`;
  }
  notificar(resultado.value);
}
</script>

<template>
  <h1 class="titulo-pagina">Validación QR</h1>
  <p class="subtitulo-pagina">Avance visual: el QR real se generará por inscripción pagada.</p>

  <div class="tarjeta">
    <svg viewBox="-2 -2 33 33" role="img" aria-label="QR de demostración" v-html="marcador(0,0) + marcador(22,0) + marcador(0,22) + cuadradosVista()" />
  </div>

  <form class="filtros-fila" @submit.prevent="validar">
    <input v-model="folio" class="control" placeholder="Escribe un folio…" />
    <button type="submit" class="boton boton-dorado boton-sm">Validar</button>
  </form>

  <p v-if="resultado" class="aviso aviso-info">{{ resultado }}</p>
</template>
