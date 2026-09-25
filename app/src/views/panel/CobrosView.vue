<script setup>
/**
 * Cobros y cuenta (panel del organizador).
 *
 * Muestra los datos de cobro de Mercado Pago que se capturan en el registro
 * en 3 pasos: estado de conexión, correo de la cuenta MP, CLABE (enmascarada
 * por defecto), organización y datos fiscales (RFC, razón social, régimen,
 * CP). En producción la verificación de identidad vive en Mercado Pago.
 */
import { computed, onMounted, ref } from 'vue';
import { OrganizadorRepository } from '@/repositories/organizadorRepository.js';
import { regimenTexto } from '@/data/catalogoFiscal.js';
import { notificar } from '@/composables/useAviso.js';

const perfil = ref(null);
const cargando = ref(true);
const clabeVisible = ref(false);

onMounted(async () => {
  try {
    perfil.value = await OrganizadorRepository.getPerfil();
  } finally {
    cargando.value = false;
  }
});

const conectado = computed(() => perfil.value?.mpEstado === 'conectado');
const mpEmail = computed(() => perfil.value?.mpEmail || perfil.value?.email || '');
const regimen = computed(() => (perfil.value?.regimen ? regimenTexto(perfil.value.regimen) : ''));
const tipoPersona = computed(() =>
  perfil.value?.tipoPersona === 'moral' ? 'Persona moral' : 'Persona física');

/** CLABE visible u oculta: '0121••••••••6782' por defecto. */
const clabe = computed(() => {
  const v = String(perfil.value?.clabe || '').trim();
  if (!v) return '';
  return clabeVisible.value ? v : `${v.slice(0, 4)}••••••••${v.slice(-4)}`;
});

function alternarClabe() {
  clabeVisible.value = !clabeVisible.value;
}

function copiarClabe() {
  const v = String(perfil.value?.clabe || '').trim();
  if (!v) return;
  navigator.clipboard?.writeText(v)
    .then(() => notificar('CLABE copiada al portapapeles.'))
    .catch(() => notificar('No fue posible copiar la CLABE.'));
}
</script>

<template>
  <section class="cobros">
    <header class="cobros-header">
      <h1>Cobros y cuenta</h1>
      <p class="cobros-sub">Datos de tu cuenta de cobro con Mercado Pago.</p>
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

      <section class="panel-seccion">
        <h2>Cuenta de cobro</h2>
        <div class="ficha">
          <div class="ficha-fila">
            <span class="ficha-etiqueta">Correo de Mercado Pago</span>
            <span class="ficha-valor mono">{{ mpEmail }}</span>
          </div>
          <div class="ficha-fila">
            <span class="ficha-etiqueta">CLABE interbancaria</span>
            <span class="ficha-valor">
              <span class="mono">{{ clabe || '—' }}</span>
              <button type="button" class="enlace-accion" @click="alternarClabe">
                {{ clabeVisible ? 'Ocultar' : 'Mostrar' }}
              </button>
              <button v-if="perfil.clabe" type="button" class="enlace-accion" @click="copiarClabe">
                Copiar
              </button>
            </span>
          </div>
          <div class="ficha-fila">
            <span class="ficha-etiqueta">Estado</span>
            <span class="ficha-valor">
              <span class="etiqueta-estado" :class="conectado ? 'ok' : 'pend'">
                {{ conectado ? 'Conectado' : 'Pendiente' }}
              </span>
            </span>
          </div>
        </div>
      </section>

      <section class="panel-seccion">
        <h2>Organización</h2>
        <div class="ficha">
          <div class="ficha-fila">
            <span class="ficha-etiqueta">Organización</span>
            <span class="ficha-valor">{{ perfil.organizacion || perfil.nombre }}</span>
          </div>
          <div class="ficha-fila">
            <span class="ficha-etiqueta">Giro</span>
            <span class="ficha-valor">{{ perfil.giro || '—' }}</span>
          </div>
          <div class="ficha-fila">
            <span class="ficha-etiqueta">Celular</span>
            <span class="ficha-valor mono">{{ perfil.telefono || '—' }}</span>
          </div>
          <div class="ficha-fila">
            <span class="ficha-etiqueta">Ubicación</span>
            <span class="ficha-valor">
              {{ perfil.ciudad || '—' }}<template v-if="perfil.estado">, {{ perfil.estado }}</template>
            </span>
          </div>
          <div class="ficha-fila" v-if="perfil.web">
            <span class="ficha-etiqueta">Sitio web</span>
            <span class="ficha-valor">
              <a :href="perfil.web" target="_blank" rel="noopener">{{ perfil.web }}</a>
            </span>
          </div>
        </div>
      </section>

      <section class="panel-seccion">
        <h2>Datos fiscales</h2>
        <div class="ficha">
          <div class="ficha-fila">
            <span class="ficha-etiqueta">Tipo de persona</span>
            <span class="ficha-valor">{{ tipoPersona }}</span>
          </div>
          <div class="ficha-fila">
            <span class="ficha-etiqueta">RFC</span>
            <span class="ficha-valor mono">{{ perfil.rfc || '—' }}</span>
          </div>
          <div class="ficha-fila" v-if="perfil.tipoPersona === 'moral'">
            <span class="ficha-etiqueta">Razón social</span>
            <span class="ficha-valor">{{ perfil.razonSocial || '—' }}</span>
          </div>
          <div class="ficha-fila">
            <span class="ficha-etiqueta">Régimen fiscal</span>
            <span class="ficha-valor">{{ regimen || '—' }}</span>
          </div>
          <div class="ficha-fila">
            <span class="ficha-etiqueta">CP fiscal</span>
            <span class="ficha-valor mono">{{ perfil.cpFiscal || '—' }}</span>
          </div>
        </div>
      </section>

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

