<script setup>
/**
 * Vista de acceso: inicia sesión con una cuenta registrada (demo) o con
 * los accesos rápidos a las cuentas demo.
 */
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CuentasRepository } from '@/core/cuentasRepository.js';
import { useSesion } from '@/composables/useSesion.js';
import { notificar } from '@/composables/useAviso.js';

const ruta = useRoute();
const router = useRouter();
const { iniciarSesion } = useSesion();

const datos = reactive({ email: '', clave: '' });
const enviando = ref(false);

/** Tras entrar: si venía de una ruta protegida, vuelve allí. */
async function entrarCon(cuenta) {
  await iniciarSesion(cuenta.id);
  notificar(`Sesión iniciada · ${cuenta.nombre}`);
  const destino = typeof ruta.query.redir === 'string'
    ? ruta.query.redir
    : cuenta.rol === 'organizer' ? '/panel' : '/mis-inscripciones';
  router.push(destino);
}

async function enviar() {
  enviando.value = true;
  const resultado = await CuentasRepository.acceder({ email: datos.email, clave: datos.clave });
  enviando.value = false;
  if (!resultado.ok) {
    notificar(resultado.motivo);
    return;
  }
  await entrarCon(resultado.cuenta);
}

async function accesoDemo(rol) {
  const cuenta = await CuentasRepository.getDemo(rol);
  if (!cuenta) {
    notificar('No hay cuenta demo disponible.');
    return;
  }
  await entrarCon(cuenta);
}

onMounted(() => {
  document.getElementById('acceso-email')?.focus();
});
</script>

<template>
  <section class="contenedor">
    <h1 class="titulo-pagina">Acceder</h1>
    <p class="subtitulo-pagina">Demo: las cuentas viven en este navegador.</p>

    <form class="formulario" @submit.prevent="enviar">
      <div class="grupo-campos">
        <p class="grupo-titulo">Correo y contraseña</p>

        <label class="campo">
          <span class="campo-etiqueta">Correo</span>
          <input id="acceso-email" v-model="datos.email" class="control" type="email" required>
        </label>

        <label class="campo">
          <span class="campo-etiqueta">Contraseña</span>
          <input v-model="datos.clave" class="control" type="password" required>
        </label>

        <button type="submit" class="boton boton-verde boton-bloque" :disabled="enviando">
          {{ enviando ? 'Entrando…' : 'Entrar' }}
        </button>
      </div>

      <div class="aviso aviso-info">
        <p>
          <strong>Cuentas demo</strong> (contraseña <code>demo1234</code>):
          jugador <code>ana.torres@correo.mx</code> ·
          organizador <code>contacto@ajedrezxalapa.mx</code>
        </p>
      </div>

      <div class="panel-acciones-rapidas">
        <button type="button" class="boton boton-gris boton-sm" @click="accesoDemo('player')">
          Entrar como jugador demo
        </button>
        <button type="button" class="boton boton-gris boton-sm" @click="accesoDemo('organizer')">
          Entrar como organizador demo
        </button>
      </div>
    </form>

    <p class="campo-ayuda">
      ¿No tienes cuenta? <RouterLink to="/registro">Crear cuenta</RouterLink>
      · <RouterLink to="/recuperar">Olvidé mi contraseña</RouterLink>
    </p>
  </section>
</template>