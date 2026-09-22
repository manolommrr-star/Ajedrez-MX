<script setup>
/**
 * Inscripción del jugador a un torneo.
 * Si hay sesión de jugador solo elige categoría; si no, crea el perfil.
 */
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { TournamentRepository } from '@/repositories/tournamentRepository.js';
import { RegistrationsRepository } from '@/core/registrationsRepository.js';
import { CuentasRepository } from '@/core/cuentasRepository.js';
import { PaymentsRepository } from '@/core/paymentsRepository.js';
import { Formatters } from '@/utils/formatters.js';
import { useSesion } from '@/composables/useSesion.js';
import { notificar } from '@/composables/useAviso.js';
import EstadoInsignia from '@/components/EstadoInsignia.vue';

const ruta = useRoute();
const router = useRouter();
const { estado, asegurarSesion, refrescarSesion } = useSesion();

const torneo = ref(null);
const inscripcion = ref(null);
const cargando = ref(true);
const categoria = ref('');
const enviando = ref(false);

const perfil = ref({ nombre: '', apellidos: '', email: '', telefono: '', fideId: '', elo: '', club: '', federacion: '', ciudad: '', estado: '', sexo: '' });

const completo = computed(() => torneo.value && torneo.value.inscritos >= torneo.value.cupo);
const precioSeleccionado = computed(() => {
  const cat = torneo.value?.categorias.find((c) => c.nombre === categoria.value);
  return cat ? Formatters.precio(cat.precio) : '';
});

onMounted(async () => {
  try {
    await asegurarSesion();
    torneo.value = await TournamentRepository.getById(ruta.params.id);
    if (torneo.value) {
      categoria.value = torneo.value.categorias[0]?.nombre || '';
      if (estado.jugador) {
        const mias = await RegistrationsRepository.getPorJugador(estado.jugador.id);
        inscripcion.value = mias.find((r) => r.torneoId === torneo.value.id) || null;
      }
    }
  } catch {
    notificar('No fue posible cargar el torneo.');
  } finally {
    cargando.value = false;
  }
});

async function inscribirse() {
  if (!categoria.value) {
    notificar('Selecciona una categoría.');
    return;
  }
  enviando.value = true;

  let playerId = estado.jugador?.id ?? null;

  if (!playerId) {
    if (!perfil.value.nombre.trim() || !perfil.value.email.trim()) {
      enviando.value = false;
      notificar('Nombre y email son obligatorios.');
      return;
    }
    // Crea la cuenta de jugador (mock auth.users + fila players) e inicia sesión.
    const alta = await CuentasRepository.registrar({
      rol: 'player',
      nombre: perfil.value.nombre,
      apellidos: perfil.value.apellidos,
      email: perfil.value.email,
      clave: 'demo1234',
      extras: {
        fideId: perfil.value.fideId,
        elo: perfil.value.elo,
        club: perfil.value.club,
        federacion: perfil.value.federacion,
        ciudad: perfil.value.ciudad,
        estado: perfil.value.estado,
        telefono: perfil.value.telefono,
        sexo: perfil.value.sexo
      }
    });
    if (!alta.ok) {
      enviando.value = false;
      notificar(alta.motivo);
      return;
    }
    playerId = alta.cuenta.playerId;
    await refrescarSesion();
  }

  const resultado = await RegistrationsRepository.inscribir({
    playerId,
    torneoId: torneo.value.id,
    categoria: categoria.value
  });

  if (!resultado.ok) {
    enviando.value = false;
    notificar(resultado.motivo);
    return;
  }

  // Pago en línea: se genera el folio y se lleva al jugador al checkout.
  const pago = await PaymentsRepository.crearParaInscripcion({
    inscripcion: resultado.inscripcion,
    torneo: torneo.value,
    jugador: estado.jugador
  });
  enviando.value = false;
  notificar('Inscripción registrada · continúa con el pago en línea.');
  router.push(pago ? `/pagar/${encodeURIComponent(pago.folio)}` : '/mis-inscripciones');
}
</script>

<template>
  <section class="contenedor">
    <p v-if="cargando" class="texto-suave">Cargando…</p>

    <div v-else-if="!torneo" class="tarjeta">
      <h1 class="titulo-pagina">Torneo no encontrado</h1>
      <p class="texto-suave">El torneo no existe o no acepta inscripciones.</p>
      <RouterLink class="boton boton-verde" to="/">Volver al catálogo</RouterLink>
    </div>

    <template v-else>
      <RouterLink class="enlace-volver" :to="`/torneo/${encodeURIComponent(torneo.id)}`">
        ← {{ torneo.nombre }}
      </RouterLink>

      <template v-if="inscripcion">
        <h1 class="titulo-pagina">Ya estás inscrito</h1>
        <p class="subtitulo-pagina">
          Tienes una inscripción en este torneo (estado: <EstadoInsignia :estado="inscripcion.estado" />).
        </p>
        <RouterLink class="boton boton-verde" to="/mis-inscripciones">Ver mis inscripciones</RouterLink>
      </template>

      <template v-else-if="completo">
        <h1 class="titulo-pagina">Torneo completo</h1>
        <p class="subtitulo-pagina">No hay lugares disponibles en este torneo.</p>
      </template>

      <template v-else>
        <h1 class="titulo-pagina">Inscripción · {{ torneo.nombre }}</h1>
        <p class="subtitulo-pagina">
          {{ Formatters.fechaLarga(torneo.fecha) }} · {{ torneo.ciudad }}, {{ torneo.estado }} ·
          {{ torneo.inscritos }} / {{ torneo.cupo }} lugares
        </p>

        <form class="formulario" @submit.prevent="inscribirse">
          <div class="grupo-campos">
            <p class="grupo-titulo">Categoría</p>
            <div class="opciones-categoria">
              <label v-for="cat in torneo.categorias" :key="cat.nombre" class="opcion">
                <input v-model="categoria" type="radio" name="categoria" :value="cat.nombre">
                <span>
                  <span class="opcion-titulo">{{ cat.nombre }}</span>
                  <span class="opcion-desc">{{ Formatters.precio(cat.precio) }}</span>
                </span>
              </label>
            </div>
          </div>

          <div v-if="estado.jugador" class="grupo-campos">
            <p class="grupo-titulo">Tus datos</p>
            <div class="aviso">
              <p>
                Inscrito como <strong>{{ estado.jugador.apellidos }} {{ estado.jugador.nombre }}</strong>
                <template v-if="estado.jugador.elo"> · Elo {{ estado.jugador.elo }}</template>.
              </p>
            </div>
          </div>

          <div v-else class="grupo-campos">
            <p class="grupo-titulo">Datos del jugador</p>
            <div class="campo-fila">
              <label class="campo">
                <span class="campo-etiqueta">Nombre *</span>
                <input v-model="perfil.nombre" class="control" required>
              </label>
              <label class="campo">
                <span class="campo-etiqueta">Apellidos</span>
                <input v-model="perfil.apellidos" class="control">
              </label>
            </div>
            <div class="campo-fila">
              <label class="campo">
                <span class="campo-etiqueta">Email *</span>
                <input v-model="perfil.email" class="control" type="email" required>
              </label>
              <label class="campo">
                <span class="campo-etiqueta">Teléfono</span>
                <input v-model="perfil.telefono" class="control">
              </label>
            </div>
            <div class="campo-fila">
              <label class="campo">
                <span class="campo-etiqueta">FIDE ID</span>
                <input v-model="perfil.fideId" class="control">
              </label>
              <label class="campo">
                <span class="campo-etiqueta">Elo</span>
                <input v-model="perfil.elo" class="control" type="number" min="0" max="3000">
              </label>
            </div>
            <div class="campo-fila">
              <label class="campo">
                <span class="campo-etiqueta">Club</span>
                <input v-model="perfil.club" class="control">
              </label>
              <label class="campo">
                <span class="campo-etiqueta">Sexo</span>
                <select v-model="perfil.sexo" class="control">
                  <option value="">Sin especificar</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </label>
            </div>
            <p class="campo-ayuda">Al enviar se crea tu perfil de jugador (demo) y se inicia tu sesión.</p>
          </div>

          <div class="acciones-form">
            <RouterLink class="boton boton-gris" :to="`/torneo/${encodeURIComponent(torneo.id)}`">Cancelar</RouterLink>
            <button type="submit" class="boton boton-verde" :disabled="enviando">
              {{ enviando ? 'Enviando…' : (estado.jugador ? `Confirmar inscripción · ${precioSeleccionado}` : 'Crear perfil e inscribirme') }}
            </button>
          </div>
        </form>
      </template>
    </template>
  </section>
</template>