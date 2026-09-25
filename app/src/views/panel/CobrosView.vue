<script setup>
/**
 * Cobros y cuenta (panel del organizador).
 *
 * ÚNICA vista que edita los datos de cobro de Mercado Pago y los fiscales
 * (la organización se edita en "Mi cuenta"). Valida con las mismas reglas
 * que el registro (utils/validacionesFiscales): no hay dos criterios.
 * En producción la verificación de identidad vive en Mercado Pago.
 */
import { computed, onMounted, reactive, ref } from 'vue';
import { OrganizadorRepository } from '@/repositories/organizadorRepository.js';
import { CuentasRepository } from '@/core/cuentasRepository.js';
import { REGIMENES } from '@/data/catalogoFiscal.js';
import { useSesion } from '@/composables/useSesion.js';
import { notificar } from '@/composables/useAviso.js';

const { estado, refrescarSesion } = useSesion();

const perfil = ref(null);
const cargando = ref(true);
const guardando = ref(false);
const clabeVisible = ref(false);

/** Datos editables de cobro (una sola copia en pantalla: nada en modo lectura). */
const cobro = reactive({
  mpEmail: '', tipoPersona: 'fisica', rfc: '', razonSocial: '',
  regimen: '601', cpFiscal: '', clabe: ''
});

const conectado = computed(() => perfil.value?.mpEstado === 'conectado');

/** Vuelca el perfil del organizador en el formulario. */
function cargar() {
  const p = perfil.value || {};
  cobro.mpEmail = p.mpEmail || p.email || '';
  cobro.tipoPersona = p.tipoPersona || 'fisica';
  cobro.rfc = p.rfc || '';
  cobro.razonSocial = p.razonSocial || '';
  cobro.regimen = p.regimen || '601';
  cobro.cpFiscal = p.cpFiscal || '';
  cobro.clabe = p.clabe || '';
}

async function recargar() {
  perfil.value = await OrganizadorRepository.getPerfil();
  cargar();
}

onMounted(async () => {
  try {
    await recargar();
  } finally {
    cargando.value = false;
  }
});

/** Guarda los datos de cobro (validación fiscal compartida con el registro). */
async function guardarCobro() {
  guardando.value = true;
  const r = await CuentasRepository.actualizarCobro(estado.cuenta?.id, { ...cobro });
  guardando.value = false;
  if (!r.ok) { notificar(r.motivo); return; }
  await refrescarSesion();
  await recargar();
  notificar('Datos de cobro guardados.');
}

/** Conecta (o reconecta) la cuenta de Mercado Pago (demo del OAuth). */
async function conectar() {
  guardando.value = true;
  const r = await CuentasRepository.conectarMercadoPago(estado.cuenta?.id);
  guardando.value = false;
  if (!r.ok) { notificar(r.motivo); return; }
  await refrescarSesion();
  await recargar();
  notificar('Cuenta de Mercado Pago conectada.');
}
</script>

<template>
  <section class="cobros">
    <header class="cobros-header">
      <h1>Cobros y cuenta</h1>
      <p class="cobros-sub">
        Datos de tu cuenta de cobro con Mercado Pago.
        La organización se edita en <RouterLink to="/mi-cuenta">Mi cuenta</RouterLink>.
      </p>
    </header>

    <p v-if="cargando" class="cobros-cargando">Cargando…</p>

    <template v-else-if="perfil">
      <!-- Estado de la conexión con Mercado Pago -->
      <div class="mp-estado" :class="conectado ? 'conectado' : 'pendiente'">
        <span class="mp-estado-punto" aria-hidden="true"></span>
        <div class="mp-estado-texto">
          <strong>Mercado Pago · {{ conectado ? 'Conectado' : 'Sin conectar' }}</strong>
          <p>Cuenta <span class="mono">{{ mpEmail }}</span></p>
        </div>
      </div>

      <form class="formulario" @submit.prevent="guardarCobro">
        <section class="panel-seccion">
          <h2>Cuenta de cobro</h2>
          <div class="ficha">
            <div class="ficha-fila">
              <span class="ficha-etiqueta">Estado</span>
              <span class="ficha-valor">
                <span class="etiqueta-estado" :class="conectado ? 'ok' : 'pend'">
                  {{ conectado ? 'Conectado' : 'Pendiente' }}
                </span>
                <button
                  v-if="!conectado"
                  type="button"
                  class="enlace-accion"
                  :disabled="guardando"
                  @click="conectar"
                >Conectar cuenta</button>
              </span>
            </div>
            <div class="ficha-campo">
              <span class="ficha-etiqueta">Correo de Mercado Pago *</span>
              <input v-model="cobro.mpEmail" class="control" type="email" required>
            </div>
          </div>
        </section>

        <section class="panel-seccion">
          <h2>Datos fiscales</h2>
          <div class="ficha">
            <div class="ficha-campo">
              <span class="ficha-etiqueta">Tipo de persona *</span>
              <select v-model="cobro.tipoPersona" class="control">
                <option value="fisica">Persona física · RFC de 13 caracteres</option>
                <option value="moral">Persona moral · RFC de 12 caracteres</option>
              </select>
            </div>
            <div class="ficha-campo">
              <span class="ficha-etiqueta">RFC *</span>
              <input
                v-model="cobro.rfc"
                class="control"
                maxlength="13"
                :placeholder="cobro.tipoPersona === 'moral' ? 'ABC123456789' : 'XXXX000101001'"
                @input="cobro.rfc = cobro.rfc.toUpperCase()"
              >
            </div>
            <div v-if="cobro.tipoPersona === 'moral'" class="ficha-campo">
              <span class="ficha-etiqueta">Razón social *</span>
              <input v-model="cobro.razonSocial" class="control">
            </div>
            <div class="ficha-campo">
              <span class="ficha-etiqueta">Régimen fiscal *</span>
              <select v-model="cobro.regimen" class="control">
                <option v-for="r in REGIMENES" :key="r.codigo" :value="r.codigo">{{ r.texto }}</option>
              </select>
            </div>
            <div class="ficha-campo">
              <span class="ficha-etiqueta">Código postal fiscal * (5 dígitos)</span>
              <input
                :value="cobro.cpFiscal"
                class="control"
                inputmode="numeric"
                maxlength="5"
                placeholder="91000"
                @input="cobro.cpFiscal = cobro.cpFiscal.replace(/\D/g, '')"
              >
            </div>
            <div class="ficha-campo">
              <span class="ficha-etiqueta">CLABE interbancaria * (18 dígitos)</span>
              <input
                :value="cobro.clabe"
                :type="clabeVisible ? 'text' : 'password'"
                class="control mono"
                inputmode="numeric"
                maxlength="18"
                placeholder="012345678901234567"
                @input="cobro.clabe = cobro.clabe.replace(/\D/g, '')"
              >
              <button type="button" class="enlace-accion" @click="clabeVisible = !clabeVisible">
                {{ clabeVisible ? 'Ocultar' : 'Mostrar' }}
              </button>
            </div>
          </div>
        </section>

        <div class="acciones-form">
          <button type="submit" class="boton boton-verde" :disabled="guardando">
            {{ guardando ? 'Guardando…' : 'Guardar datos de cobro' }}
          </button>
        </div>
      </form>

      <p class="nota-mp">
        La verificación de identidad (INE y comprobante de domicilio) se
        completa dentro de Mercado Pago. Estos son datos de demostración.
      </p>
    </template>

    <p v-else class="cobros-cargando">No hay datos de organizador en esta sesión.</p>
  </section>
</template>

<style scoped>
/* Tokens del tema (tema.css), misma estética que el resto del panel. */
.cobros-header h1 { margin: 0 0 0.25rem; font-size: 1.5rem; }
.cobros-sub { margin: 0 0 1.5rem; color: var(--texto-suave); }
.cobros-cargando { color: var(--texto-suave); }

.mp-estado {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 1rem; margin-bottom: 2rem;
  border: 1px solid var(--borde); border-left: 4px solid var(--verde);
  border-radius: var(--radio); background: var(--superficie);
}
.mp-estado.pendiente { border-left-color: var(--dorado); }
.mp-estado-punto { width: 10px; height: 10px; border-radius: 50%; background: var(--verde); flex-shrink: 0; }
.mp-estado.pendiente .mp-estado-punto { background: var(--dorado); }
.mp-estado-texto strong { font-size: 0.95rem; }
.mp-estado-texto p { margin: 0.25rem 0 0; font-size: 0.85rem; color: var(--texto-suave); }

.panel-seccion { margin-bottom: 2rem; }
.panel-seccion h2 {
  margin: 0 0 0.75rem; font-size: 1.1rem; color: var(--texto-suave);
  text-transform: uppercase; letter-spacing: 0.05em;
}

.ficha {
  border: 1px solid var(--borde); border-radius: var(--radio);
  background: var(--superficie); overflow: hidden;
}
.ficha-fila {
  display: flex; justify-content: space-between; gap: 1rem;
  padding: 0.75rem 1rem; border-bottom: 1px solid var(--borde);
  font-size: 0.9rem;
}
.ficha-fila:last-child { border-bottom: 0; }
.ficha-etiqueta { color: var(--texto-suave); flex-shrink: 0; }
.ficha-valor { text-align: right; word-break: break-word; }
.mono { font-family: ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace; }

/* Campo editable dentro de una ficha: etiqueta encima, control debajo. */
.ficha-campo {
  display: grid;
  gap: 0.3rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--borde);
}
.ficha-campo:last-child { border-bottom: 0; }
.ficha-campo .enlace-accion { margin-left: 0; justify-self: start; }

.enlace-accion {
  margin-left: 0.5rem; padding: 0; border: 0; background: none;
  color: var(--azul); font-size: 0.85rem; cursor: pointer;
}
.enlace-accion:hover { text-decoration: underline; }

.etiqueta-estado {
  display: inline-block; padding: 0.15rem 0.6rem; border-radius: 999px;
  font-size: 0.75rem; font-weight: 600;
}
.etiqueta-estado.ok { background: var(--verde-suave); color: var(--verde-oscuro); }
.etiqueta-estado.pend { background: var(--dorado-suave); color: #9a7420; }

.nota-mp {
  margin: 0; font-size: 0.8rem; color: var(--texto-tenue);
  border-top: 1px dashed var(--borde-fuerte); padding-top: 1rem;
}
</style>

