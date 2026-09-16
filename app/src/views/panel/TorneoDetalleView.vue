<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const tabActiva = ref('general')
const torneoId = computed(() => route.params.id || route.params.torneoId || route.params.torneo)

const tabs = [
  { key: 'general', label: 'General' },
  { key: 'inscripciones', label: 'Inscripciones' },
  { key: 'participantes', label: 'Participantes' },
  { key: 'checkin', label: 'Check-in' },
  { key: 'pagos', label: 'Pagos' }
]

const torneo = ref(null)
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const { organizadorRepository } = await import('@/repositories/organizadorRepository.js')
    const id = torneoId.value
    if (id) {
      torneo.value = await organizadorRepository.getTorneoById(id)
    }
  } catch (e) {
    console.error('Error al cargar torneo:', e)
    error.value = e.message || 'Error al cargar el torneo'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="torneo-detalle">
    <div v-if="loading" class="loading">
      <p class="texto-suave">Cargando torneo...</p>
    </div>
    <div v-else-if="error" class="error">
      <p class="texto-error">{{ error }}</p>
    </div>
    <template v-else>
      <div v-if="torneo" class="panel-encabezado">
        <h1 class="panel-titulo">{{ torneo.nombre }}</h1>
        <p v-if="torneo.fecha" class="texto-suave">
          {{ torneo.fecha }} · {{ torneo.ciudad }}, {{ torneo.estado }}
        </p>
        <div v-if="torneo.categorias && torneo.categorias.length" class="categorias-resumen">
          <span
            v-for="cat in torneo.categorias"
            :key="cat.id || cat.nombre"
            class="badge-categoria"
          >
            {{ cat.nombre || cat }}
            <span v-if="cat.precio || cat.precioDefault !== undefined">
              · ${{ cat.precio ?? cat.precioDefault }}
            </span>
          </span>
        </div>
      </div>
      <div v-else class="sin-datos">
        <p class="texto-suave">Torneo no encontrado</p>
      </div>
      <div v-if="torneo" class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-btn', { active: tabActiva === tab.key }]"
          @click="tabActiva = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
      <div v-if="torneo" class="tab-content">
        <div v-if="tabActiva === 'general'" class="tab-pane">
          <section class="seccion">
            <h2>Información general</h2>
            <dl class="info-grid">
              <div v-if="torneo.modalidad"><dt>Modalidad</dt><dd>{{ torneo.modalidad }}</dd></div>
              <div v-if="torneo.sistema"><dt>Sistema</dt><dd>{{ torneo.sistema }}</dd></div>
              <div v-if="torneo.rondas"><dt>Rondas</dt><dd>{{ torneo.rondas }}</dd></div>
              <div v-if="torneo.ritmo"><dt>Ritmo</dt><dd>{{ torneo.ritmo }}</dd></div>
              <div v-if="torneo.sede"><dt>Sede</dt><dd>{{ torneo.sede }}</dd></div>
              <div v-if="torneo.direccion"><dt>Dirección</dt><dd>{{ torneo.direccion }}</dd></div>
              <div v-if="torneo.cupo"><dt>Cupo</dt><dd>{{ torneo.cupo }} jugadores</dd></div>
              <div v-if="torneo.organizador"><dt>Organizador</dt><dd>{{ torneo.organizador.nombre }}</dd></div>
            </dl>
          </section>
          <section v-if="torneo.categorias && torneo.categorias.length" class="seccion">
            <h2>Categorías</h2>
            <ul class="lista-categorias">
              <li v-for="cat in torneo.categorias" :key="cat.id || cat.nombre" class="item-categoria">
                <span class="nombre-categoria">{{ cat.nombre || cat }}</span>
                <span v-if="cat.precio !== undefined" class="precio-categoria">${{ cat.precio }} MXN</span>
                <span v-else-if="cat.precioDefault !== undefined" class="precio-categoria">${{ cat.precioDefault }} MXN</span>
              </li>
            </ul>
          </section>
        </div>
        <div v-else-if="tabActiva === 'inscripciones'" class="tab-pane">
          <InscripcionesView />
        </div>
        <div v-else-if="tabActiva === 'participantes'" class="tab-pane">
          <ParticipantesView />
        </div>
        <div v-else-if="tabActiva === 'checkin'" class="tab-pane">
          <CheckinTorneoView />
        </div>
        <div v-else-if="tabActiva === 'pagos'" class="tab-pane">
          <PagosView />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.torneo-detalle { padding: 24px; max-width: 1200px; margin: 0 auto; }
.loading, .error, .sin-datos { padding: 48px 24px; text-align: center; }
.texto-suave { color: #666; font-size: 15px; }
.texto-error { color: #c00; font-size: 15px; }
.panel-encabezado { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
.panel-titulo { margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #111; }
.categorias-resumen { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.badge-categoria { display: inline-block; padding: 4px 10px; background: #f3f4f6; border-radius: 4px; font-size: 13px; color: #444; }
.tabs { display: flex; gap: 4px; margin-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
.tab-btn { padding: 10px 16px; border: none; background: none; cursor: pointer; font-size: 14px; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s; }
.tab-btn:hover { color: #374151; }
.tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; font-weight: 500; }
.tab-content { min-height: 300px; }
.tab-pane { animation: fadeIn 0.15s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.seccion { margin-bottom: 32px; }
.seccion h2 { font-size: 16px; font-weight: 600; color: #374151; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
.info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.info-grid > div { padding: 8px 0; }
.info-grid dt { font-size: 12px; color: #6b7280; margin-bottom: 2px; }
.info-grid dd { margin: 0; font-size: 14px; color: #111827; }
.lista-categorias { list-style: none; padding: 0; margin: 0; }
.item-categoria { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #f9fafb; border-radius: 6px; margin-bottom: 6px; }
.nombre-categoria { font-weight: 500; color: #111827; }
.precio-categoria { color: #059669; font-weight: 600; font-size: 14px; }
</style>

