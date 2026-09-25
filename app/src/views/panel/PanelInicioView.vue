<script setup>
/** Panel principal del organizador (dashboard). */
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { OrganizadorRepository } from '@/repositories/organizadorRepository.js';
import { RegistrationsRepository } from '@/core/registrationsRepository.js';
import { Formatters } from '@/utils/formatters.js';
import { notificar } from '@/composables/useAviso.js';

const router = useRouter();
const perfil = ref(null);
const torneos = ref([]);
const estadisticas = ref({});
const cargando = ref(true);

onMounted(async () => {
  try {
    perfil.value = await OrganizadorRepository.getPerfil();
    torneos.value = await OrganizadorRepository.getTorneos();
    // Se consultan en paralelo (antes era un await por torneo, N×RTT con backend).
    const pares = await Promise.all(
      torneos.value.map(async (t) => [t.id, await RegistrationsRepository.getPorTorneo(t.id)])
    );
    for (const [id, regs] of pares) {
      estadisticas.value[id] = {
        confirmados: regs.filter((r) => r.estado === 'confirmada' || r.estado === 'checkin').length,
        pendientes: regs.filter((r) =>
          ['pendiente', 'pago_pendiente', 'pago_en_revision'].includes(r.estado)).length
      };
    }
  } catch {
    notificar('No fue posible cargar el panel.');
  } finally {
    cargando.value = false;
  }
});

const hoy = computed(() => Formatters.hoyLocal());
const proximos = computed(() =>
  torneos.value.filter((t) => t.fecha >= hoy.value && t.estadoPublicacion === 'publicado'));
const activos = computed(() =>
  torneos.value.filter((t) => t.fecha < hoy.value && t.estadoPublicacion === 'publicado'));

/** Resumen de Mercado Pago del panel (datos completos en "Cobros y cuenta"). */
const mpConectado = computed(() => perfil.value?.mpEstado === 'conectado');
const mpEmail = computed(() => perfil.value?.mpEmail || perfil.value?.email || '');

function irTorneo(id) { router.push({ name: 'panel-torneo-detalle', params: { id } }); }
</script>

<template>
  <section class="panel-inicio">
    <header class="panel-inicio-header">
      <h1>Panel del organizador</h1>
      <p class="panel-inicio-sub">{{ perfil?.nombre || 'Organizador' }}</p>
    </header>

    <div class="panel-fila-accesos">
      <RouterLink :to="{name:'panel-torneos'}" class="acceso">Mis torneos</RouterLink>
      <RouterLink :to="{name:'panel-crear'}" class="acceso">Crear torneo</RouterLink>
      <RouterLink :to="{name:'panel-cobros'}" class="acceso">Cobros y cuenta</RouterLink>
    </div>

    <!-- Resumen de Mercado Pago (detalle completo en "Cobros y cuenta") -->
    <section class="panel-seccion" v-if="perfil">
      <h2>Mercado Pago</h2>
      <RouterLink :to="{name:'panel-cobros'}" class="mp-tarjeta" :class="mpConectado ? 'ok' : 'pend'">
        <span class="mp-punto" aria-hidden="true"></span>
        <span class="mp-datos">
          <strong>{{ mpConectado ? 'Conectado' : 'Pendiente de conexión' }}</strong>
          <span class="mp-correo">{{ mpEmail }}</span>
        </span>
        <span class="panel-accion">Ver datos →</span>
      </RouterLink>
    </section>

    <section class="panel-seccion" v-if="proximos.length">
      <h2>Próximos torneos</h2>
      <div class="panel-torneos">
        <article v-for="t in proximos" :key="t.id" class="panel-card" @click="irTorneo(t.id)">
          <div>
            <h3>{{ t.nombre }}</h3>
            <p class="panel-meta">{{ t.ciudad }}, {{ t.estado }} · {{ t.fecha }}</p>
            <p class="panel-meta-mas">{{ t.categorias?.length || 0 }} categorías · {{ t.modalidad }}</p>
          </div>
          <div v-if="estadisticas[t.id]" class="panel-estadisticas">
            <span class="stat"><strong>{{ estadisticas[t.id].confirmados }}</strong> confirmados</span>
            <span class="stat"><strong>{{ estadisticas[t.id].pendientes }}</strong> pendientes</span>
          </div>
          <span class="panel-accion">Abrir →</span>
        </article>
      </div>
    </section>

    <section class="panel-seccion" v-if="activos.length">
      <h2>Torneos activos</h2>
      <div class="panel-torneos">
        <article v-for="t in activos" :key="t.id" class="panel-card panel-card--activo" @click="irTorneo(t.id)">
          <div>
            <h3>{{ t.nombre }}</h3>
            <p class="panel-meta">{{ t.ciudad }}, {{ t.estado }} · {{ t.fecha }}</p>
          </div>
          <div v-if="estadisticas[t.id]" class="panel-estadisticas">
            <span class="stat"><strong>{{ estadisticas[t.id].confirmados }}</strong> / {{ t.cupo || '?' }}</span>
            <span class="stat stat-rojo" v-if="estadisticas[t.id].pendientes"><strong>{{ estadisticas[t.id].pendientes }}</strong> pendientes</span>
          </div>
          <span class="panel-accion">Administrar →</span>
        </article>
      </div>
    </section>

    <section v-if="!proximos.length && !activos.length" class="panel-vacio">
      <p>No tienes torneos publicados.</p>
      <button class="boton boton-verde" @click="router.push({name:'panel-crear'})">Crear tu primer torneo</button>
    </section>
  </section>
</template>

<style scoped>
/* Tokens del tema (tema.css). Antes se usaban variables inexistentes
   (--texto-secundario, --border, --fondo-hover…) y se perdían bordes/colores. */
.panel-inicio-header h1 { margin: 0 0 0.25rem; font-size: 1.5rem; }
.panel-inicio-sub { margin: 0 0 1.5rem; color: var(--texto-suave); }
.panel-fila-accesos { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 2rem; }
.acceso { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border: 1px solid var(--borde); border-radius: var(--radio); background: var(--superficie); text-decoration: none; color: var(--texto); font-weight: 500; }
.acceso:hover { background: var(--superficie-3); border-color: var(--verde); }
.panel-seccion { margin-bottom: 2rem; }
.panel-seccion h2 { margin: 0 0 0.75rem; font-size: 1.1rem; color: var(--texto-suave); text-transform: uppercase; letter-spacing: 0.05em; }
.panel-torneos { display: flex; flex-direction: column; gap: 0.5rem; }
.panel-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid var(--borde); border-radius: var(--radio); background: var(--superficie); cursor: pointer; }
.panel-card:hover { background: var(--superficie-3); border-color: var(--verde); }
.panel-card--activo { border-left: 4px solid var(--verde); }
.panel-card h3 { margin: 0 0 0.25rem; font-size: 1rem; }
.panel-meta { margin: 0; font-size: 0.8rem; color: var(--texto-suave); }
.panel-meta-mas { margin: 0.25rem 0 0; font-size: 0.75rem; color: var(--texto-suave); }
.panel-estadisticas { display: flex; gap: 1rem; font-size: 0.8rem; flex-shrink: 0; }
.stat { color: var(--texto-suave); } .stat strong { color: var(--texto); }
.stat-rojo { color: var(--peligro); }
.panel-accion { font-size: 0.8rem; color: var(--texto-suave); flex-shrink: 0; }
.panel-vacio { text-align: center; padding: 3rem; border: 1px dashed var(--borde-fuerte); border-radius: var(--radio); }
.panel-vacio p { margin: 0 0 1rem; color: var(--texto-suave); }

/* Resumen de Mercado Pago (enlaza a "Cobros y cuenta") */
.mp-tarjeta {
  display: flex; align-items: center; gap: 0.75rem; padding: 1rem;
  border: 1px solid var(--borde); border-left: 4px solid var(--verde);
  border-radius: var(--radio); background: var(--superficie);
  text-decoration: none; color: var(--texto);
}
.mp-tarjeta:hover { background: var(--superficie-3); border-color: var(--verde); }
.mp-tarjeta.pend { border-left-color: var(--dorado); }
.mp-punto { width: 10px; height: 10px; border-radius: 50%; background: var(--verde); flex-shrink: 0; }
.mp-tarjeta.pend .mp-punto { background: var(--dorado); }
.mp-datos { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.mp-datos strong { font-size: 0.95rem; }
.mp-correo { font-size: 0.8rem; color: var(--texto-suave); overflow-wrap: anywhere; }
</style>