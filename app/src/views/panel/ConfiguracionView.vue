<script setup>
/** Configuración del sistema (módulo de funciones del sistema). */
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { CATALOGO_CATEGORIAS, CATEGORIAS_EDAD, CATEGORIAS_NIVEL, CATEGORIAS_ESPECIAL } from '@/data/catalogoCategorias.js';

const router = useRouter();
const pestana = ref('categorias');
const genero = computed(() => ({ edades: CATEGORIAS_EDAD, nivel: CATEGORIAS_NIVEL, especial: CATEGORIAS_ESPECIAL, total: CATALOGO_CATEGORIAS }));

function irTorneo(id) { router.push({ name: 'panel-torneo', params: { id } }); }
</script>

<template>
  <section class="configuracion">
    <header class="configuracion-header">
      <h1>Configuración del sistema</h1>
      <p class="configuracion-sub">Ajustes globales independientes del torneo</p>
    </header>

    <nav class="configuracion-nav">
      <button type="button" v-for="p in ['categorias','pagos','qr']" :key="p" class="configuracion-btn" :class="{activo:pestana===p}" @click="pestana=p">
        <template v-if="p==='categorias'">📋 Categorías</template>
        <template v-else-if="p==='pagos'">💳 Pagos</template>
        <template v-else>📱 QR</template>
      </button>
    </nav>

    <div class="configuracion-contenido">
      <!-- Categorías -->
      <div v-if="pestana==='categorias'">
        <p class="configuracion-desc">Catálogo base de categorías. Al crear un torneo, puedes seleccionar cuáles usar, renombrarlas y ajustar precios. Los cambios aquí no afectan torneos existentes.</p>

        <section class="configuracion-grupo" v-for="(listado, grupo) in genero" :key="grupo">
          <h3>{{ grupo==='edades'?'👶 Por edad':grupo==='nivel'?'🏆 Por nivel / fuerza':'⭐ Especiales' }}</h3>
          <table class="configuracion-tabla">
            <thead><tr><th>ID</th><th>Nombre</th><th>Precio default</th><th>Grupo</th></tr></thead>
            <tbody>
              <tr v-for="c in listado" :key="c.id">
                <td><code>{{ c.id }}</code></td>
                <td>{{ c.nombre }}</td>
                <td>{{ c.precioDefault!==undefined? (c.precioDefault?`$${c.precioDefault} MXN`:'Gratis') : '—' }}</td>
                <td>{{ c.grupo }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <!-- Pagos -->
      <div v-else-if="pestana==='pagos'">
        <p class="configuracion-desc">Medios de pago disponibles para inscripciones.</p>
        <div class="configuracion-opciones">
          <label class="configuracion-opcion"><input type="checkbox" checked /><span>Efectivo (en el recinto)</span></label>
          <label class="configuracion-opcion"><input type="checkbox" checked /><span>Transferencia bancaria</span></label>
          <label class="configuracion-opcion"><input type="checkbox" /><span>Tarjeta de crédito (por integrar)</span></label>
          <label class="configuracion-opcion"><input type="checkbox" /><span>Pagos digitales (Mercado Pago, etc.)</span></label>
        </div>
      </div>

      <!-- QR -->
      <div v-else>
        <p class="configuracion-desc">Configuración de validación por QR para check-in en torneos presenciales.</p>
        <div class="configuracion-opciones">
          <label class="configuracion-opcion"><input type="checkbox" checked /><span>Generar códigos QR por participante</span></label>
          <label class="configuracion-opcion"><input type="checkbox" checked /><span>Escáner de códigos QR en check-in</span></label>
          <label class="configuracion-opcion"><input type="checkbox" /><span>QR con foto del participante</span></label>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.configuracion-header h1 { margin: 0 0 0.25rem; font-size: 1.5rem; }
.configuracion-sub { margin: 0 0 1.5rem; color: var(--texto-secundario); }
.configuracion-nav { display: flex; gap: 0.25rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
.configuracion-btn { padding: 0.75rem 1rem; border: none; background: transparent; color: var(--texto-secundario); cursor: pointer; border-bottom: 2px solid transparent; }
.configuracion-btn:hover { color: var(--texto); }
.configuracion-btn.activo { color: var(--texto); border-bottom-color: var(--border-acento); }
.configuracion-contenido { background: var(--fondo); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; }
.configuracion-desc { margin: 0 0 1.5rem; color: var(--texto-secundario); font-size: 0.9rem; line-height: 1.5; }
.configuracion-grupo { margin-bottom: 2rem; }
.configuracion-grupo h3 { margin: 0 0 0.75rem; font-size: 1rem; }
.configuracion-tabla { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.configuracion-tabla th, .configuracion-tabla td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid var(--border); }
.configuracion-tabla th { font-weight: 600; color: var(--texto-secundario); font-size: 0.8rem; text-transform: uppercase; }
.configuracion-tabla code { background: var(--fondo-hover); padding: 0.1rem 0.3rem; border-radius: 4px; font-size: 0.8rem; }
.configuracion-opciones { display: flex; flex-direction: column; gap: 0.5rem; }
.configuracion-opcion { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; }
.configuracion-opcion:hover { background: var(--fondo-hover); }
.configuracion-opcion input { width: 1.1rem; height: 1.1rem; accent-color: var(--color-primario); }
</style>