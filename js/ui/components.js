/**
 * Constructores de HTML y utilidades visuales reutilizables.
 *
 * - tarjetaTorneo()  → tarjeta del catálogo
 * - rejillaTorneos() → contenedor grid con N tarjetas
 * - detalleTorneo()  → página de detalle de un torneo
 * - insignia()       → etiqueta de estado (inscripción, pago, publicación)
 * - tablaHtml()      → tabla accesible del panel/listados
 * - notificar()      → toast breve (se usa también desde app.js)
 *
 * Nota de seguridad: los datos provienen de Firestore en el futuro
 * (creados por organizadores), por eso todo texto dinámico se escapa
 * con escapar() antes de insertarse en el HTML.
 */
import { Formatters } from '../utils/formatters.js';

/** Gradientes con tono de tablero para cuando el torneo no tiene foto. */
const GRADIENTES = [
  'linear-gradient(155deg, #164a28 0%, #0c2a14 55%, #1c5a30 100%)',
  'linear-gradient(155deg, #1d3a5f 0%, #12243d 55%, #24476f 100%)',
  'linear-gradient(155deg, #4a1f0f 0%, #2e1208 55%, #5a2a14 100%)'
];

let temporizadorToast = null;

/** Muestra un aviso breve en la parte inferior de la pantalla. */
export function notificar(mensaje) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = mensaje;
  toast.hidden = false;
  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(() => { toast.hidden = true; }, 3500);
}

/** Escapa texto dinámico antes de insertarlo en HTML (protege XSS). */
export function escapar(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Clases de insignia por estado (inscripción, pago, publicación). */
export const CLASES_INSIGNIA = {
  pagado: 'insignia-exito', publicado: 'insignia-exito',
  confirmada: 'insignia-exito', checkin: 'insignia-exito',
  procesando: 'insignia-info', pago_en_revision: 'insignia-info',
  borrador: 'insignia-info', reembolsado: 'insignia-info', retirada: 'insignia-info',
  pendiente: 'insignia-pendiente', pago_pendiente: 'insignia-pendiente',
  cancelado: 'insignia-peligro', cancelada: 'insignia-peligro', rechazada: 'insignia-peligro'
};

/** Etiqueta visual de un estado (la clase vive en ui/components). */
export function insignia(texto) {
  const clase = CLASES_INSIGNIA[texto] || 'insignia-info';
  return `<span class="insignia ${clase}">${escapar(texto)}</span>`;
}

/** Tabla accesible de listados: las celdas pueden traer HTML de confianza. */
export function tablaHtml(cabeceras, filas) {
  const th = cabeceras.map((h) => `<th scope="col">${escapar(h)}</th>`).join('');
  const tr = filas.map((fila) =>
    `<tr>${fila.map((celda, i) => `<td data-col="${escapar(cabeceras[i])}">${celda}</td>`).join('')}</tr>`
  ).join('');
  return `<table class="tabla-panel"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

/** Índice estable por id para variar la imagen de las tarjetas. */
function indiceEstable(id) {
  let suma = 0;
  for (const ch of String(id)) suma += ch.codePointAt(0);
  return suma % GRADIENTES.length;
}

/** Precio mínimo de las categorías del torneo. */
function precioDesde(torneo) {
  return Math.min(...torneo.categorias.map((c) => c.precio));
}

/** '72 / 100 lugares' */
function textoLugares(torneo) {
  return `${torneo.inscritos} / ${torneo.cupo} lugares`;
}

/** Etiqueta opcional que se superpone a la imagen de la tarjeta. */
function etiquetaTorneo(torneo) {
  if (torneo.inscritos >= torneo.cupo) {
    return '<span class="etiqueta etiqueta-completo">Completo</span>';
  }
  if (torneo.destacado) {
    return '<span class="etiqueta etiqueta-destacado">Destacado</span>';
  }
  return '';
}

/** Tarjeta de torneo para el catálogo. */
export function tarjetaTorneo(torneo) {
  const enlace = `#/torneo/${encodeURIComponent(torneo.id)}`;
  const precioTexto =
    torneo.categorias.length > 1
      ? `Desde ${Formatters.precio(precioDesde(torneo))}`
      : Formatters.precio(precioDesde(torneo));

  return `
  <article class="tarjeta-torneo">
    <a class="tarjeta-imagen" href="${enlace}" style="background-image: ${GRADIENTES[indiceEstable(torneo.id)]}" tabindex="-1" aria-hidden="true">
      <span class="tarjeta-simbolo">♞</span>
      ${etiquetaTorneo(torneo)}
    </a>
    <div class="tarjeta-cuerpo">
      <h3 class="tarjeta-titulo"><a href="${enlace}">${escapar(torneo.nombre)}</a></h3>
      <div class="tarjeta-meta">
        <p class="tarjeta-fecha">${Formatters.fechaLarga(torneo.fecha)} · ${escapar(torneo.hora)} h</p>
        <p class="tarjeta-ubicacion">${escapar(torneo.ciudad)}, ${escapar(torneo.estado)}</p>
      </div>
      <p class="tarjeta-modalidad">${escapar(torneo.modalidad)} · ${escapar(torneo.sistema)} · ${Formatters.plural(torneo.rondas, 'ronda', 'rondas')}</p>
      <div class="tarjeta-pie">
        <p class="tarjeta-precio">${precioTexto}</p>
        <p class="tarjeta-lugares">${textoLugares(torneo)}</p>
        <a class="boton boton-primario" href="${enlace}">Ver torneo</a>
      </div>
    </div>
  </article>`;
}

/** Rejilla responsiva con las tarjetas dadas. */
export function rejillaTorneos(torneos) {
  return `<div class="rejilla-torneos">${torneos.map(tarjetaTorneo).join('')}</div>`;
}
/** Página de detalle de un torneo.
 *  `opciones.inscripcion` = inscripción del jugador con sesión (o null). */
export function detalleTorneo(t, { inscripcion = null } = {}) {
  const completo = t.inscritos >= t.cupo;

  const categoriasHtml = t.categorias
    .map((c) =>
      `<li class="categoria-fila"><span>${escapar(c.nombre)}</span><strong>${Formatters.precio(c.precio)}</strong></li>`
    )
    .join('');

  const caracteristicas = [
    ['Modalidad', t.modalidad],
    ['Sistema', t.sistema],
    ['Rondas', Formatters.plural(t.rondas, 'ronda', 'rondas')],
    ['Ritmo de juego', t.ritmo],
    ['Sede', t.sede],
    ['Dirección', t.direccion],
    ['Ciudad / Estado', `${t.ciudad}, ${t.estado}`]
  ]
    .map(([clave, valor]) =>
      `<dt>${escapar(clave)}</dt><dd>${escapar(valor)}</dd>`
    )
    .join('');

  const organizadorHtml = t.organizador
    ? `<h2 class="detalle-subtitulo">Organizador</h2>
       <p>${escapar(t.organizador.nombre)}${t.organizador.email ? ` · ${escapar(t.organizador.email)}` : ''}</p>`
    : '';

  const reglamentoHtml = t.reglamentoUrl
    ? `<h2 class="detalle-subtitulo">Reglamento</h2>
       <p><a class="enlace" href="${escapar(t.reglamentoUrl)}" target="_blank" rel="noopener">Descargar reglamento (PDF)</a></p>`
    : '';

  // Chess-Results es solo una referencia externa: si el torneo tiene URL,
  // se muestra el bloque "Resultados oficiales" que enlaza a la publicación.
  const resultadosHtml = t.chessResultsUrl
    ? `<h2 class="detalle-subtitulo">Resultados oficiales</h2>
       <p>La clasificacion y los resultados oficiales se publican en Chess-Results.</p>
       <p><a class="boton boton-secundario" href="${escapar(t.chessResultsUrl)}" target="_blank" rel="noopener">Ver resultados en Chess-Results</a></p>`
    : '';

  return `
  <section class="detalle-contenedor">
    <a href="#/" class="enlace-volver">← Volver al catálogo</a>

    <div class="detalle-banner" style="background-image: ${GRADIENTES[indiceEstable(t.id)]}">
      <div class="detalle-banner-texto">
        <h1>${escapar(t.nombre)}</h1>
        <p class="detalle-banner-fecha">${Formatters.fechaCompleta(t.fecha)} · ${escapar(t.hora)} h</p>
        <p class="detalle-banner-ubicacion">${escapar(t.ciudad)}, ${escapar(t.estado)}</p>
      </div>
    </div>

    <div class="detalle-cuerpo">
      <div class="detalle-info">
        <h2 class="detalle-subtitulo">Sobre el torneo</h2>
        <p class="detalle-descripcion">${escapar(t.descripcion)}</p>

        <h2 class="detalle-subtitulo">Características</h2>
        <dl class="detalle-caracteristicas">${caracteristicas}</dl>

        ${organizadorHtml}
        ${reglamentoHtml}
        ${resultadosHtml}
      </div>

      <aside class="detalle-inscripcion">
        <h2 class="detalle-subtitulo">Inscripciones</h2>
        <ul class="lista-categorias">${categoriasHtml}</ul>
        <p class="detalle-lugares">${textoLugares(t)}${completo ? ' · Completo' : ''}</p>
        ${inscripcion
          ? `<p class="detalle-lugares">Ya estás inscrito · estado: ${insignia(inscripcion.estado)}</p>
             <a class="boton boton-secundario boton-bloque" href="#/mis-inscripciones">Ver mis inscripciones</a>`
          : (completo
            ? '<button type="button" class="boton boton-dorado boton-bloque" disabled>Inscribirme</button>'
            : `<a class="boton boton-dorado boton-bloque" href="#/torneo/${encodeURIComponent(t.id)}/inscribirse">Inscribirme</a>`)}
        <p class="detalle-nota">Tu inscripción queda en estado pendiente; el pago se confirma con el organizador.</p>
      </aside>
    </div>
  </section>`;
}