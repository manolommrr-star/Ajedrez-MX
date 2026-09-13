/**
 * Punto de entrada de la aplicación (Etapa 4 · cuentas con rol).
 *
 * Enrutado por hash (sin librerías):
 *   #/                        → catálogo
 *   #/torneo/:id              → detalle de torneo
 *   #/torneo/:id/inscribirse  → formulario de inscripción (jugador)
 *   #/mis-inscripciones       → inscripciones del jugador
 *   #/registro                → crear cuenta (jugador u organizador)
 *   #/acceder                 → iniciar sesión
 *   #/panel[/...]             → panel de organizador
 */
import { CatalogView } from './views/catalogView.js';
import { TorneoDetalleView } from './views/torneoDetalleView.js';
import { InscripcionView } from './views/inscripcionView.js';
import { MisInscripcionesView } from './views/misInscripcionesView.js';
import { RegistroView } from './views/registroView.js';
import { AccederView } from './views/accederView.js';
import { PanelOrganizadorView } from './views/panelOrganizadorView.js';
import { CobrarView } from './views/cobrarView.js';
import { Sesion } from './core/sesion.js';
import { notificar } from './ui/components.js';

const contenedor = document.getElementById('contenido');
const navPrincipal = document.querySelector('.nav-principal');

function rutaActual() {
  return window.location.hash || '#/';
}

/** Encabezado según la cuenta con sesión (Etapa 4). */
async function actualizarEncabezado() {
  const cuenta = await Sesion.getCuenta();
  if (cuenta && cuenta.rol === 'organizer') {
    navPrincipal.innerHTML = `
      <a href="#/panel" class="boton boton-secundario">Mi panel</a>
      <button type="button" id="boton-cerrar-sesion" class="boton boton-primario">Cerrar sesión</button>`;
  } else if (cuenta && cuenta.rol === 'player') {
    navPrincipal.innerHTML = `
      <a href="#/mis-inscripciones" class="boton boton-secundario">Mis inscripciones</a>
      <button type="button" id="boton-cerrar-sesion" class="boton boton-primario">Cerrar sesión</button>`;
  } else {
    navPrincipal.innerHTML = `
      <a href="#/registro" class="boton boton-secundario">Crear cuenta</a>
      <button type="button" id="boton-acceder" class="boton boton-primario">Acceder</button>`;
  }
  const botonCerrar = navPrincipal.querySelector('#boton-cerrar-sesion');
  if (botonCerrar) {
    botonCerrar.addEventListener('click', async () => {
      Sesion.cerrar();
      notificar('Sesión cerrada.');
      await manejarRuta();
    });
  }
  const botonAcceder = navPrincipal.querySelector('#boton-acceder');
  if (botonAcceder) {
    botonAcceder.addEventListener('click', () => {
      window.location.hash = '#/acceder';
    });
  }
}

async function manejarRuta() {
  const ruta = rutaActual();

  if (ruta.startsWith('#/torneo/') && ruta.endsWith('/inscribirse')) {
    const id = decodeURIComponent(ruta.substring('#/torneo/'.length, ruta.length - '/inscribirse'.length));
    await InscripcionView.renderFormulario(contenedor, id);
  } else if (ruta === '#/mis-inscripciones') {
    await MisInscripcionesView.render(contenedor);
  } else if (ruta === '#/registro') {
    await RegistroView.render(contenedor);
  } else if (ruta === '#/acceder') {
    await AccederView.render(contenedor);
  } else if (ruta.startsWith('#/torneo/')) {
    const id = decodeURIComponent(ruta.substring('#/torneo/'.length));
    await TorneoDetalleView.render(contenedor, id);
  } else if (ruta.startsWith('#/pagar/')) {
    const folio = decodeURIComponent(ruta.substring('#/pagar/'.length));
    await CobrarView.render(contenedor, ruta);
  } else if (ruta === '#/panel/cobrar') {
    await CobrarView.render(contenedor, ruta);
  } else if (ruta.startsWith('#/publicar') || ruta.startsWith('#/panel')) {
    // 'publicar' se mantiene como alias para compatibilidad.
    // Publicar y gestionar torneos es exclusivo del rol organizador (Etapa 4).
    const cuenta = await Sesion.getCuenta();
    if (cuenta && cuenta.rol === 'organizer') {
      PanelOrganizadorView.render(contenedor, ruta);
    } else if (cuenta) {
      contenedor.innerHTML = `
        <section class="detalle-contenedor">
          <h1 class="panel-titulo">Zona de organizadores</h1>
          <p class="aviso">Estás navegando como jugador. Para publicar y gestionar torneos necesitas una cuenta de organizador.</p>
          <div class="panel-acciones" style="justify-content:flex-start">
            <a class="boton boton-primario" href="#/mis-inscripciones">Mis inscripciones</a>
            <a class="boton boton-secundario" href="#/registro">Crear cuenta de organizador</a>
          </div>
        </section>`;
    } else {
      contenedor.innerHTML = `
        <section class="detalle-contenedor">
          <h1 class="panel-titulo">Zona de organizadores</h1>
          <p class="aviso">Publicar y gestionar torneos requiere una cuenta de organizador. Puedes explorar el panel con la cuenta demo del club (contacto@ajedrezxalapa.mx · contraseña demo1234).</p>
          <div class="panel-acciones" style="justify-content:flex-start">
            <a class="boton boton-primario" href="#/acceder">Acceder</a>
            <a class="boton boton-secundario" href="#/registro">Crear cuenta de organizador</a>
          </div>
        </section>`;
    }
  } else {
    await CatalogView.render(contenedor);
  }

  await actualizarEncabezado();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', manejarRuta);

// Los módulos se ejecutan después de parsear el HTML,
// por lo que podemos lanzar la primera ruta directamente.
manejarRuta();