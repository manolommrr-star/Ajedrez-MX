<script setup>
/**
 * "Mi cuenta": identidad, perfil propio (jugador u organizador) y
 * cambio de contraseña.
 *
 * Es la ÚNICA vista de edición de la cuenta (sin duplicados): la ficha
 * "Organización" vive aquí (se movió desde CobrosView, que ahora solo
 * muestra cobro y datos fiscales).
 */
import { computed, onMounted, reactive, ref } from 'vue';
import { CuentasRepository } from '@/core/cuentasRepository.js';
import { useSesion } from '@/composables/useSesion.js';
import { notificar } from '@/composables/useAviso.js';
import { esCorreo, claveAceptable } from '@/utils/validacionesCuenta.js';
import { GIROS, ESTADOS_MX } from '@/data/catalogosCuenta.js';
import { Formatters } from '@/utils/formatters.js';

const { estado, asegurarSesion, refrescarSesion } = useSesion();

const esOrganizador = computed(() => estado.cuenta?.rol === 'organizer');
const rolTexto = computed(() => (esOrganizador.value ? 'Organizador' : 'Jugador'));
const correoVerificado = computed(() => Boolean(estado.cuenta?.correoVerificado));
const ultimoAcceso = computed(() => Formatters.fechaHora(estado.cuenta?.ultimoAcceso));

const cuentaF = reactive({ nombre: '', apellidos: '', email: '' });
const jugadorF = reactive({
  fechaNacimiento: '', fideId: '', federacion: '', club: '', elo: '',
  titulo: '', sexo: '', telefono: '', ciudad: '', estado: ''
});
const orgF = reactive({
  organizacion: '', giro: GIROS[0], telefono: '', ciudad: '', estado: '', web: ''
});
const claveF = reactive({ actual: '', nueva: '', confirmar: '' });

const guardando = ref('');

/** Carga los datos de la sesión activa a los formularios. */
function cargar() {
  const cuenta = estado.cuenta;
  if (!cuenta) return;
  cuentaF.nombre = cuenta.nombre || '';
  cuentaF.apellidos = cuenta.apellidos || '';
  cuentaF.email = cuenta.email || '';

  const jugador = estado.jugador;
  if (jugador) {
    for (const campo of Object.keys(jugadorF)) {
      jugadorF[campo] = jugador[campo] ?? '';
    }
  }

  const org = estado.organizador;
  if (org) {
    orgF.organizacion = org.organizacion || org.nombre || '';
    orgF.giro = org.giro || GIROS[0];
    orgF.telefono = org.telefono || '';
    orgF.ciudad = org.ciudad || '';
    orgF.estado = org.estado || '';
    orgF.web = org.web || '';
  }
}

onMounted(async () => {
  await asegurarSesion();
  cargar();
});

/** Confirma el correo (demo: sustituye al enlace de confirmación por correo). */
async function verificarCorreo() {
  guardando.value = 'verificar';
  const r = await CuentasRepository.verificarCorreo(estado.cuenta.id);
  guardando.value = '';
  if (!r.ok) { notificar(r.motivo); return; }
  await refrescarSesion();
  notificar('Correo verificado.');
}

/** Identidad de la cuenta (el repositorio la espeja al perfil del rol). */
async function guardarCuenta() {
  if (!String(cuentaF.nombre).trim()) { notificar('Escribe tu nombre.'); return; }
  if (!esCorreo(cuentaF.email)) { notificar('Escribe un correo válido.'); return; }
  guardando.value = 'cuenta';
  const r = await CuentasRepository.actualizar(estado.cuenta.id, {
    nombre: cuentaF.nombre,
    apellidos: cuentaF.apellidos,
    email: cuentaF.email
  });
  guardando.value = '';
  if (!r.ok) { notificar(r.motivo); return; }
  await refrescarSesion();
  cargar();
  notificar('Datos de cuenta guardados.');
}

/** Perfil de jugador (no incluye nombre/apellidos/email: van en Cuenta). */
async function guardarPerfil() {
  const telefono = String(jugadorF.telefono || '').trim();
  if (telefono && !/^\d{10}$/.test(telefono)) { notificar('El celular debe tener 10 dígitos.'); return; }
  const elo = String(jugadorF.elo ?? '').trim();
  if (elo !== '' && (!Number.isFinite(Number(elo)) || Number(elo) < 0 || Number(elo) > 3000)) {
    notificar('El Elo debe estar entre 0 y 3000.');
    return;
  }
  guardando.value = 'jugador';
  const r = await CuentasRepository.actualizar(estado.cuenta.id, {
    datosJugador: { ...jugadorF }
  });
  guardando.value = '';
  if (!r.ok) { notificar(r.motivo); return; }
  await refrescarSesion();
  cargar();
  notificar('Perfil de jugador guardado.');
}

/** Organización del organizador (antes en CobrosView). */
async function guardarOrganizacion() {
  if (!String(orgF.organizacion).trim()) { notificar('Escribe el nombre de la organización.'); return; }
  if (!/^\d{10}$/.test(String(orgF.telefono || ''))) { notificar('El celular debe tener 10 dígitos.'); return; }
  guardando.value = 'organizacion';
  const r = await CuentasRepository.actualizar(estado.cuenta.id, {
    organizacion: orgF.organizacion.trim(),
    datosOrganizador: { ...orgF }
  });
  guardando.value = '';
  if (!r.ok) { notificar(r.motivo); return; }
  await refrescarSesion();
  cargar();
  notificar('Organización guardada.');
}

/** Cambio de contraseña (valida la actual; solo se guarda el hash). */
async function guardarClave() {
  if (claveF.nueva !== claveF.confirmar) { notificar('Las contraseñas no coinciden.'); return; }
  const motivo = claveAceptable(claveF.nueva);
  if (motivo) { notificar(motivo); return; }
  guardando.value = 'clave';
  const r = await CuentasRepository.cambiarClave({
    id: estado.cuenta.id,
    claveActual: claveF.actual,
    claveNueva: claveF.nueva
  });
  guardando.value = '';
  if (!r.ok) { notificar(r.motivo); return; }
  claveF.actual = '';
  claveF.nueva = '';
  claveF.confirmar = '';
  notificar('Contraseña actualizada.');
}
</script>

<template>
  <section class="contenedor">
    <h1 class="titulo-pagina">Mi cuenta</h1>
    <p class="subtitulo-pagina">Tu identidad, tu perfil y tu contraseña en un solo lugar.</p>

    <div v-if="!estado.cuenta" class="aviso aviso-info">
      <p>No hay una sesión abierta. <RouterLink to="/acceder">Accede</RouterLink> para ver tu cuenta.</p>
    </div>

    <template v-else>
      <!-- Identidad de la cuenta -->
      <form class="formulario" @submit.prevent="guardarCuenta">
        <div class="grupo-campos">
          <p class="grupo-titulo">Cuenta · {{ rolTexto }}</p>
          <div class="campo-fila">
            <label class="campo">
              <span class="campo-etiqueta">Nombre *</span>
              <input v-model="cuentaF.nombre" class="control" required>
            </label>
            <label class="campo">
              <span class="campo-etiqueta">Apellidos</span>
              <input v-model="cuentaF.apellidos" class="control">
            </label>
          </div>
          <label class="campo">
            <span class="campo-etiqueta">Correo *</span>
            <input v-model="cuentaF.email" class="control" type="email" required>
          </label>
          <p v-if="esOrganizador" class="campo-ayuda">
            Los datos de cobro y fiscales se ven en
            <RouterLink to="/panel/cobros">Cobros y cuenta</RouterLink>.
          </p>

          <div v-if="!correoVerificado" class="aviso aviso-dorado">
            <p>
              Tu correo aún no está verificado.
              <button
                type="button"
                class="boton boton-texto"
                :disabled="guardando === 'verificar'"
                @click="verificarCorreo"
              >Verificar ahora (demo)</button>
            </p>
          </div>
          <p v-else class="campo-ayuda">Correo verificado.</p>
          <p class="campo-ayuda">
            Último acceso: {{ ultimoAcceso || 'este es tu primer acceso' }}.
          </p>
        </div>
        <div class="acciones-form">
          <button type="submit" class="boton boton-verde" :disabled="guardando === 'cuenta'">
            {{ guardando === 'cuenta' ? 'Guardando…' : 'Guardar datos de cuenta' }}
          </button>
        </div>
      </form>

      <!-- Perfil de jugador -->
      <form v-if="!esOrganizador" class="formulario ficha-perfil" @submit.prevent="guardarPerfil">
        <div class="grupo-campos">
          <p class="grupo-titulo">Perfil de jugador</p>
          <div class="campo-fila">
            <label class="campo">
              <span class="campo-etiqueta">FIDE ID</span>
              <input v-model="jugadorF.fideId" class="control">
            </label>
            <label class="campo">
              <span class="campo-etiqueta">Elo</span>
              <input v-model="jugadorF.elo" class="control" type="number" min="0" max="3000">
            </label>
          </div>
          <div class="campo-fila">
            <label class="campo">
              <span class="campo-etiqueta">Título</span>
              <input v-model="jugadorF.titulo" class="control" placeholder="GM, WIM, FM…">
            </label>
            <label class="campo">
              <span class="campo-etiqueta">Federación</span>
              <input v-model="jugadorF.federacion" class="control">
            </label>
          </div>
          <div class="campo-fila">
            <label class="campo">
              <span class="campo-etiqueta">Club</span>
              <input v-model="jugadorF.club" class="control">
            </label>
            <label class="campo">
              <span class="campo-etiqueta">Sexo</span>
              <select v-model="jugadorF.sexo" class="control">
                <option value="">Sin especificar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </label>
          </div>
          <div class="campo-fila">
            <label class="campo">
              <span class="campo-etiqueta">Fecha de nacimiento</span>
              <input v-model="jugadorF.fechaNacimiento" class="control" type="date">
            </label>
            <label class="campo">
              <span class="campo-etiqueta">Celular</span>
              <input
                v-model="jugadorF.telefono"
                class="control"
                inputmode="numeric"
                maxlength="10"
                placeholder="5512345678"
                @input="jugadorF.telefono = jugadorF.telefono.replace(/\D/g, '')"
              >
            </label>
          </div>
          <div class="campo-fila">
            <label class="campo">
              <span class="campo-etiqueta">Ciudad</span>
              <input v-model="jugadorF.ciudad" class="control">
            </label>
            <label class="campo">
              <span class="campo-etiqueta">Estado</span>
              <select v-model="jugadorF.estado" class="control">
                <option value="">Sin especificar</option>
                <option v-for="e in ESTADOS_MX" :key="e" :value="e">{{ e }}</option>
              </select>
            </label>
          </div>
        </div>
        <div class="acciones-form">
          <button type="submit" class="boton boton-verde" :disabled="guardando === 'jugador'">
            {{ guardando === 'jugador' ? 'Guardando…' : 'Guardar perfil' }}
          </button>
        </div>
      </form>

      <!-- Organización (movida desde CobrosView: allí solo quedan cobro y fiscales) -->
      <form v-else class="formulario ficha-perfil" @submit.prevent="guardarOrganizacion">
        <div class="grupo-campos">
          <p class="grupo-titulo">Organización</p>
          <label class="campo">
            <span class="campo-etiqueta">Nombre de la organización o club *</span>
            <input v-model="orgF.organizacion" class="control" placeholder="Ej. Club de Ajedrez Xalapa">
          </label>
          <div class="campo-fila">
            <label class="campo">
              <span class="campo-etiqueta">Giro *</span>
              <select v-model="orgF.giro" class="control">
                <option v-for="g in GIROS" :key="g" :value="g">{{ g }}</option>
              </select>
            </label>
            <label class="campo">
              <span class="campo-etiqueta">Celular *</span>
              <input
                v-model="orgF.telefono"
                class="control"
                inputmode="numeric"
                maxlength="10"
                placeholder="5512345678"
                @input="orgF.telefono = orgF.telefono.replace(/\D/g, '')"
              >
            </label>
          </div>
          <div class="campo-fila">
            <label class="campo">
              <span class="campo-etiqueta">Ciudad</span>
              <input v-model="orgF.ciudad" class="control">
            </label>
            <label class="campo">
              <span class="campo-etiqueta">Estado</span>
              <select v-model="orgF.estado" class="control">
                <option value="">Sin especificar</option>
                <option v-for="e in ESTADOS_MX" :key="e" :value="e">{{ e }}</option>
              </select>
            </label>
          </div>
          <label class="campo">
            <span class="campo-etiqueta">Sitio web o redes sociales</span>
            <input v-model="orgF.web" class="control" type="url" placeholder="https://…">
          </label>
        </div>
        <div class="acciones-form">
          <button type="submit" class="boton boton-verde" :disabled="guardando === 'organizacion'">
            {{ guardando === 'organizacion' ? 'Guardando…' : 'Guardar organización' }}
          </button>
        </div>
      </form>

      <!-- Contraseña -->
      <form class="formulario ficha-perfil" @submit.prevent="guardarClave">
        <div class="grupo-campos">
          <p class="grupo-titulo">Contraseña</p>
          <label class="campo">
            <span class="campo-etiqueta">Contraseña actual *</span>
            <input v-model="claveF.actual" class="control" type="password" required>
          </label>
          <div class="campo-fila">
            <label class="campo">
              <span class="campo-etiqueta">Nueva contraseña * (mínimo 8)</span>
              <input v-model="claveF.nueva" class="control" type="password" minlength="8" required>
            </label>
            <label class="campo">
              <span class="campo-etiqueta">Confirmar nueva contraseña *</span>
              <input v-model="claveF.confirmar" class="control" type="password" minlength="8" required>
            </label>
          </div>
          <p class="campo-ayuda">
            Si no recuerdas tu contraseña, usa
            <RouterLink to="/recuperar">Recuperar contraseña</RouterLink>.
          </p>
        </div>
        <div class="acciones-form">
          <button type="submit" class="boton boton-verde" :disabled="guardando === 'clave'">
            {{ guardando === 'clave' ? 'Guardando…' : 'Cambiar contraseña' }}
          </button>
        </div>
      </form>
    </template>
  </section>
</template>

<style scoped>
/* Las clases de formulario son globales (tema/layout): aquí solo se separan fichas. */
.ficha-perfil + .ficha-perfil { margin-top: 1.25rem; }
</style>
