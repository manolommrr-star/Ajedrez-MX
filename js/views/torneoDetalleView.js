/**
 * Vista detalle de un torneo (Etapa 3: reconoce la inscripción del jugador).
 */
import { TournamentRepository } from '../repositories/tournamentRepository.js';
import { RegistrationsRepository } from '../core/registrationsRepository.js';
import { Sesion } from '../core/sesion.js';
import { detalleTorneo, notificar } from '../ui/components.js';

const PLANTILLA_NO_ENCONTRADO = `
<section class="detalle-contenedor">
  <h1 class="panel-titulo">Torneo no encontrado</h1>
  <p class="aviso">El torneo no existe o ya no está disponible.</p>
  <a class="boton boton-primario" href="#/">Volver al catálogo</a>
</section>`;

export const TorneoDetalleView = {
  async render(contenedor, id) {
    let torneo = null;
    try {
      torneo = await TournamentRepository.getById(id);
    } catch {
      notificar('No fue posible cargar el torneo.');
    }

    if (!torneo) {
      contenedor.innerHTML = PLANTILLA_NO_ENCONTRADO;
      return;
    }

    // Si el jugador con sesión ya está inscrito, el detalle lo muestra.
    let inscripcion = null;
    try {
      const jugador = await Sesion.getJugador();
      if (jugador) {
        inscripcion = (await RegistrationsRepository.getPorJugador(jugador.id))
          .find((r) => r.torneoId === id) || null;
      }
    } catch {
      inscripcion = null; // sin sesión activa
    }

    contenedor.innerHTML = detalleTorneo(torneo, { inscripcion });
  }
};