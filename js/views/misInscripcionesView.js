/**
 * Vista "Mis inscripciones" del jugador (Etapa 3).
 * Ruta: #/mis-inscripciones
 *
 * Lista las inscripciones del jugador con sesión (JOIN registrations ×
 * tournaments vía core) y permite cancelar solo en estados tempranos.
 */
import { RegistrationsRepository } from '../core/registrationsRepository.js';
import { Sesion } from '../core/sesion.js';
import { escapar, notificar, insignia, tablaHtml } from '../ui/components.js';
import { Formatters } from '../utils/formatters.js';

export const MisInscripcionesView = {
  async render(contenedor) {
    const jugador = await Sesion.getJugador();
    if (!jugador) {
      contenedor.innerHTML = `
        <section class="detalle-contenedor">
          <h1 class="panel-titulo">Mis inscripciones</h1>
          <p class="aviso">Aún no hay una sesión de jugador. Usa "Iniciar sesión" en el encabezado (demo) o inscríbete a un torneo desde el <a href="#/">catálogo</a>.</p>
        </section>`;
      return;
    }

    const inscripciones = (await RegistrationsRepository.getPorJugador(jugador.id))
      .slice()
      .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));

    const filas = [];
    for (const inscripcion of inscripciones) {
      const torneo = await RegistrationsRepository.getInfoTorneo(inscripcion.torneoId);
      const cancelable = inscripcion.estado === 'pendiente' || inscripcion.estado === 'pago_pendiente';
      filas.push([
        `<strong>${escapar(torneo ? torneo.nombre : inscripcion.torneoId)}</strong>`,
        torneo ? escapar(Formatters.fechaLarga(torneo.fecha)) : '-',
        escapar(inscripcion.categoria),
        Formatters.precio(inscripcion.precio),
        insignia(inscripcion.estado),
        escapar(Formatters.fechaLarga(inscripcion.fechaCreacion)),
        cancelable
          ? `<button type="button" class="boton boton-texto" data-cancelar="${escapar(inscripcion.id)}">Cancelar</button>`
          : '-'
      ]);
    }

    const cuerpo = filas.length
      ? tablaHtml(['Torneo', 'Fecha', 'Categoría', 'Cuota', 'Estado', 'Inscrito', 'Acciones'], filas)
      : '<p class="aviso">Aún no tienes inscripciones. <a href="#/">Explorar torneos</a></p>';

    contenedor.innerHTML = `
      <section class="detalle-contenedor">
        <h1 class="panel-titulo">Mis inscripciones</h1>
        <p class="panel-descripcion">Jugador: <strong>${escapar(`${jugador.apellidos} ${jugador.nombre}`)}</strong>.</p>
        ${cuerpo}
      </section>`;

    contenedor.querySelectorAll('[data-cancelar]').forEach((boton) => {
      boton.addEventListener('click', async () => {
        const ok = await RegistrationsRepository.cancelarDeJugador(boton.dataset.cancelar, jugador.id);
        notificar(ok ? 'Inscripción cancelada.' : 'No fue posible cancelar la inscripción.');
        if (ok) MisInscripcionesView.render(contenedor);
      });
    });
  }
};