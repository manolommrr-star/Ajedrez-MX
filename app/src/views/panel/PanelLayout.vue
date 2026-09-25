<script setup>
/**
 * Layout del panel del organizador: barra lateral con secciones y
 * contenido de la ruta hija (estilo chess.com dashboard).
 */
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSesion } from '@/composables/useSesion.js';
import { notificar } from '@/composables/useAviso.js';

const router = useRouter();
const { estado, cerrarSesion, refrescarSesion } = useSesion();

const SECCIONES = [
  { nombre: 'panel-resumen', texto: 'Inicio' },
  { nombre: 'panel-torneos', texto: 'Mis torneos' },
  { nombre: 'panel-crear', texto: 'Crear torneo' },
  { nombre: 'panel-cobros', texto: 'Cobros y cuenta' }
];

const menuAbierto = ref(false);

const nombrePerfil = computed(() => estado.organizador?.nombre || estado.cuenta?.nombre || '');
const emailPerfil = computed(() => estado.organizador?.email || estado.cuenta?.email || '');

onMounted(refrescarSesion);

async function salir() {
  await cerrarSesion();
  notificar('Sesión cerrada.');
  router.push('/');
}
</script>

<template>
  <div>
    <!-- Barra móvil: título + menú -->
    <div class="panel-barra-movil">
      <button type="button" class="boton-menu" aria-label="Abrir menú" @click="menuAbierto = !menuAbierto">☰</button>
      <strong>Panel del organizador</strong>
    </div>

    <div class="panel">
      <aside class="panel-lateral" :class="{ abierto: menuAbierto }">
        <div class="panel-perfil">
          <p class="panel-perfil-nombre">{{ nombrePerfil }}</p>
          <p class="panel-perfil-rol">{{ emailPerfil }}</p>
        </div>

        <nav class="panel-nav" aria-label="Navegación del panel">
          <RouterLink
            v-for="seccion in SECCIONES"
            :key="seccion.nombre"
            class="panel-enlace"
            :to="{ name: seccion.nombre }"
            active-class="activo"
            @click="menuAbierto = false"
          >{{ seccion.texto }}</RouterLink>
        </nav>

        <button type="button" class="boton boton-gris boton-sm" @click="salir">Cerrar sesión</button>
        <RouterLink class="boton boton-borde boton-sm" to="/">Volver al catálogo</RouterLink>
      </aside>

      <section class="panel-cuerpo">
        <RouterView />
      </section>
    </div>
  </div>
</template>