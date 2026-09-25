<script setup>
/**
 * Barra superior (estilo chess.com): logo, navegación y acciones de sesión.
 */
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSesion } from '@/composables/useSesion.js';
import { notificar } from '@/composables/useAviso.js';

const router = useRouter();
const { estado, esOrganizador, esJugador, cerrarSesion } = useSesion();

const menuAbierto = ref(false);

async function salir() {
  await cerrarSesion();
  notificar('Sesión cerrada.');
  menuAbierto.value = false;
  router.push('/');
}

function irA(ruta) {
  menuAbierto.value = false;
  router.push(ruta);
}
</script>

<template>
  <header class="barra">
    <div class="barra-interior">
      <RouterLink to="/" class="marca" @click="menuAbierto = false">
        <span class="marca-simbolo" aria-hidden="true">♞</span>
        <span class="marca-texto">AjedrezMX</span>
      </RouterLink>

      <nav class="enlaces-top" :class="{ abierto: menuAbierto }" aria-label="Navegación principal">
        <RouterLink to="/" class="enlace-top" @click="menuAbierto = false">Torneos</RouterLink>
        <RouterLink
          v-if="esJugador"
          to="/mis-inscripciones"
          class="enlace-top"
          @click="menuAbierto = false"
        >Mis inscripciones</RouterLink>
        <RouterLink
          v-if="esOrganizador"
          to="/panel"
          class="enlace-top"
          @click="menuAbierto = false"
        >Mi panel</RouterLink>
        <RouterLink
          v-if="estado.cuenta"
          to="/mi-cuenta"
          class="enlace-top"
          @click="menuAbierto = false"
        >Mi cuenta</RouterLink>
        <RouterLink to="/registro" class="enlace-top" @click="menuAbierto = false">Crear cuenta</RouterLink>
      </nav>

      <div class="acciones-top">
        <template v-if="estado.cuenta">
          <span class="perfil-chip">
            <span>{{ esOrganizador ? estado.organizador?.nombre || estado.cuenta.nombre : estado.cuenta.nombre }}</span>
          </span>
          <button type="button" class="boton boton-gris boton-sm" @click="salir">Salir</button>
        </template>
        <template v-else>
          <button type="button" class="boton boton-verde boton-sm" @click="irA('/acceder')">Acceder</button>
        </template>

        <button
          type="button"
          class="boton-menu"
          aria-label="Abrir menú"
          :aria-expanded="menuAbierto"
          @click="menuAbierto = !menuAbierto"
        >☰</button>
      </div>
    </div>
  </header>
</template>