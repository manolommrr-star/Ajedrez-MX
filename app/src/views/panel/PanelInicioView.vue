<script setup>
/** Panel principal del organizador (dashboard). */
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { OrganizadorRepository } from '@/repositories/organizadorRepository.js';
import { RegistrationsRepository } from '@/core/registrationsRepository.js';

const router = useRouter();
const perfil = ref(null);
const torneos = ref([]);
const estadisticas = ref({});
const cargando = ref(true);

onMounted(async () => {
  perfil.value = await OrganizadorRepository.getPerfil();
  torneos.value = await OrganizadorRepository.getTorneos();
  // getPorTorneo es asíncrono: se resuelven una vez y se guardan en un ref.
  for (const t of torneos.value) {
    const regs = await RegistrationsRepository.getPorTorneo(t.id);
    estadisticas.value[t.id] = {
      confirmados: regs.filter((r) => r.estado === 'confirmada' || r.estado === 'checkin').length,
      pendientes: regs.filter((r) =>
        ['pendiente', 'pago_pendiente', 'pago_en_revision'].includes(r.estado)).length
    };
  }
  cargando.value = false;
});

const hoy = computed(() => new Date().toISOString().slice(0, 10));
const proximos = computed(() =>
  torneos.value.filter((t) => t.fecha >= hoy.value && t.estadoPublicacion === 'publicado'));
const activos = computed(() =>
  torneos.value.filter((t) => t.fecha < hoy.value && t.estadoPublicacion === 'publicado'));

function irTorneo(id) { router.push({ name: 'panel-torneo-detalle', params: { id } }); }
</script>

<template>
  <section class="panel-inicio">
    <header class="panel-inicio-header">
      <h1>Panel del organizador</h1>
      <p class="panel-inicio-sub">{{ perfil?.nombre || 'Organizador' }}</p>
    </header>

    <div class="panel-fila-accesos">
      <RouterLink :to="{name:'panel-torneos'}" class="acceso">📋 Mis torneos</RouterLink>
      <RouterLink :to="{name:'panel-crear'}" class="acceso">➕ Crear torneo</RouterLink>
      <RouterLink :to="{name:'panel-configuracion'}" class="acceso">📊 Reportes</RouterLink>
      <RouterLink :to="{name:'panel-configuracion'}" class="acceso">⚙️ Configuración</RouterLink>
    </div>

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
      <button class="boton boton-primario" @click="router.push({name:'panel-crear'})">Crear tu primer torneo</button>
    </section>
  </section>
</template>

<style scoped>
.panel-inicio-header h1 { margin: 0 0 0.25rem; font-size: 1.5rem; }
.panel-inicio-sub { margin: 0 0 1.5rem; color: var(--texto-secundario); }
.panel-fila-accesos { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 2rem; }
.acceso { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--fondo); text-decoration: none; color: var(--texto); font-weight: 500; }
.acceso:hover { background: var(--fondo-hover); border-color: var(--border-acento); }
.panel-seccion { margin-bottom: 2rem; }
.panel-seccion h2 { margin: 0 0 0.75rem; font-size: 1.1rem; color: var(--texto-secundario); text-transform: uppercase; letter-spacing: 0.05em; }
.panel-torneos { display: flex; flex-direction: column; gap: 0.5rem; }
.panel-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--fondo); cursor: pointer; }
.panel-card:hover { background: var(--fondo-hover); border-color: var(--border-acento); }
.panel-card--activo { border-left: 4px solid var(--color-exito); }
.panel-card h3 { margin: 0 0 0.25rem; font-size: 1rem; }
.panel-meta { margin: 0; font-size: 0.8rem; color: var(--texto-secundario); }
.panel-meta-mas { margin: 0.25rem 0 0; font-size: 0.75rem; color: var(--texto-secundario); }
.panel-estadisticas { display: flex; gap: 1rem; font-size: 0.8rem; flex-shrink: 0; }
.stat { color: var(--texto-secundario); } .stat strong { color: var(--texto); }
.stat-rojo { color: var(--color-advertencia); }
.panel-accion { font-size: 0.8rem; color: var(--texto-secundario); flex-shrink: 0; }
.panel-vacio { text-align: center; padding: 3rem; border: 1px dashed var(--border); border-radius: 8px; }
.panel-vacio p { margin: 0 0 1rem; color: var(--texto-secundario); }
</style>