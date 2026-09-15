<script setup>
/**
 * Panel · Crear / editar torneo.
 * Si llega prop `id` edita; si no, crea un borrador nuevo.
 */
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { OrganizadorRepository } from '@/repositories/organizadorRepository.js';
import { notificar } from '@/composables/useAviso.js';

const props = defineProps({ id: { type: String, default: '' } });
const router = useRouter();

const eventos = ref([]);
const editando = ref(null);
const cargando = ref(true);

const form = ref({
  nombre: '', grupo: '', fecha: '', eventoId: '', descripcion: '',
  ciudad: '', estado: '', sede: '', modalidad: 'Presencial',
  sistema: 'Sistema suizo', rondas: 5, ritmo: '', cupo: 32,
  destacado: false, swissManagerEventId: '', chessResultsId: '', chessResultsUrl: ''
});
const categorias = ref([{ nombre: 'General', precio: 0 }]);

onMounted(async () => {
  eventos.value = await OrganizadorRepository.getEventos();
  if (props.id) {
    editando.value = await OrganizadorRepository.getTorneoPorId(props.id);
    if (editando.value) {
      const t = editando.value;
      Object.assign(form.value, {
        nombre: t.nombre || '', grupo: t.grupo || '', fecha: t.fecha || '',
        eventoId: t.eventoId || '', descripcion: t.descripcion || '',
        ciudad: t.ciudad || '', estado: t.estado || '', sede: t.sede || '',
        modalidad: t.modalidad || 'Presencial', sistema: t.sistema || 'Sistema suizo',
        rondas: t.rondas ?? 5, ritmo: t.ritmo || '', cupo: t.cupo ?? 32,
        destacado: !!t.destacado, swissManagerEventId: t.swissManagerEventId || '',
        chessResultsId: t.chessResultsId || '', chessResultsUrl: t.chessResultsUrl || ''
      });
      const cats = (t.categorias || []).map((c) => ({ ...c }));
      categorias.value = cats.length ? cats : [{ nombre: 'General', precio: 0 }];
    }
  }
  cargando.value = false;
});

function agregarCategoria() { categorias.value.push({ nombre: '', precio: 0 }); }
function quitarCategoria(i) { if (categorias.value.length > 1) categorias.value.splice(i, 1); }

async function guardar() {
  if (!form.value.nombre.trim() || !form.value.fecha) {
    notificar('Nombre y fecha son obligatorios.');
    return;
  }
  const cats = categorias.value
    .map((c) => ({ nombre: String(c.nombre || '').trim(), precio: Number(c.precio) || 0 }))
    .filter((c) => c.nombre);
  const torneo = await OrganizadorRepository.guardarTorneo({
    id: editando.value ? editando.value.id : null,
    ...form.value,
    nombre: form.value.nombre.trim(),
    categorias: cats.length ? cats : [{ nombre: 'General', precio: 0 }]
  });
  if (torneo) {
    notificar(editando.value ? 'Torneo actualizado.' : 'Torneo guardado como borrador.');
    router.push({ name: 'panel-torneos' });
  } else {
    notificar('No se pudo guardar.');
  }
}
</script>

<template>
  <h1 class="titulo-pagina">{{ editando ? 'Editar torneo' : 'Crear torneo' }}</h1>
  <p class="subtitulo-pagina">{{ editando ? 'Actualiza los datos del torneo.' : 'Se guarda como borrador hasta publicarlo.' }}</p>
  <p v-if="cargando" class="texto-suave">Cargando…</p>
  <p v-else-if="props.id && !editando" class="aviso">El torneo no existe o no te pertenece.</p>
  <form v-else class="formulario" @submit.prevent="guardar">
    <div class="grupo-campos">
      <h2 class="grupo-titulo">Datos generales</h2>
      <label class="campo"><span class="campo-etiqueta">Nombre *</span>
        <input v-model="form.nombre" class="control" required /></label>
      <div class="campo-fila">
        <label class="campo"><span class="campo-etiqueta">Grupo</span>
          <input v-model="form.grupo" class="control" /></label>
        <label class="campo"><span class="campo-etiqueta">Fecha *</span>
          <input v-model="form.fecha" class="control" type="date" required /></label>
      </div>
      <label class="campo"><span class="campo-etiqueta">Evento</span>
        <select v-model="form.eventoId" class="control">
          <option value="">Sin evento</option>
          <option v-for="e in eventos" :key="e.id" :value="e.id">{{ e.nombre }}</option>
        </select></label>
      <label class="campo"><span class="campo-etiqueta">Descripcion</span>
        <textarea v-model="form.descripcion" class="control"></textarea></label>
    </div>
    <div class="grupo-campos">
      <h2 class="grupo-titulo">Sede</h2>
      <div class="campo-fila">
        <label class="campo"><span class="campo-etiqueta">Ciudad</span>
          <input v-model="form.ciudad" class="control" /></label>
        <label class="campo"><span class="campo-etiqueta">Estado</span>
          <input v-model="form.estado" class="control" /></label>
      </div>
      <label class="campo"><span class="campo-etiqueta">Lugar</span>
        <input v-model="form.sede" class="control" /></label>
      <label class="campo"><span class="campo-etiqueta">Modalidad</span>
        <select v-model="form.modalidad" class="control">
          <option>Presencial</option>
          <option>Online</option>
        </select></label>
    </div>
    <div class="grupo-campos">
      <h2 class="grupo-titulo">Formato y cupo</h2>
      <div class="campo-fila">
        <label class="campo"><span class="campo-etiqueta">Sistema</span>
          <input v-model="form.sistema" class="control" /></label>
        <label class="campo"><span class="campo-etiqueta">Rondas</span>
          <input v-model.number="form.rondas" class="control" type="number" min="1" /></label>
      </div>
      <div class="campo-fila">
        <label class="campo"><span class="campo-etiqueta">Ritmo</span>
          <input v-model="form.ritmo" class="control" placeholder="Ej: 90+30" /></label>
        <label class="campo"><span class="campo-etiqueta">Cupo</span>
          <input v-model.number="form.cupo" class="control" type="number" min="2" /></label>
      </div>
      <label class="opcion"><input v-model="form.destacado" type="checkbox" />
        <span><span class="opcion-titulo">Destacado</span>
        <span class="opcion-desc">Aparece primero en el catalogo.</span></span></label>
    </div>
    <div class="grupo-campos">
      <h2 class="grupo-titulo">Categorias y precios (MXN)</h2>
      <div v-for="(c, i) in categorias" :key="i" class="campo-fila">
        <label class="campo"><span class="campo-etiqueta">Nombre</span>
          <input v-model="c.nombre" class="control" placeholder="Ej: Libre" /></label>
        <label class="campo"><span class="campo-etiqueta">Precio</span>
          <input v-model.number="c.precio" class="control" type="number" min="0" step="1" /></label>
      </div>
      <div class="chips-fila">
        <button type="button" class="boton boton-gris boton-sm" @click="agregarCategoria">Agregar categoria</button>
        <button v-if="categorias.length > 1" type="button" class="boton boton-texto boton-peligro" @click="quitarCategoria(categorias.length - 1)">Quitar ultima</button>
      </div>
    </div>
    <div class="grupo-campos">
      <h2 class="grupo-titulo">Integraciones (opcional)</h2>
      <div class="campo-fila">
        <label class="campo"><span class="campo-etiqueta">Swiss-Manager ID</span>
          <input v-model="form.swissManagerEventId" class="control" /></label>
        <label class="campo"><span class="campo-etiqueta">Chess-Results ID</span>
          <input v-model="form.chessResultsId" class="control" /></label>
      </div>
      <label class="campo"><span class="campo-etiqueta">Chess-Results URL</span>
        <input v-model="form.chessResultsUrl" class="control" type="url" placeholder="https://…" /></label>
    </div>
    <div class="acciones-form">
      <RouterLink class="boton boton-gris" :to="{ name: 'panel-torneos' }">Cancelar</RouterLink>
      <button type="submit" class="boton boton-verde">{{ editando ? 'Guardar cambios' : 'Guardar borrador' }}</button>
    </div>
  </form>
</template>
