<script setup>
/**
 * Panel · Mis torneos: tarjetas con estado, ocupación y acciones.
 */
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { OrganizadorRepository } from '@/repositories/organizadorRepository.js';
import { Formatters } from '@/utils/formatters.js';
import { notificar } from '@/composables/useAviso.js';
import EstadoInsignia from '@/components/EstadoInsignia.vue';

const router = useRouter();
const torneos = ref([]);
const cargando = ref(true);

async function cargar() {
  try {
    torneos.value = await OrganizadorRepository.getTorneos();
  } catch {
    notificar('No fue posible cargar tus torneos.');
  } finally {
    cargando.value = false;
  }
}

onMounted(cargar);

function ocupacion(t) {
  return t.cupo ? Math.round((t.inscritos / t.cupo) * 100) : 0;
}

async function publicar(t) {
  if (await OrganizadorRepository.publicarTorneo(t.id)) {
    notificar('Torneo publicado.');
    await cargar();
  }
}

async function despublicar(t) {
  if (await OrganizadorRepository.despublicarTorneo(t.id)) {
    notificar('Torneo devuelto a borrador.');
    await cargar();
  }
}

async function cancelar(t) {
  if (!confirm(`¿Cancelar "${t.nombre}"?`)) return;
  if (await OrganizadorRepository.cancelarTorneo(t.id)) {
    notificar('Torneo cancelado.');
    await cargar();
  }
}

async function duplicar(t) {
  const copia = await OrganizadorRepository.duplicarTorneo(t.id);
  if (copia) {
    notificar('Torneo duplicado como borrador.');
    router.push({ name: 'panel-editar', params: { id: copia.id } });
  }
}
</script>

<template>
  <div class="panel-encabezado">
    <h1 class="panel-titulo">Mis torneos</h1>
    <RouterLink class="boton boton-verde boton-sm" :to="{ name: 'panel-crear' }">Crear torneo</RouterLink>
  </div>

  <p v-if="cargando" class="texto-suave">Cargando…</p>

  <div v-else class="lista-filas">
    <article v-for="t in torneos" :key="t.id" class="fila-dato">
      <div>
        <p class="fila-dato-nombre">
          <RouterLink :to="`/torneo/${encodeURIComponent(t.id)}`">{{ t.nombre }}</RouterLink>
        </p>
        <p class="fila-dato-meta">{{ Formatters.fechaLarga(t.fecha) }} · {{ t.ciudad }}, {{ t.estado }}</p>
      </div>
      <EstadoInsignia :estado="t.estadoPublicacion" />
      <div class="fila-dato-pie">
        <div class="progreso"><i :style="{ width: `${ocupacion(t)}%` }" /></div>
        <p class="fila-dato-meta">{{ t.inscritos }} / {{ t.cupo }} lugares ({{ ocupacion(t) }} %)</p>
      </div>
      <div class="fila-dato-pie fila-dato-acciones">
        <RouterLink class="boton boton-texto" :to="{ name: 'panel-torneo-detalle', params: { id: t.id } }">Gestionar</RouterLink>
        <RouterLink class="boton boton-texto" :to="{ name: 'panel-editar', params: { id: t.id } }">Editar</RouterLink>
        <button type="button" class="boton boton-texto" @click="duplicar(t)">Duplicar</button>
        <button v-if="t.estadoPublicacion === 'borrador'" type="button" class="boton boton-texto" @click="publicar(t)">Publicar</button>
        <button v-if="t.estadoPublicacion === 'publicado'" type="button" class="boton boton-texto" @click="despublicar(t)">Regresar a borrador</button>
        <button v-if="t.estadoPublicacion !== 'cancelado'" type="button" class="boton boton-texto boton-peligro" @click="cancelar(t)">Cancelar</button>
      </div>
    </article>
    <p v-if="!torneos.length" class="aviso">Aún no tienes torneos.</p>
  </div>
</template>
