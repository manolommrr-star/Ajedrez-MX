<script setup>
/**
 * Registro de cuentas con elección de rol (jugador u organizador).
 * Crea la cuenta demo (mock de auth.users + profiles) e inicia sesión.
 */
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { CuentasRepository } from '@/core/cuentasRepository.js';
import { useSesion } from '@/composables/useSesion.js';
import { notificar } from '@/composables/useAviso.js';

const router = useRouter();
const { iniciarSesion } = useSesion();

const datos = reactive({
  rol: 'player', nombre: '', apellidos: '', email: '', clave: '', confirmar: '',
  fideId: '', elo: '', club: '', federacion: '', ciudad: '', estado: '', organizacion: ''
});

const esOrganizador = computed(() => datos.rol === 'organizer');
const enviando = ref(false);

async function enviar() {
  if (!datos.rol) {
    notificar('Elige el tipo de cuenta.');
    return;
  }
  if (datos.clave !== datos.confirmar) {
    notificar('Las contraseñas no coinciden.');
    return;
  }
  const extras = esOrganizador.value
    ? { organizacion: datos.organizacion.trim() }
    : {
        fideId: datos.fideId, elo: datos.elo, club: datos.club,
        federacion: datos.federacion, ciudad: datos.ciudad, estado: datos.estado
      };

  if (esOrganizador.value && !extras.organizacion) {
    notificar('Escribe el nombre de la organización.');
    return;
  }

  enviando.value = true;
  const resultado = await CuentasRepository.registrar({
    rol: datos.rol,
    nombre: datos.nombre,
    apellidos: datos.apellidos,
    email: datos.email,
    clave: datos.clave,
    extras
  });
  enviando.value = false;

  if (!resultado.ok) {
    notificar(resultado.motivo);
    return;
  }

  await iniciarSesion(resultado.cuenta.id);
  notificar('Cuenta creada. ¡Bienvenido/a!');
  router.push(esOrganizador.value ? '/panel' : '/mis-inscripciones');
}
</script>

<template>
  <section class="contenedor">
    <h1 class="titulo-pagina">Crear cuenta</h1>
    <p class="subtitulo-pagina">Demo: la cuenta vive en este navegador (mock de auth.users + profiles).</p>

    <form class="formulario" @submit.prevent="enviar">
      <div class="grupo-campos">
        <p class="grupo-titulo">Tipo de cuenta</p>
        <div class="opciones-rol">
          <label class="opcion">
            <input v-model="datos.rol" type="radio" value="player" name="rol">
            <span>
              <span class="opcion-titulo">Jugador</span>
              <span class="opcion-desc">Buscar torneos, inscribirte y seguir tus inscripciones</span>
            </span>
          </label>
          <label class="opcion">
            <input v-model="datos.rol" type="radio" value="organizer" name="rol">
            <span>
              <span class="opcion-titulo">Organizador</span>
              <span class="opcion-desc">Publicar torneos, gestionar inscripciones, pagos y check-in</span>
            </span>
          </label>
        </div>
      </div>

      <div class="grupo-campos">
        <p class="grupo-titulo">Acceso</p>
        <div class="campo-fila">
          <label class="campo">
            <span class="campo-etiqueta">Nombre *</span>
            <input v-model="datos.nombre" class="control" required>
          </label>
          <label class="campo">
            <span class="campo-etiqueta">Apellidos</span>
            <input v-model="datos.apellidos" class="control">
          </label>
        </div>

        <label class="campo">
          <span class="campo-etiqueta">Correo *</span>
          <input v-model="datos.email" class="control" type="email" required>
        </label>

        <div class="campo-fila">
          <label class="campo">
            <span class="campo-etiqueta">Contraseña * (mínimo 8)</span>
            <input v-model="datos.clave" class="control" type="password" minlength="8" required>
          </label>
          <label class="campo">
            <span class="campo-etiqueta">Confirmar contraseña *</span>
            <input v-model="datos.confirmar" class="control" type="password" minlength="8" required>
          </label>
        </div>
      </div>

      <div v-if="!esOrganizador" class="grupo-campos">
        <p class="grupo-titulo">Datos de jugador (opcional)</p>
        <div class="campo-fila">
          <label class="campo">
            <span class="campo-etiqueta">FIDE ID</span>
            <input v-model="datos.fideId" class="control">
          </label>
          <label class="campo">
            <span class="campo-etiqueta">Elo</span>
            <input v-model="datos.elo" class="control" type="number" min="0">
          </label>
        </div>
        <div class="campo-fila">
          <label class="campo">
            <span class="campo-etiqueta">Club</span>
            <input v-model="datos.club" class="control">
          </label>
          <label class="campo">
            <span class="campo-etiqueta">Federación</span>
            <input v-model="datos.federacion" class="control">
          </label>
        </div>
        <div class="campo-fila">
          <label class="campo">
            <span class="campo-etiqueta">Ciudad</span>
            <input v-model="datos.ciudad" class="control">
          </label>
          <label class="campo">
            <span class="campo-etiqueta">Estado</span>
            <input v-model="datos.estado" class="control">
          </label>
        </div>
      </div>

      <div v-else class="grupo-campos">
        <p class="grupo-titulo">Organización</p>
        <label class="campo">
          <span class="campo-etiqueta">Nombre de la organización o club *</span>
          <input v-model="datos.organizacion" class="control">
        </label>
      </div>

      <div class="acciones-form">
        <RouterLink class="boton boton-gris" to="/acceder">Ya tengo cuenta</RouterLink>
        <button type="submit" class="boton boton-verde" :disabled="enviando">
          {{ enviando ? 'Creando…' : 'Crear cuenta' }}
        </button>
      </div>
    </form>
  </section>
</template>