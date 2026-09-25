<script setup>
/**
 * Registro de cuentas con elección de rol (jugador u organizador).
 *
 * El organizador recorre un asistente de 3 pasos basado en lo que Mercado
 * Pago (México) exige para recibir pagos: 1) cuenta de acceso, 2) organización
 * y 3) datos de cobro (RFC, CLABE, régimen fiscal). La verificación de
 * identidad (INE + comprobante de domicilio) no se pide aquí: se completa
 * dentro de Mercado Pago.
 *
 * Crea la cuenta demo (mock de auth.users + profiles) e inicia sesión.
 */
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { CuentasRepository } from '@/core/cuentasRepository.js';
import { useSesion } from '@/composables/useSesion.js';
import { notificar } from '@/composables/useAviso.js';
import { REGIMENES } from '@/data/catalogoFiscal.js';

const router = useRouter();
const { iniciarSesion } = useSesion();

const GIROS = [
  'Club o academia',
  'Federación/Asociación',
  'Escuela',
  'Empresa',
  'Organizador particular'
];

const ESTADOS_MX = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
  'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán',
  'Zacatecas'
];

const datos = reactive({
  rol: 'player', nombre: '', apellidos: '', email: '', clave: '', confirmar: '',
  fideId: '', elo: '', club: '', federacion: '', ciudad: '', estado: '',
  // Asistente de organizador
  organizacion: '', giro: GIROS[0], telefono: '', web: '',
  mpEmail: '', tipoPersona: 'fisica', rfc: '', razonSocial: '',
  regimen: '612', cpFiscal: '', clabe: '', aceptaTerminos: false
});

const esOrganizador = computed(() => datos.rol === 'organizer');
const PASOS = [
  { n: 1, texto: 'Cuenta' },
  { n: 2, texto: 'Organización' },
  { n: 3, texto: 'Cobro (Mercado Pago)' }
];
const paso = ref(1);

watch(esOrganizador, (ahora) => { if (!ahora) paso.value = 1; });

const enviando = ref(false);

/** Correo con forma válida. */
function esCorreo(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || '').trim());
}

/** CLABE de 18 dígitos con dígito verificador correcto (módulo 10, pesos 3-7-1). */
function clabeValida(clabe) {
  const valor = String(clabe || '').trim();
  if (!/^\d{18}$/.test(valor)) return false;
  const pesos = [3, 7, 1];
  let suma = 0;
  for (let i = 0; i < 17; i += 1) suma += (Number(valor[i]) * pesos[i % 3]) % 10;
  return (10 - (suma % 10)) % 10 === Number(valor[17]);
}

/** RFC mexicano: 13 caracteres (persona física) o 12 (persona moral). */
function rfcValido(rfc, tipo) {
  const valor = String(rfc || '').trim().toUpperCase();
  const patron = tipo === 'moral'
    ? /^[A-ZÑ&]{3}\d{6}[A-Z\d]{3}$/
    : /^[A-ZÑ&]{4}\d{6}[A-Z\d]{3}$/;
  return patron.test(valor);
}

/** Paso 1 · Cuenta: acceso básico compartido con jugador. Devuelve motivo o ''. */
function validarCuenta() {
  if (!String(datos.nombre).trim()) return 'Escribe tu nombre.';
  if (!esCorreo(datos.email)) return 'Escribe un correo válido.';
  if (String(datos.clave).length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (datos.clave !== datos.confirmar) return 'Las contraseñas no coinciden.';
  if (esOrganizador.value && !datos.aceptaTerminos) {
    return 'Debes aceptar los términos y el aviso de privacidad.';
  }
  return '';
}

/** Paso 2 · Organización. Devuelve motivo o ''. */
function validarOrganizacion() {
  if (!datos.organizacion.trim()) return 'Escribe el nombre de la organización.';
  if (!/^\d{10}$/.test(datos.telefono.trim())) return 'El celular debe tener 10 dígitos.';
  return '';
}

/** Paso 3 · Cobro Mercado Pago. Devuelve motivo o ''. */
function validarCobro() {
  const mpEmail = datos.mpEmail.trim() || datos.email.trim();
  if (!esCorreo(mpEmail)) return 'Escribe un correo válido para tu cuenta de Mercado Pago.';
  if (!rfcValido(datos.rfc, datos.tipoPersona)) {
    return datos.tipoPersona === 'moral'
      ? 'El RFC de persona moral debe tener 12 caracteres (ej. ABC123456789).'
      : 'El RFC de persona física debe tener 13 caracteres (ej. XXXX000101001).';
  }
  if (datos.tipoPersona === 'moral' && !datos.razonSocial.trim()) {
    return 'Escribe la razón social.';
  }
  if (!/^\d{5}$/.test(datos.cpFiscal.trim())) {
    return 'El código postal fiscal debe tener 5 dígitos.';
  }
  if (!clabeValida(datos.clabe)) {
    return 'La CLABE debe tener 18 dígitos y su dígito verificador no coincide.';
  }
  return '';
}

function siguiente() {
  const motivo = paso.value === 1 ? validarCuenta() : validarOrganizacion();
  if (motivo) {
    notificar(motivo);
    return;
  }
  if (paso.value === 2 && !datos.mpEmail) datos.mpEmail = datos.email;
  paso.value = Math.min(3, paso.value + 1);
}

async function enviar() {
  const extras = esOrganizador.value
    ? {
        organizacion: datos.organizacion.trim(),
        giro: datos.giro,
        telefono: datos.telefono.trim(),
        ciudad: datos.ciudad.trim(),
        estado: datos.estado,
        web: datos.web.trim(),
        mpEmail: datos.mpEmail.trim() || datos.email.trim(),
        tipoPersona: datos.tipoPersona,
        rfc: datos.rfc.trim().toUpperCase(),
        razonSocial: datos.razonSocial.trim(),
        regimen: datos.regimen,
        cpFiscal: datos.cpFiscal.trim(),
        clabe: datos.clabe.trim(),
        // Demo: "conectar Mercado Pago" simula el OAuth Authorization Code;
        // en producción el access_token lo devuelve el backend.
        mpEstado: 'conectado'
      }
    : {
        fideId: datos.fideId, elo: datos.elo, club: datos.club,
        federacion: datos.federacion, ciudad: datos.ciudad, estado: datos.estado
      };

  if (esOrganizador.value) {
    const errores = [
      { enPaso: 1, motivo: validarCuenta() },
      { enPaso: 2, motivo: validarOrganizacion() },
      { enPaso: 3, motivo: validarCobro() }
    ].filter((e) => e.motivo);
    if (errores.length) {
      paso.value = errores[0].enPaso;
      notificar(errores[0].motivo);
      return;
    }
  } else {
    const motivo = validarCuenta();
    if (motivo) {
      notificar(motivo);
      return;
    }
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
    if (esOrganizador.value && /correo/i.test(resultado.motivo)) paso.value = 1;
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

      <!-- Indicador de pasos (solo organizador) -->
      <ol v-if="esOrganizador" class="pasos-registro" aria-label="Pasos del registro">
        <li
          v-for="p in PASOS"
          :key="p.n"
          :class="{ activo: paso === p.n, listo: p.n < paso }"
          :aria-current="paso === p.n ? 'step' : undefined"
        >
          <span class="paso-num">{{ p.n }}</span>
          <span class="paso-texto">{{ p.texto }}</span>
        </li>
      </ol>

      <div v-if="!esOrganizador || paso === 1" class="grupo-campos">
        <p class="grupo-titulo">{{ esOrganizador ? 'Paso 1 · Cuenta' : 'Acceso' }}</p>
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

        <label v-if="esOrganizador" class="opcion">
          <input v-model="datos.aceptaTerminos" type="checkbox">
          <span>
            <span class="opcion-desc">
              Acepto los términos del servicio y el aviso de privacidad; entiendo que
              mis datos fiscales (RFC, CLABE) se usan para generar cobros y comprobantes.
            </span>
          </span>
        </label>
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

      <!-- Paso 2 · Organización -->
      <div v-if="esOrganizador && paso === 2" class="grupo-campos">
        <p class="grupo-titulo">Paso 2 · Organización</p>
        <label class="campo">
          <span class="campo-etiqueta">Nombre de la organización o club *</span>
          <input v-model="datos.organizacion" class="control" placeholder="Ej. Club de Ajedrez Xalapa">
        </label>
        <div class="campo-fila">
          <label class="campo">
            <span class="campo-etiqueta">Giro *</span>
            <select v-model="datos.giro" class="control">
              <option v-for="g in GIROS" :key="g" :value="g">{{ g }}</option>
            </select>
          </label>
          <label class="campo">
            <span class="campo-etiqueta">Celular * (10 dígitos)</span>
            <input
              :value="datos.telefono"
              class="control"
              type="tel"
              inputmode="numeric"
              maxlength="10"
              placeholder="5512345678"
              @input="datos.telefono = $event.target.value.replace(/\D/g, '')"
            >
          </label>
        </div>
        <div class="campo-fila">
          <label class="campo">
            <span class="campo-etiqueta">Ciudad</span>
            <input v-model="datos.ciudad" class="control">
          </label>
          <label class="campo">
            <span class="campo-etiqueta">Estado</span>
            <select v-model="datos.estado" class="control">
              <option value="">Sin especificar</option>
              <option v-for="e in ESTADOS_MX" :key="e" :value="e">{{ e }}</option>
            </select>
          </label>
        </div>
        <label class="campo">
          <span class="campo-etiqueta">Sitio web o redes sociales</span>
          <input v-model="datos.web" class="control" type="url" placeholder="https://…">
        </label>
      </div>

      <!-- Paso 3 · Cobro (Mercado Pago) -->
      <div v-if="esOrganizador && paso === 3" class="grupo-campos">
        <p class="grupo-titulo">Paso 3 · Datos para recibir dinero (Mercado Pago)</p>
        <p class="nota-mp">
          Estos datos se usan para generar tus cobros y comprobantes fiscales.
          La verificación de identidad (INE + comprobante de domicilio) se completa
          dentro de Mercado Pago tras crear tu cuenta.
        </p>

        <label class="campo">
          <span class="campo-etiqueta">Correo de tu cuenta Mercado Pago *</span>
          <input v-model="datos.mpEmail" class="control" type="email" placeholder="El mismo que tu correo de registro">
        </label>

        <div class="campo">
          <span class="campo-etiqueta">Tipo de persona *</span>
          <div class="opciones-rol">
            <label class="opcion">
              <input v-model="datos.tipoPersona" type="radio" value="fisica" name="tipoPersona">
              <span>
                <span class="opcion-titulo">Persona física</span>
                <span class="opcion-desc">RFC de 13 caracteres</span>
              </span>
            </label>
            <label class="opcion">
              <input v-model="datos.tipoPersona" type="radio" value="moral" name="tipoPersona">
              <span>
                <span class="opcion-titulo">Persona moral</span>
                <span class="opcion-desc">RFC de 12 caracteres (empresa o asociación)</span>
              </span>
            </label>
          </div>
        </div>

        <div class="campo-fila">
          <label class="campo">
            <span class="campo-etiqueta">RFC *</span>
            <input
              :value="datos.rfc"
              class="control"
              maxlength="13"
              :placeholder="datos.tipoPersona === 'moral' ? 'ABC123456789' : 'XXXX000101001'"
              @input="datos.rfc = $event.target.value.toUpperCase()"
            >
          </label>
          <label v-if="datos.tipoPersona === 'moral'" class="campo">
            <span class="campo-etiqueta">Razón social *</span>
            <input v-model="datos.razonSocial" class="control">
          </label>
        </div>

        <div class="campo-fila">
          <label class="campo">
            <span class="campo-etiqueta">Régimen fiscal *</span>
            <select v-model="datos.regimen" class="control">
              <option v-for="r in REGIMENES" :key="r.codigo" :value="r.codigo">{{ r.texto }}</option>
            </select>
          </label>
          <label class="campo">
            <span class="campo-etiqueta">Código postal fiscal * (5 dígitos)</span>
            <input
              :value="datos.cpFiscal"
              class="control"
              inputmode="numeric"
              maxlength="5"
              placeholder="91000"
              @input="datos.cpFiscal = $event.target.value.replace(/\D/g, '')"
            >
          </label>
        </div>

        <label class="campo">
          <span class="campo-etiqueta">CLABE interbancaria * (18 dígitos)</span>
          <input
            :value="datos.clabe"
            class="control"
            inputmode="numeric"
            maxlength="18"
            placeholder="012345678901234567"
            @input="datos.clabe = $event.target.value.replace(/\D/g, '')"
          >
        </label>
      </div>

      <div class="acciones-form">
        <RouterLink v-if="!esOrganizador || paso === 1" class="boton boton-gris" to="/acceder">
          Ya tengo cuenta
        </RouterLink>

        <button
          v-if="esOrganizador && paso > 1"
          type="button"
          class="boton boton-gris"
          @click="paso -= 1"
        >
          Atrás
        </button>

        <button
          v-if="esOrganizador && paso < 3"
          type="button"
          class="boton boton-verde"
          @click="siguiente"
        >
          Continuar
        </button>

        <button
          v-if="!esOrganizador || paso === 3"
          type="submit"
          class="boton boton-verde"
          :disabled="enviando"
        >
          {{ enviando ? 'Creando…' : (esOrganizador ? 'Crear cuenta y conectar Mercado Pago' : 'Crear cuenta') }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
/* ---------- Asistente de registro de organizador ---------- */

.pasos-registro {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pasos-registro li {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.7rem;
  border: 1px solid var(--borde);
  border-radius: var(--radio-sm);
  background: var(--superficie-3);
  font-size: 0.8rem;
  color: var(--texto-suave);
}

.pasos-registro li.activo {
  border-color: var(--verde);
  background: var(--verde-suave);
  color: var(--texto);
  font-weight: 700;
}

.pasos-registro li.listo {
  border-color: var(--verde-suave);
  background: var(--verde-suave);
  color: var(--verde-oscuro);
}

.paso-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  background: var(--superficie);
  border: 1px solid var(--borde-fuerte);
  font-size: 0.72rem;
  font-weight: 700;
}

.activo .paso-num {
  background: var(--verde);
  border-color: var(--verde);
  color: #fff;
}

.nota-mp {
  margin: 0;
  padding: 0.65rem 0.8rem;
  border-left: 3px solid var(--info);
  border-radius: var(--radio-sm);
  background: var(--info-suave);
  font-size: 0.82rem;
  color: var(--texto-suave);
}

@media (max-width: 640px) {
  .paso-texto { display: none; }
  .pasos-registro li { padding: 0.35rem 0.55rem; }
}
</style>