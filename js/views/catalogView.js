/**
 * Vista catálogo (página principal).
 * Hero con buscador, filtros (ciudad y modalidad), secciones de inicio
 * (destacados, cercanos, próximos) y panel de resultados de búsqueda.
 */
import { TournamentRepository } from '../repositories/tournamentRepository.js';
import { tarjetaTorneo, notificar } from '../ui/components.js';
import { Formatters } from '../utils/formatters.js';
import { AppConfig } from '../config.js';

const PLANTILLA_HERO = `
<section class="hero">
  <div class="hero-interior">
    <h1 id="titulo-hero" class="hero-titulo">Encuentra tu próximo torneo de ajedrez</h1>
    <p class="hero-subtitulo">Busca, compara e inscríbete en torneos de ajedrez en México.</p>

    <form id="formulario-busqueda" class="formulario-busqueda" role="search">
      <div class="busqueda-fila">
        <label class="sr-only" for="campo-busqueda">Buscar torneos por nombre, ciudad o estado</label>
        <input type="search" id="campo-busqueda" class="campo-busqueda"
               placeholder="Busca por nombre, ciudad o estado…" autocomplete="off">
        <button type="submit" class="boton boton-dorado">Buscar</button>
      </div>
      <div class="filtros-fila">
        <label class="filtro">
          <span class="filtro-etiqueta">Ciudad</span>
          <select id="filtro-ciudad" class="filtro-select"></select>
        </label>
        <label class="filtro">
          <span class="filtro-etiqueta">Modalidad</span>
          <select id="filtro-modalidad" class="filtro-select"></select>
        </label>
        <button type="button" id="boton-limpiar-filtros" class="boton boton-texto">Limpiar filtros</button>
      </div>
    </form>
  </div>
</section>`;

const PLANTILLA_SECCIONES = `
<section class="catalogo-cuerpo">
  <div class="catalogo-interior">
    <section class="seccion" id="seccion-destacados"></section>
    <section class="seccion" id="seccion-cercanos"></section>
    <section class="seccion" id="seccion-proximos"></section>
    <section class="seccion" id="seccion-resultados" hidden>
      <h2 class="seccion-titulo">Resultados <span id="contador-resultados"></span></h2>
      <p class="aviso" id="aviso-vacio" hidden>No encontramos torneos con esos criterios.</p>
      <div id="rejilla-resultados" class="rejilla-torneos"></div>
    </section>
  </div>
</section>`;

let filtrosActuales = { textoTorneo: '', ciudad: '', modalidad: '' };
let seccionesPobladas = [];
let temporizadorBusqueda = null;

function filtrosActivos() {
  return (
    filtrosActuales.textoTorneo.trim() !== '' ||
    filtrosActuales.ciudad !== '' ||
    filtrosActuales.modalidad !== ''
  );
}

function conRetraso(ms, accion) {
  clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = setTimeout(accion, ms);
}

export const CatalogView = {
  async render(contenedor) {
    let torneos = [];
    try {
      torneos = await TournamentRepository.getAll();
    } catch {
      notificar('No fue posible cargar los torneos. Inténtalo de nuevo.');
    }

    filtrosActuales = { textoTorneo: '', ciudad: '', modalidad: '' };
    seccionesPobladas = [];

    contenedor.innerHTML = PLANTILLA_HERO + PLANTILLA_SECCIONES;
    this.poblarOpcionesFiltros(torneos);
    this.poblarSeccionesInicio(torneos);
    this.registrarEventos();
  },

  /** Llena los desplegables de ciudad y modalidad con valores reales. */
  poblarOpcionesFiltros(torneos) {
    const ciudades = [...new Set(torneos.map((t) => t.ciudad))].sort();
    const modalidades = [...new Set(torneos.map((t) => t.modalidad))].sort();

    document.getElementById('filtro-ciudad').innerHTML =
      '<option value="">Todas las ciudades</option>' +
      ciudades.map((c) => `<option value="${c}">${c}</option>`).join('');

    document.getElementById('filtro-modalidad').innerHTML =
      '<option value="">Todas las modalidades</option>' +
      modalidades.map((m) => `<option value="${m}">${m}</option>`).join('');
  },

  /** Dibuja las secciones del inicio (oculta las que no tengan torneos). */
  poblarSeccionesInicio(torneos) {
    this.poblarSeccion('seccion-destacados', 'Torneos destacados', torneos.filter((t) => t.destacado).slice(0, 4));
    this.poblarSeccion('seccion-cercanos', 'Torneos cercanos', this.cercanos(torneos));
    this.poblarSeccion('seccion-proximos', 'Próximos torneos', torneos.slice(0, 8));
  },

  /** Torneos que se juegan dentro de los próximos N días (config). */
  cercanos(torneos) {
    const limite = AppConfig.rangoCercanosDias;
    return torneos
      .filter((t) => {
        const dias = Formatters.diasHasta(t.fecha);
        return dias >= 0 && dias <= limite;
      })
      .slice(0, 4);
  },

  poblarSeccion(idSeccion, titulo, torneos) {
    const seccion = document.getElementById(idSeccion);
    if (!torneos.length) {
      seccion.hidden = true;
      return;
    }
    seccion.hidden = false;
    seccionesPobladas.push(idSeccion);
    seccion.innerHTML =
      `<h2 class="seccion-titulo">${titulo}</h2>` +
      `<div class="rejilla-torneos">${torneos.map(tarjetaTorneo).join('')}</div>`;
  },

  registrarEventos() {
    const formulario = document.getElementById('formulario-busqueda');
    const campo = document.getElementById('campo-busqueda');
    const selectCiudad = document.getElementById('filtro-ciudad');
    const selectModalidad = document.getElementById('filtro-modalidad');
    const botonLimpiar = document.getElementById('boton-limpiar-filtros');

    formulario.addEventListener('submit', (e) => {
      e.preventDefault();
      aplicarFiltros();
    });

    campo.addEventListener('input', () => {
      filtrosActuales.textoTorneo = campo.value;
      conRetraso(250, aplicarFiltros);
    });

    selectCiudad.addEventListener('change', () => {
      filtrosActuales.ciudad = selectCiudad.value;
      aplicarFiltros();
    });

    selectModalidad.addEventListener('change', () => {
      filtrosActuales.modalidad = selectModalidad.value;
      aplicarFiltros();
    });

    botonLimpiar.addEventListener('click', limpiarFiltros);
  }
};

function limpiarFiltros() {
  filtrosActuales = { textoTorneo: '', ciudad: '', modalidad: '' };
  document.getElementById('campo-busqueda').value = '';
  document.getElementById('filtro-ciudad').value = '';
  document.getElementById('filtro-modalidad').value = '';
  aplicarFiltros();
}

/** Actualiza la zona de resultados y las secciones de inicio. */
async function aplicarFiltros() {
  const seccionResultados = document.getElementById('seccion-resultados');
  const activos = filtrosActivos();

  // En estado normal se ven las secciones del inicio.
  for (const id of seccionesPobladas) {
    document.getElementById(id).hidden = activos;
  }

  if (!activos) {
    seccionResultados.hidden = true;
    return;
  }

  let torneos = [];
  try {
    torneos = await TournamentRepository.search(filtrosActuales);
  } catch {
    notificar('No fue posible realizar la búsqueda. Inténtalo de nuevo.');
  }

  const hayResultados = torneos.length > 0;
  seccionResultados.hidden = false;
  document.getElementById('contador-resultados').textContent = hayResultados ? `(${torneos.length})` : '';
  document.getElementById('aviso-vacio').hidden = hayResultados;
  document.getElementById('rejilla-resultados').innerHTML = hayResultados
    ? torneos.map(tarjetaTorneo).join('')
    : '';
}