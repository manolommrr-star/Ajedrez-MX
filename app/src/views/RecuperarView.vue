<script setup>
/**
 * Recuperación de contraseña (demo: réplica de
 * supabase.auth.resetPasswordForEmail con código de un solo uso):
 * solicitar código → capturar código + nueva contraseña → acceder.
 */
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { CuentasRepository } from '@/core/cuentasRepository.js';
import { notificar } from '@/composables/useAviso.js';
import { esCorreo, claveAceptable } from '@/utils/validacionesCuenta.js';

const router = useRouter();

const paso = ref(1);
const correo = ref('');
const codigoDemo = ref('');
const f = reactive({ codigo: '', clave: '', confirmar: '' });
const enviando = ref(false);

async function solicitar() {
  if (!esCorreo(correo.value)) { notificar('Escribe un correo válido.'); return; }
  enviando.value = true;
  const r = await CuentasRepository.solicitarRecuperacion(correo.value);
  enviando.value = false;
  if (!r.ok) { notificar(r.motivo); return; }
  codigoDemo.value = r.codigo;
  paso.value = 2;
}

async function restablecer() {
  if (f.clave !== f.confirmar) { notificar('Las contraseñas no coinciden.'); return; }
  const motivo = claveAceptable(f.clave);
  if (motivo) { notificar(motivo); return; }
  enviando.value = true;
  const r = await CuentasRepository.restablecerClave({
    email: correo.value,
    codigo: f.codigo,
    claveNueva: f.clave
  });
  enviando.value = false;
  if (!r.ok) { notificar(r.motivo); return; }
  notificar('Contraseña actualizada. Ya puedes acceder.');
  router.push('/acceder');
}

/** Vuelve al paso 1 con otro correo. */
function cambiarCorreo() {
  codigoDemo.value = '';
  f.codigo = '';
  f.clave = '';
  f.confirmar = '';
  paso.value = 1;
}
</script>

<template>
  <section class="contenedor">
    <h1 class="titulo-pagina">Recuperar contraseña</h1>
    <p class="subtitulo-pagina">Solicita un código y fija una contraseña nueva.</p>

    <!-- Paso 1 · correo -->
    <form v-if="paso === 1" class="formulario" @submit.prevent="solicitar">
      <div class="grupo-campos">
        <p class="grupo-titulo">Paso 1 · Tu correo</p>
        <label class="campo">
          <span class="campo-etiqueta">Correo de la cuenta *</span>
          <input v-model="correo" class="control" type="email" required>
        </label>
        <p class="campo-ayuda">Recibirás un código de 6 dígitos (válido durante 15 minutos).</p>
      </div>
      <div class="acciones-form">
        <RouterLink class="boton boton-gris" to="/acceder">Volver a acceder</RouterLink>
        <button type="submit" class="boton boton-verde" :disabled="enviando">
          {{ enviando ? 'Enviando…' : 'Enviar código' }}
        </button>
      </div>
    </form>

    <!-- Paso 2 · código y clave nueva -->
    <form v-else class="formulario" @submit.prevent="restablecer">
      <div class="grupo-campos">
        <p class="grupo-titulo">Paso 2 · Código y contraseña nueva</p>
        <div v-if="codigoDemo" class="aviso aviso-info">
          <p>Demo: tu código es <strong>{{ codigoDemo }}</strong>. En producción lo recibirías por correo.</p>
        </div>
        <label class="campo">
          <span class="campo-etiqueta">Código de 6 dígitos *</span>
          <input
            v-model="f.codigo"
            class="control"
            inputmode="numeric"
            maxlength="6"
            required
            @input="f.codigo = f.codigo.replace(/\D/g, '')"
          >
        </label>
        <div class="campo-fila">
          <label class="campo">
            <span class="campo-etiqueta">Nueva contraseña * (mínimo 8)</span>
            <input v-model="f.clave" class="control" type="password" minlength="8" required>
          </label>
          <label class="campo">
            <span class="campo-etiqueta">Confirmar contraseña *</span>
            <input v-model="f.confirmar" class="control" type="password" minlength="8" required>
          </label>
        </div>
        <p class="campo-ayuda">
          Código enviado a <strong>{{ correo }}</strong>.
          <button type="button" class="boton boton-texto" @click="cambiarCorreo">Usar otro correo</button>
        </p>
      </div>
      <div class="acciones-form">
        <RouterLink class="boton boton-gris" to="/acceder">Volver a acceder</RouterLink>
        <button type="submit" class="boton boton-verde" :disabled="enviando">
          {{ enviando ? 'Guardando…' : 'Restablecer contraseña' }}
        </button>
      </div>
    </form>
  </section>
</template>
