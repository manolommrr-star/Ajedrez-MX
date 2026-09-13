/**
 * Vista de inscripción del jugador (Etapa 3 · registro online).
 * Ruta: #/torneo/:id/inscribirse
 *
 * Replica el esquema canónico: si no hay sesión crea la fila del jugador
 * (players) y abre la sesión; luego crea la inscripción (registrations,
 * estado 'pendiente'), que se audita en registration_historial.
 */
import { TournamentRepository } from '../repositories/tournamentRepository.js';
import { RegistrationsRepository } from '../core/registrationsRepository.js';
import { PlayersRepository } from '../core/playersRepository.js';
import { Sesion } from '../core/sesion.js';
import { escapar, notificar, insignia } from '../ui/components.js';
import { Formatters } from '../utils/formatters.js';

function plantillaNoEncontrado() {
  return `
  <section class="detalle-contenedor">
    <h1 class="panel-titulo">Torneo no encontrado</h1>
    <p class="aviso">El torneo no existe o no acepta inscripciones.</p>
    <a class="boton boton-primario" href="#/">Volver al catálogo</a>
  </section>`;
}

/** Radios de categoría con precio (solo categorías del torneo). */
function opcionesCategoria(torneo) {
  return `<div class="categoria-opciones">${torneo.categorias.map((c, i) =>
    `<label class="categoria-opcion">
       <input type="radio" name="categoria" value="${escapar(c.nombre)}" data-precio="${c.precio}" ${i === 0 ? 'checked' : ''} required>
       <span>${escapar(c.nombre)} · <strong>${Formatters.precio(c.precio)}</strong></span>
     </label>`).join('')}</div>`;
}

/** Campos del perfil del jugador (equivalente a la tabla players). */
function campoSimple(nombre, etiqueta, tipo = 'text', requerido = false) {
  const req = requerido ? ' required' : '';
  const tipoAttr = tipo === 'text' ? '' : ` type="${tipo}"`;
  return `<label class="campo"><span class="campo-etiqueta">${escapar(etiqueta)}${requerido ? ' *' : ''}</span>
    <input class="campo-control" name="${nombre}"${tipoAttr}${req}></label>`;
}

function camposJugador() {
  return `
    <div class="campo-fila">
      ${campoSimple('nombre', 'Nombre', 'text', true)}
      ${campoSimple('apellidos', 'Apellidos')}
    </div>
    <div class="campo-fila">
      ${campoSimple('email', 'Email', 'email', true)}
      ${campoSimple('telefono', 'Teléfono')}
    </div>
    <div class="campo-fila">
      ${campoSimple('fideId', 'FIDE ID')}
      ${campoSimple('elo', 'Elo', 'number')}
    </div>
    <div class="campo-fila">
      ${campoSimple('club', 'Club')}
      ${campoSimple('federacion', 'Federación')}
    </div>
    <div class="campo-fila">
      ${campoSimple('ciudad', 'Ciudad')}
      ${campoSimple('estado', 'Estado')}
    </div>`;
}

/** Bloque "tus datos" (perfil existente) o formulario para crearlo. */
function bloqueJugador(jugador) {
  return jugador
    ? `<fieldset class="conjunto-campos">
         <legend class="panel-subtitulo">Tus datos</legend>
         <p class="aviso" style="margin:0">Inscrito como <strong>${escapar(`${jugador.apellidos} ${jugador.nombre}`)}</strong>${jugador.elo ? ` · Elo ${jugador.elo}` : ''}.</p>
       </fieldset>`
    : `<fieldset class="conjunto-campos">
         <legend class="panel-subtitulo">Datos del jugador</legend>
         ${camposJugador()}
         <p class="campo-ayuda">Al enviar se crea tu perfil de jugador (demo) y se inicia tu sesión.</p>
       </fieldset>`;
}

export const InscripcionView = {
  async renderFormulario(contenedor, torneoId) {
    const torneo = await TournamentRepository.getById(torneoId);
    if (!torneo) {
      contenedor.innerHTML = plantillaNoEncontrado();
      return;
    }

    const jugador = await Sesion.getJugador();
    let inscripcionActual = null;
    if (jugador) {
      inscripcionActual = (await RegistrationsRepository.getPorJugador(jugador.id))
        .find((r) => r.torneoId === torneoId) || null;
    }

    if (inscripcionActual) {
      contenedor.innerHTML = `
        <section class="detalle-contenedor">
          <a class="enlace-volver" href="#/torneo/${encodeURIComponent(torneo.id)}">← ${escapar(torneo.nombre)}</a>
          <h1 class="panel-titulo">Ya estás inscrito</h1>
          <p class="aviso">Tienes una inscripción en este torneo (estado: ${insignia(inscripcionActual.estado)}).</p>
          <a class="boton boton-primario" href="#/mis-inscripciones">Ver mis inscripciones</a>
        </section>`;
      return;
    }

    if (torneo.inscritos >= torneo.cupo) {
      contenedor.innerHTML = `
        <section class="detalle-contenedor">
          <a class="enlace-volver" href="#/torneo/${encodeURIComponent(torneo.id)}">← ${escapar(torneo.nombre)}</a>
          <h1 class="panel-titulo">Torneo completo</h1>
          <p class="aviso">No hay lugares disponibles en este torneo.</p>
        </section>`;
      return;
    }

    contenedor.innerHTML = `
      <section class="detalle-contenedor">
        <a class="enlace-volver" href="#/torneo/${encodeURIComponent(torneo.id)}">← ${escapar(torneo.nombre)}</a>
        <h1 class="panel-titulo">Inscripción · ${escapar(torneo.nombre)}</h1>
        <p class="panel-descripcion">${Formatters.fechaLarga(torneo.fecha)} · ${escapar(torneo.ciudad)}, ${escapar(torneo.estado)} · ${torneo.inscritos} / ${torneo.cupo} lugares</p>
        <form id="formulario-inscripcion" class="formulario-panel">
          <fieldset class="conjunto-campos">
            <legend class="panel-subtitulo">Categoría</legend>
            ${opcionesCategoria(torneo)}
          </fieldset>
          ${bloqueJugador(jugador)}
          <div class="panel-acciones">
            <a class="boton boton-secundario" href="#/torneo/${encodeURIComponent(torneo.id)}">Cancelar</a>
            <button type="submit" class="boton boton-primario">${jugador ? 'Confirmar inscripción' : 'Crear perfil e inscribirme'}</button>
          </div>
        </form>
      </section>`;

    const formulario = contenedor.querySelector('#formulario-inscripcion');
    formulario.addEventListener('submit', async (e) => {
      e.preventDefault();
      const seleccion = formulario.querySelector('input[name="categoria"]:checked');
      if (!seleccion) {
        notificar('Selecciona una categoría.');
        return;
      }
      let jugadorActivo = await Sesion.getJugador();
      if (!jugadorActivo) {
        const datos = new FormData(formulario);
        if (!String(datos.get('nombre') || '').trim() || !String(datos.get('email') || '').trim()) {
          notificar('Nombre y email son obligatorios.');
          return;
        }
        jugadorActivo = await PlayersRepository.crearJugador(Object.fromEntries(datos));
        await Sesion.iniciar(jugadorActivo.id);
      }
      const resultado = await RegistrationsRepository.inscribir({
        playerId: jugadorActivo.id,
        torneoId: torneo.id,
        categoria: seleccion.value
      });
      if (!resultado.ok) {
        notificar(resultado.motivo);
        return;
      }
      notificar('Inscripción registrada · estado pendiente.');
      window.location.hash = '#/mis-inscripciones';
    });
  }
};
