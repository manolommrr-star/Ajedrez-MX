/**
 * Vista del panel de organizador - Dashboard con sidebar.
 * Rutas: #/panel, #/panel/eventos, #/panel/evento/:id, #/panel/torneos,
 * #/panel/crear, #/panel/torneo/:id/editar, #/panel/torneo/:id/inscripciones,
 * #/panel/torneo/:id/participantes, #/panel/torneo/:id/checkin, #/panel/checkin,
 * #/panel/qr, #/panel/pagos, #/panel/reportes.
 *
 * Mobile: sidebar se abre con botón hamburguesa.
 * Desktop: sidebar fijo a la izquierda.
 */
import { OrganizadorRepository } from '../repositories/organizadorRepository.js';
import { RegistrationsRepository } from '../core/registrationsRepository.js';
import { PlayersRepository } from '../core/playersRepository.js';
import { PaymentsRepository } from '../core/paymentsRepository.js';
import { SwissManagerExport } from '../integrations/swissManagerExport.js';
import { ChessResultsLinks } from '../integrations/chessResultsLinks.js';
import { escapar, notificar, insignia, tablaHtml } from '../ui/components.js';
import { Formatters } from '../utils/formatters.js';
import { Sesion } from '../core/sesion.js';

let ORGANIZADOR = null;

const SECCIONES = [
  ['resumen', 'Resumen', '#/panel'],
  ['torneos', 'Mis torneos', '#/panel/torneos'],
  ['crear', 'Crear torneo', '#/panel/crear'],
  ['cobrar', 'Cobrar', '#/panel/cobrar'],
  ['eventos', 'Eventos', '#/panel/eventos'],
  ['pagos', 'Pagos', '#/panel/pagos'],
  ['checkin', 'Check-in', '#/panel/checkin'],
  ['qr', 'Validacion QR', '#/panel/qr'],
  ['reportes', 'Reportes', '#/panel/reportes']
];

function tituloSeccion(clave) {
  const seccion = SECCIONES.find(([c]) => c === clave);
  return seccion ? seccion[1] : 'Panel';
}

function sidebar(claveActiva) {
  const enlaces = SECCIONES.map(([clave, texto, href]) =>
    `<a class="sidebar-enlace${clave === claveActiva ? ' activo' : ''}" href="${href}" data-nav>${texto}</a>`
  ).join('');
  return `
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-cabeza">
      <a class="sidebar-logo" href="#/">Ajedrez</a>
      <button class="sidebar-cerrar" id="sidebar-cerrar" aria-label="Cerrar menu">X</button>
    </div>
    <nav class="sidebar-nav">
      ${enlaces}
    </nav>
    <div class="sidebar-pie">
      <p class="sidebar-usuario">${escapar(ORGANIZADOR.nombre)}</p>
      <button class="sidebar-salir" id="btn-salir">Cerrar sesion</button>
    </div>
  </aside>`;
}

function plantillaPanel(contenido, claveActiva) {
  return `
  <div class="dashboard">
    ${sidebar(claveActiva)}
    <main class="dashboard-main">
      <header class="dashboard-topbar">
        <button class="btn-hamburguesa" id="btn-hamburguesa" aria-label="Abrir menu">=</button>
        <span class="dashboard-titulo">${escapar(tituloSeccion(claveActiva))}</span>
        <span class="dashboard-usuario">${escapar(ORGANIZADOR.nombre)}</span>
      </header>
      <div class="dashboard-contenido">
        ${contenido}
      </div>
    </main>
  </div>`;
}

function qrDemoSvg() {
  const n = 29;
  let semilla = 7;
  const aleatorio = () => {
    semilla = (semilla * 1664525 + 1013904223) & 0xffffffff;
    return (semilla & 1) === 1;
  };
  const enMarcador = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  let modulos = '';
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      if (!enMarcador(x, y) && aleatorio()) modulos += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  }
  const marcador = (cx, cy) =>
    `<rect x="${cx}" y="${cy}" width="7" height="7" fill="none" stroke="#0c3318" stroke-width="1"/>` +
    `<rect x="${cx + 1}" y="${cy + 1}" width="5" height="5" fill="#14532d"/>` +
    `<rect x="${cx + 2}" y="${cy + 2}" width="3" height="3" fill="#f4f2ec"/>`;
  return `<svg class="qr-demo" viewBox="0 0 ${n} ${n}" role="img" aria-label="QR demo">`
    + `${marcador(0, 0)}${marcador(n - 7, 0)}${marcador(0, n - 7)}`
    + `<g fill="#14532d">${modulos}</g></svg>`;
}

function filaTorneo(t) {
  const pct = t.cupo > 0 ? Math.round((t.inscritos / t.cupo) * 100) : 0;
  return `
  <div class="fila-torneo">
    <div class="fila-torneo-info">
      <p class="fila-torneo-nombre"><a class="enlace" href="#/torneo/${encodeURIComponent(t.id)}">${escapar(t.nombre)}</a></p>
      <p class="fila-torneo-fecha">${Formatters.fechaLarga(t.fecha)} - ${escapar(t.ciudad)}, ${escapar(t.estado)}</p>
    </div>
    ${insignia(t.estadoPublicacion)}
    <div class="barra-progreso"><i style="width:${pct}%"></i></div>
    <p class="fila-torneo-lugares">${t.inscritos} / ${t.cupo} lugares</p>
  </div>`;
}

function filaEvento(e) {
  return `
  <div class="fila-torneo">
    <div class="fila-torneo-info">
      <p class="fila-torneo-nombre"><a class="enlace" href="#/panel/evento/${encodeURIComponent(e.id)}">${escapar(e.nombre)}</a></p>
      <p class="fila-torneo-fecha">${Formatters.fechaLarga(e.fechaInicio)} - ${Formatters.fechaLarga(e.fechaFin)} - ${escapar(e.ciudad)}, ${escapar(e.estado)}</p>
    </div>
    ${insignia(e.estadoPublicacion)}
  </div>`;
}

function renderNoEncontrada() {
  return `
    <h1 class="panel-titulo-pagina">No encontrado</h1>
    <p class="aviso">El recurso solicitado no existe o no pertenece a tu organizacion.</p>
    <a class="boton boton-primario" href="#/panel">Volver al resumen</a>`;
}
async function renderResumen() {
  const resumen = await OrganizadorRepository.getResumen();
  const torneos = await OrganizadorRepository.getTorneos();
  const pagos = await OrganizadorRepository.getPagos();
  const tarjetas = [
    ['Inscripciones', resumen.totalInscripciones],
    ['Ocupacion', `${resumen.inscritos} / ${resumen.cupo}`],
    ['Ingresos cobrados', Formatters.precio(resumen.ingresosCobrados)],
    ['Pendientes de pago', resumen.pendientesPago]
  ].map(([etiqueta, valor]) =>
    `<div class="stat">
       <span class="stat-valor">${valor}</span>
       <span class="stat-etiqueta">${etiqueta}</span>
     </div>`
  ).join('');
  const filas = pagos.slice(0, 5).map((p) => [
    p.folio, escapar(p.torneo), escapar(p.jugador),
    Formatters.precio(p.monto), insignia(p.estado), Formatters.fechaLarga(p.fecha)
  ]);
  return `
    <h1 class="titulo-pagina">Resumen</h1>
    <p class="subtitulo-pagina">Bienvenido, ${escapar(ORGANIZADOR.nombre)}</p>
    <div class="stats-grid">${tarjetas}</div>
    <div class="acciones-rapidas">
      <a class="btn-accion" href="#/panel/crear">Crear torneo</a>
      <a class="btn-accion" href="#/panel/eventos">Eventos</a>
      <a class="btn-accion" href="#/panel/pagos">Pagos</a>
    </div>
    <h2 class="seccion-titulo">Mis torneos</h2>
    <div class="lista-torneos">${torneos.map(filaTorneo).join('')}</div>
    <h2 class="seccion-titulo">Ultimos pagos</h2>
    ${tablaHtml(['Folio', 'Torneo', 'Jugador', 'Monto', 'Estado', 'Fecha'], filas)}
    <p class="enlace-mas"><a href="#/panel/pagos">Ver todos los pagos</a></p>`;
}

async function renderEventos() {
  const eventos = await OrganizadorRepository.getEventos();
  const cuerpo = eventos.length
    ? `<div class="lista-torneos">${eventos.map(filaEvento).join('')}</div>`
    : '<p class="aviso">Aun no tienes eventos.</p>';
  return `
    <h1 class="titulo-pagina">Eventos</h1>
    <p class="subtitulo-pagina">Agrupa tus torneos en un mismo evento.</p>
    <form id="formulario-evento" class="form-inline">
      <input id="campo-nuevo-evento" class="input" placeholder="Nombre del nuevo evento...">
      <button type="submit" class="btn btn-primario">Nuevo evento</button>
    </form>
    ${cuerpo}`;
}

async function renderFichaEvento(eventoId) {
  const evento = await OrganizadorRepository.getEventoPorId(eventoId);
  if (!evento) return renderNoEncontrada();
  const torneos = await OrganizadorRepository.getTorneosDeEvento(eventoId);
  const filas = torneos.map((t) => [
    `<strong>${escapar(t.nombre)}</strong><br><span class="celda-note">${escapar(t.grupo || '-')}</span>`,
    Formatters.fechaLarga(t.fecha),
    `${t.inscritos} / ${t.cupo}`,
    insignia(t.estadoPublicacion),
    `<a class="btn btn-texto" href="#/panel/torneo/${encodeURIComponent(t.id)}/inscripciones">Inscripciones</a>`
      + `<a class="btn btn-texto" href="#/panel/torneo/${encodeURIComponent(t.id)}/participantes">Participantes</a>`
  ]);
  return `
    <a class="enlace-volver" href="#/panel/eventos">Eventos</a>
    <h1 class="titulo-pagina">${escapar(evento.nombre)}</h1>
    <p class="subtitulo-pagina">${escapar(evento.descripcion || '')}</p>
    <p class="subtitulo-pagina">${Formatters.fechaLarga(evento.fechaInicio)} - ${Formatters.fechaLarga(evento.fechaFin)} | ${escapar(evento.ciudad)}, ${escapar(evento.estado)}</p>
    ${tablaHtml(['Torneo', 'Fecha', 'Lugares', 'Estado', 'Acciones'], filas)}`;
}

async function renderTorneos() {
  const torneos = await OrganizadorRepository.getTorneos();
  const tarjetas = torneos.map((t) => {
    const pct = t.cupo > 0 ? Math.round((t.inscritos / t.cupo) * 100) : 0;
    const resultados = ChessResultsLinks.deTorneo(t);
    const publicar = t.estadoPublicacion === 'publicado'
      ? `<button type="button" class="chip" data-org-accion="despublicar" data-id="${escapar(t.id)}">Despublicar</button>`
      : t.estadoPublicacion === 'cancelado'
        ? `<button type="button" class="chip chip-dorado" data-org-accion="publicar" data-id="${escapar(t.id)}">Reactivar</button>`
        : `<button type="button" class="chip chip-dorado" data-org-accion="publicar" data-id="${escapar(t.id)}">Publicar</button>`;
    const cancelar = t.estadoPublicacion === 'cancelado' ? ''
      : `<button type="button" class="chip chip-peligro" data-org-accion="cancelar" data-id="${escapar(t.id)}">Cancelar</button>`;
    return `
      <article class="card-torneo">
        <div class="card-torneo-cabeza">
          <h3 class="card-torneo-nombre"><a class="enlace" href="#/torneo/${encodeURIComponent(t.id)}">${escapar(t.nombre)}</a></h3>
          ${insignia(t.estadoPublicacion)}
        </div>
        <p class="card-torneo-meta">${escapar(t.grupo || 'General')} | ${Formatters.fechaLarga(t.fecha)} | ${escapar(t.ciudad)}, ${escapar(t.estado)}</p>
        <div class="barra-progreso"><i style="width:${pct}%"></i></div>
        <p class="card-torneo-lugares">${t.inscritos} / ${t.cupo} lugares (${pct}%)</p>
        <div class="card-torneo-acciones">
          <a class="chip" href="#/panel/torneo/${encodeURIComponent(t.id)}/inscripciones">Inscripciones</a>
          <a class="chip" href="#/panel/torneo/${encodeURIComponent(t.id)}/participantes">Participantes</a>
          <a class="chip" href="#/panel/torneo/${encodeURIComponent(t.id)}/checkin">Check-in</a>
          <a class="chip" href="#/panel/torneo/${encodeURIComponent(t.id)}/editar">Editar</a>
          <button type="button" class="chip" data-org-accion="duplicar" data-id="${escapar(t.id)}">Duplicar</button>
          ${publicar}${cancelar}${resultados
            ? `<a class="chip" href="${escapar(resultados.url)}" target="_blank" rel="noopener">Resultados</a>` : ''}
        </div>
      </article>`;
  }).join('');
  return `
    <h1 class="titulo-pagina">Mis torneos</h1>
    <p class="subtitulo-pagina">Los resultados oficiales viven en Chess-Results; aqui solo se enlazan.</p>
    <a class="btn btn-primario btn-bloque" href="#/panel/crear" style="margin-bottom:1rem">Crear torneo</a>
    <div class="grid-tarjetas">${tarjetas || '<p class="aviso">Aun no tienes torneos. Crea el primero.</p>'}</div>`;
}

function accionesInscripcion(p) {
  const boton = (accion, texto) =>
    `<button type="button" class="btn btn-texto" data-accion="${accion}" data-reg="${escapar(p.id)}">${texto}</button>`;
  if (p.estado === 'pago_pendiente') {
    return boton('marcar-revision', 'Marcar en revision')
      + boton('validar-pago', 'Validar pago')
      + boton('cancelar', 'Cancelar');
  }
  if (p.estado === 'pago_en_revision') {
    return boton('validar-pago', 'Validar pago')
      + boton('rechazar', 'Rechazar');
  }
  if (p.estado === 'pagada') {
    return boton('confirmar', 'Confirmar')
      + boton('retirar', 'Retirar');
  }
  if (p.estado === 'confirmada') {
    return boton('checkin', 'Check-in')
      + boton('retirar', 'Retirar')
      + boton('cancelar', 'Cancelar');
  }
  if (p.estado === 'pendiente') {
    return boton('cancelar', 'Cancelar');
  }
  return '-';
}

async function renderInscripciones(torneoId) {
  const torneo = await OrganizadorRepository.getTorneoPorId(torneoId);
  if (!torneo) return renderNoEncontrada();
  const filas = (await OrganizadorRepository.getParticipantes(torneoId)).map((p) => [
    `<strong>${escapar(p.nombreJugador)}</strong>`,
    escapar(p.categoria), Formatters.precio(p.precio),
    insignia(p.estado), Formatters.fechaLarga(p.fechaCreacion), accionesInscripcion(p)
  ]);
  const pendientes = (await OrganizadorRepository.getParticipantes(torneoId))
    .filter((p) => p.estado === 'pago_pendiente' || p.estado === 'pago_en_revision').length;
  const opcionesJugador = (await PlayersRepository.buscar('')).map((j) =>
    `<option value="${escapar(j.id)}">${escapar(`${j.apellidos} ${j.nombre}`)}${j.elo ? ` (${j.elo})` : ''}</option>`
  ).join('');
  const opcionesCategoria = torneo.categorias.map((c) =>
    `<option value="${escapar(c.nombre)}" data-precio="${c.precio}">${escapar(c.nombre)} - ${Formatters.precio(c.precio)}</option>`
  ).join('');
  return `
    <a class="enlace-volver" href="#/panel/torneos">Mis torneos</a>
    <h1 class="titulo-pagina">Inscripciones - ${escapar(torneo.nombre)}</h1>
    <p class="subtitulo-pagina">Valida pagos, confirma jugadores y registra el check-in.${pendientes ? ` Tienes ${pendientes} pago(s) por revisar.` : ''}</p>
    <div class="acciones" style="margin-bottom:1rem">
      <a class="btn btn-secundario" href="#/panel/torneo/${encodeURIComponent(torneo.id)}/participantes">Ver participantes</a>
      <a class="btn btn-secundario" href="#/panel/torneo/${encodeURIComponent(torneo.id)}/checkin">Check-in del dia</a>
    </div>
    <form id="formulario-pago-manual" class="fieldset" style="margin-bottom:1.2rem">
      <h2 class="fieldset-titulo" style="margin-top:0">Registrar pago en efectivo</h2>
      <div class="campo-fila">
        <label class="campo"><span class="campo-etiqueta">Jugador</span>
          <select id="pago-jugador" class="input">${opcionesJugador}</select></label>
        <label class="campo"><span class="campo-etiqueta">Categoria</span>
          <select id="pago-categoria" class="input">${opcionesCategoria}</select></label>
      </div>
      <div class="acciones">
        <button type="submit" class="btn btn-primario">Registrar pago</button>
      </div>
    </form>
    ${tablaHtml(['Jugador', 'Categoria', 'Cuota', 'Estado', 'Fecha', 'Acciones'], filas)}`;
}

async function renderIndiceCheckin() {
  const torneos = (await OrganizadorRepository.getTorneos())
    .filter((t) => t.estadoPublicacion !== 'cancelado');
  const tarjetas = torneos.map((t) =>
    `<a class="btn btn-secundario" href="#/panel/torneo/${encodeURIComponent(t.id)}/checkin">${escapar(t.nombre)}</a>`
  ).join('');
  return `
    <h1 class="titulo-pagina">Check-in</h1>
    <p class="subtitulo-pagina">Elige el torneo para registrar la asistencia del dia.</p>
    <div class="acciones">${tarjetas || '<p class="aviso">No hay torneos disponibles.</p>'}</div>`;
}

async function renderCheckin(torneoId) {
  const torneo = await OrganizadorRepository.getTorneoPorId(torneoId);
  if (!torneo) return renderNoEncontrada();
  const participantes = await OrganizadorRepository.getParticipantes(torneoId);
  const elegibles = participantes.filter((p) => p.estado === 'confirmada' || p.estado === 'checkin');
  const hechos = participantes.filter((p) => p.estado === 'checkin').length;
  const filas = elegibles.map((p) => [
    `<strong>${escapar(p.nombreJugador)}</strong>`,
    escapar(p.categoria),
    insignia(p.estado),
    p.estado === 'confirmada'
      ? `<button type="button" class="btn btn-primario" data-accion="checkin" data-reg="${escapar(p.id)}">Registrar check-in</button>`
      : '<span class="celda-note">Presente</span>'
  ]);
  return `
    <a class="enlace-volver" href="#/panel/torneo/${encodeURIComponent(torneo.id)}/inscripciones">Inscripciones</a>
    <h1 class="titulo-pagina">Check-in - ${escapar(torneo.nombre)}</h1>
    <p class="subtitulo-pagina">${hechos} de ${elegibles.length} confirmados ya registraron asistencia.</p>
    <form id="formulario-checkin" class="form-inline">
      <input id="campo-buscar-checkin" class="input" placeholder="Buscar jugador...">
      <button type="submit" class="btn btn-dorado">Buscar</button>
    </form>
    ${tablaHtml(['Jugador', 'Categoria', 'Estado', 'Accion'], filas)}`;
}

async function renderParticipantes(torneoId) {
  const torneo = await OrganizadorRepository.getTorneoPorId(torneoId);
  if (!torneo) return renderNoEncontrada();
  const filas = (await OrganizadorRepository.getParticipantes(torneoId)).map((p) => [
    `<strong>${escapar(p.nombreJugador)}</strong>`,
    p.jugador.fideId ? escapar(p.jugador.fideId) : '-',
    escapar(p.categoria),
    p.jugador.elo ? String(p.jugador.elo) : '-',
    p.jugador.federacion ? escapar(p.jugador.federacion) : '-',
    p.jugador.club ? escapar(p.jugador.club) : '-',
    insignia(p.estado), accionesInscripcion(p)
  ]);
  return `
    <a class="enlace-volver" href="#/panel/torneos">Mis torneos</a>
    <h1 class="titulo-pagina">Participantes</h1>
    <p class="subtitulo-pagina">Torneo: ${escapar(torneo.nombre)}. Lista para presentacion y para Swiss-Manager.</p>
    <div class="acciones" style="margin-bottom:1rem">
      <a class="btn btn-secundario" href="#/panel/torneo/${encodeURIComponent(torneo.id)}/inscripciones">Gestionar inscripciones</a>
      <a class="btn btn-secundario" href="#/panel/torneo/${encodeURIComponent(torneo.id)}/checkin">Check-in del dia</a>
    </div>
    <form id="formulario-exportar" class="form-inline">
      <input id="campo-buscar-participante" class="input" placeholder="Buscar participante...">
      <button type="submit" class="btn btn-dorado">Buscar</button>
      <button type="button" id="boton-exportar" class="btn btn-secundario">Exportar CSV (Swiss-Manager)</button>
      <button type="button" id="boton-exportar-qr" class="btn btn-secundario">Exportar CSV (check-in)</button>
    </form>
    ${tablaHtml(['Jugador', 'FIDE ID', 'Categoria', 'Elo', 'Federacion', 'Club', 'Estado', 'Acciones'], filas)}`;
}

async function renderPagos() {
  const pagos = await OrganizadorRepository.getPagos();
  const conteo = {};
  for (const p of pagos) conteo[p.estado] = (conteo[p.estado] || 0) + 1;
  const chips = Object.entries(conteo).map(([estado, n]) =>
    `<span class="insignia insignia-info">${escapar(estado)}<span class="chip-numero">${n}</span></span>`
  ).join('');
  const filas = pagos.map((p) => [
    p.folio, escapar(p.torneo), escapar(p.jugador), Formatters.precio(p.monto),
    escapar(p.proveedor), insignia(p.estado), Formatters.fechaLarga(p.fecha),
    p.estado === 'pagado'
      ? `<button type="button" class="btn btn-texto" data-pago-accion="reembolsar" data-id="${escapar(p.id)}">Reembolsar</button>`
      : (p.estado === 'pendiente' || p.estado === 'procesando')
        ? `<button type="button" class="btn btn-texto" data-pago-accion="webhook" data-id="${escapar(p.id)}">Simular webhook</button>`
        : '-'
  ]);
  return `
    <h1 class="titulo-pagina">Pagos</h1>
    <p class="subtitulo-pagina">Los pagos solo se confirman via webhook. Aqui solo se consultan.</p>
    <div class="chips">${chips}</div>
    <div class="acciones" style="margin-bottom:1rem">
      <button type="button" id="boton-exportar-pagos" class="btn btn-secundario">Exportar CSV de pagos</button>
    </div>
    ${tablaHtml(['Folio', 'Torneo', 'Jugador', 'Monto', 'Proveedor', 'Estado', 'Fecha', 'Acciones'], filas)}`;
}

function campoFormulario({ etiqueta, nombre, valor = '', tipo = 'text', requerido = false }) {
  return `
    <label class="campo">
      <span class="campo-etiqueta">${escapar(etiqueta)}${requerido ? ' *' : ''}</span>
      <input class="input" name="${nombre}" type="${tipo}" value="${escapar(String(valor ?? ''))}" ${requerido ? 'required' : ''}>
    </label>`;
}

function formularioTorneo(torneo = null, eventos = []) {
  const t = torneo || {};
  const opciones = eventos.map((e) =>
    `<option value="${escapar(e.id)}"${t.eventoId === e.id ? ' selected' : ''}>${escapar(e.nombre)}</option>`
  ).join('');
  const cats = (t.categorias || [{ nombre: '', precio: '' }]).map((c) => `
    <div class="categoria-editor">
      <input class="input" placeholder="Nombre de la categoria" value="${escapar(c.nombre)}">
      <input class="input" type="number" min="0" step="0.01" placeholder="Precio MXN" value="${escapar(String(c.precio ?? ''))}">
    </div>`).join('');
  const f = (et, nom, val, tip) => campoFormulario({ etiqueta: et, nombre: nom, valor: val, tipo: tip });
  return `
  <form id="formulario-torneo" class="form-panel">
    <fieldset class="fieldset">
      <legend class="fieldset-titulo">Datos generales</legend>
      ${campoFormulario({ etiqueta: 'Nombre del torneo', nombre: 'nombre', valor: t.nombre || '', requerido: true })}
      <div class="campo-fila">
        ${f('Grupo (dentro del evento)', 'grupo', t.grupo || '')}
        ${campoFormulario({ etiqueta: 'Fecha', nombre: 'fecha', valor: t.fecha || '', tipo: 'date', requerido: true })}
      </div>
      <label class="campo">
        <span class="campo-etiqueta">Evento (opcional)</span>
        <select class="input" name="eventoId"><option value="">Sin evento</option>${opciones}</select>
      </label>
      <label class="campo">
        <span class="campo-etiqueta">Descripcion</span>
        <textarea class="input" name="descripcion">${escapar(t.descripcion || '')}</textarea>
      </label>
    </fieldset>
    <fieldset class="fieldset">
      <legend class="fieldset-titulo">Sede</legend>
      <div class="campo-fila">
        ${f('Ciudad', 'ciudad', t.ciudad || '')}
        ${f('Estado', 'estado', t.estado || '')}
      </div>
      ${f('Sede', 'sede', t.sede || '')}
    </fieldset>
    <fieldset class="fieldset">
      <legend class="fieldset-titulo">Categorias y cuotas</legend>
      <div class="lista-categorias" id="lista-categorias">${cats}</div>
      <div class="acciones">
        <button type="button" id="boton-agregar-categoria" class="btn btn-secundario">Agregar categoria</button>
      </div>
    </fieldset>
    <fieldset class="fieldset">
      <legend class="fieldset-titulo">Integraciones externas</legend>
      <div class="campo-fila">
        ${f('Swiss-Manager Event ID', 'swissManagerEventId', t.swissManagerEventId || '')}
        ${f('Chess-Results ID', 'chessResultsId', t.chessResultsId || '')}
      </div>
      ${campoFormulario({ etiqueta: 'Chess-Results URL', nombre: 'chessResultsUrl', valor: t.chessResultsUrl || '', tipo: 'url' })}
    </fieldset>
    <div class="acciones">
      <a class="btn btn-secundario" href="#/panel/torneos">Cancelar</a>
      <button type="submit" class="btn btn-primario">Guardar (demo)</button>
    </div>
  </form>`;
}

async function renderCrear() {
  const eventos = await OrganizadorRepository.getEventos();
  return `
    <h1 class="titulo-pagina">Crear torneo</h1>
    <p class="subtitulo-pagina">Maqueta: el guardado real llegara con Supabase.</p>
    ${formularioTorneo(null, eventos)}`;
}

async function renderEditar(torneoId) {
  const torneo = await OrganizadorRepository.getTorneoPorId(torneoId);
  if (!torneo) return renderNoEncontrada();
  const eventos = await OrganizadorRepository.getEventos();
  return `
    <h1 class="titulo-pagina">Editar torneo</h1>
    <p class="subtitulo-pagina">Torneo: ${escapar(torneo.nombre)}.</p>
    ${formularioTorneo(torneo, eventos)}`;
}

async function renderQr() {
  return `
    <h1 class="titulo-pagina">Validacion QR</h1>
    <p class="subtitulo-pagina">Avance visual: el QR real se generara por inscripcion pagada.</p>
    <div class="qr-marco">${qrDemoSvg()}</div>
    <form id="formulario-qr" class="form-inline">
      <input id="campo-qr" class="input" placeholder="Escribe un folio (demo)...">
      <button type="submit" class="btn btn-dorado">Validar</button>
    </form>`;
}

async function renderReportes() {
  const torneos = await OrganizadorRepository.getTorneos();
  const bloques = torneos.map((t) => {
    const pct = t.cupo > 0 ? Math.round((t.inscritos / t.cupo) * 100) : 0;
    return `<div class="card-reporte"><p><strong>${escapar(t.nombre)}</strong></p>`
      + `<div class="barra-progreso"><i style="width:${pct}%"></i></div>`
      + `<p>${t.inscritos} / ${t.cupo} lugares (${pct}%)</p></div>`;
  }).join('');
  return `
    <h1 class="titulo-pagina">Reportes</h1>
    <p class="subtitulo-pagina">Ocupacion por torneo (en Supabase: SQL).</p>
    <div class="grid-reportes">${bloques}</div>`;
}
function extraerId(ruta, prefijo, sufijo = '') {
  let resto = ruta.substring(prefijo.length);
  if (sufijo && resto.endsWith(sufijo)) resto = resto.substring(0, resto.length - sufijo.length);
  return decodeURIComponent(resto);
}

function toggleSidebar() {
  const sidebar = document.querySelector('#sidebar');
  if (!sidebar) return;
  sidebar.classList.toggle('visible');
}

function cerrarSidebar() {
  const sidebar = document.querySelector('#sidebar');
  if (sidebar) sidebar.classList.remove('visible');
}

function vincularEventos(ruta, contenedor) {
  // Toggle sidebar (hamburguesa button)
  const btnHamburguesa = contenedor.querySelector('#btn-hamburguesa');
  if (btnHamburguesa) {
    btnHamburguesa.addEventListener('click', toggleSidebar);
  }
  // Cerrar sidebar
  const btnCerrar = contenedor.querySelector('#sidebar-cerrar');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', cerrarSidebar);
  }
  // Cerrar sidebar al navegar (mobile)
  contenedor.querySelectorAll('[data-nav]').forEach((enlace) => {
    enlace.addEventListener('click', () => {
      cerrarSidebar();
    });
  });
  // Cerrar sesion
  const btnSalir = contenedor.querySelector('#btn-salir');
  if (btnSalir) {
    btnSalir.addEventListener('click', () => {
      Sesion.cerrar();
      notificar('Sesion cerrada.');
      window.location.hash = '#/';
    });
  }
  contenedor.querySelectorAll('[data-org-accion]').forEach((boton) => {
    boton.addEventListener('click', async () => {
      const id = boton.dataset.id;
      if (boton.dataset.orgAccion === 'publicar') {
        const ok = await OrganizadorRepository.publicarTorneo(id);
        notificar(ok ? 'Torneo publicado (demo).' : 'El torneo ya estaba publicado.');
        if (ok) PanelOrganizadorView.render(contenedor, ruta);
      } else if (boton.dataset.orgAccion === 'despublicar') {
        const ok = await OrganizadorRepository.despublicarTorneo(id);
        notificar(ok ? 'Torneo devuelto a borrador (demo).' : 'El torneo no estaba publicado.');
        if (ok) PanelOrganizadorView.render(contenedor, ruta);
      } else if (boton.dataset.orgAccion === 'cancelar') {
        const ok = await OrganizadorRepository.cancelarTorneo(id);
        notificar(ok ? 'Torneo cancelado (demo).' : 'El torneo ya estaba cancelado.');
        if (ok) PanelOrganizadorView.render(contenedor, ruta);
      } else if (boton.dataset.orgAccion === 'duplicar') {
        const copia = await OrganizadorRepository.duplicarTorneo(id);
        notificar(copia ? 'Torneo duplicado como borrador (demo).' : 'No se pudo duplicar.');
        if (copia) PanelOrganizadorView.render(contenedor, ruta);
      }
    });
  });
  contenedor.querySelectorAll('[data-pago-accion]').forEach((boton) => {
    boton.addEventListener('click', async () => {
      const id = boton.dataset.id;
      if (boton.dataset.pagoAccion === 'webhook') {
        const resultado = await PaymentsRepository.simularWebhook(id);
        notificar(resultado.ok ? 'Pago confirmado via webhook (demo).' : resultado.motivo);
        if (resultado.ok) PanelOrganizadorView.render(contenedor, ruta);
      } else if (boton.dataset.pagoAccion === 'reembolsar') {
        const ok = await PaymentsRepository.reembolsar(id);
        notificar(ok ? 'Pago reembolsado (demo).' : 'Ese pago no admite reembolso.');
        if (ok) PanelOrganizadorView.render(contenedor, ruta);
      }
    });
  });
  contenedor.querySelectorAll('[data-accion]').forEach((boton) => {
    boton.addEventListener('click', async () => {
      const mapa = {
        'validar-pago': 'pagada', 'marcar-revision': 'pago_en_revision',
        confirmar: 'confirmada', checkin: 'checkin',
        cancelar: 'cancelada', rechazar: 'rechazada', retirar: 'retirada'
      };
      const destino = mapa[boton.dataset.accion];
      if (!destino) return;
      const ok = await OrganizadorRepository.actualizarEstadoInscripcion(boton.dataset.reg, destino);
      notificar(ok ? 'Inscripcion actualizada.' : 'Transicion no valida.');
      if (ok) PanelOrganizadorView.render(contenedor, ruta);
    });
  });
  const formEvento = contenedor.querySelector('#formulario-evento');
  if (formEvento) {
    formEvento.addEventListener('submit', async (e) => {
      e.preventDefault();
      const campo = formEvento.querySelector('#campo-nuevo-evento');
      const nombre = (campo.value || '').trim();
      if (!nombre) {
        notificar('Escribe el nombre del evento.');
        return;
      }
      await OrganizadorRepository.crearEvento(nombre);
      notificar('Evento creado (demo).');
      PanelOrganizadorView.render(contenedor, ruta);
    });
  }
  const formExportar = contenedor.querySelector('#formulario-exportar');
  if (formExportar) {
    const torneoId = extraerId(ruta, '#/panel/torneo/', '/participantes');
    const campo = formExportar.querySelector('#campo-buscar-participante');
    formExportar.addEventListener('submit', (e) => {
      e.preventDefault();
      const texto = (campo.value || '').trim().toLowerCase();
      contenedor.querySelectorAll('.tabla-panel tbody tr').forEach((fila) => {
        fila.hidden = texto !== '' && !fila.textContent.toLowerCase().includes(texto);
      });
    });
    const botonExportar = formExportar.querySelector('#boton-exportar');
    if (botonExportar) {
      botonExportar.addEventListener('click', async () => {
        const torneo = await OrganizadorRepository.getTorneoPorId(torneoId);
        try {
          await SwissManagerExport.descargar(torneoId, torneo ? torneo.nombre : torneoId);
          notificar('CSV generado (formato propuesto).');
        } catch {
          notificar('No fue posible generar el CSV.');
        }
      });
    }
    const botonQr = formExportar.querySelector('#boton-exportar-qr');
    if (botonQr) {
      botonQr.addEventListener('click', async () => {
        const torneo = await OrganizadorRepository.getTorneoPorId(torneoId);
        try {
          await SwissManagerExport.descargarCheckin(torneoId, torneo ? torneo.nombre : torneoId);
          notificar('CSV de check-in generado (demo).');
        } catch {
          notificar('No fue posible generar el CSV.');
        }
      });
    }
  }
  const formCheckin = contenedor.querySelector('#formulario-checkin');
  if (formCheckin) {
    const campo = formCheckin.querySelector('#campo-buscar-checkin');
    formCheckin.addEventListener('submit', (e) => {
      e.preventDefault();
      const texto = (campo.value || '').trim().toLowerCase();
      contenedor.querySelectorAll('.tabla-panel tbody tr').forEach((fila) => {
        fila.hidden = texto !== '' && !fila.textContent.toLowerCase().includes(texto);
      });
    });
  }
  const formQr = contenedor.querySelector('#formulario-qr');
  if (formQr) {
    formQr.addEventListener('submit', async (e) => {
      e.preventDefault();
      const folio = (formQr.querySelector('#campo-qr').value || '').trim().toUpperCase();
      if (!folio) {
        notificar('Escribe un folio para validar (demo).');
        return;
      }
      const pago = (await PaymentsRepository.getPagos())
        .find((p) => String(p.folio).toUpperCase() === folio);
      if (!pago) {
        notificar('Folio no encontrado (demo).');
      } else if (pago.estado === 'pagado') {
        notificar(`Folio válido · ${pago.jugador} · ${pago.torneo}`);
      } else {
        notificar(`Folio sin pago confirmado (estado: ${pago.estado}).`);
      }
    });
  }
  const formPago = contenedor.querySelector('#formulario-pago-manual');
  if (formPago) {
    formPago.addEventListener('submit', async (e) => {
      e.preventDefault();
      const torneoId = extraerId(ruta, '#/panel/torneo/', '/inscripciones');
      const torneo = await OrganizadorRepository.getTorneoPorId(torneoId);
      const playerId = formPago.querySelector('#pago-jugador').value;
      const selCat = formPago.querySelector('#pago-categoria');
      const categoria = selCat.value;
      const precio = Number(selCat.selectedOptions[0].dataset.precio) || 0;
      if (!playerId || !categoria) {
        notificar('Elige jugador y categoria.');
        return;
      }
      await OrganizadorRepository.registrarPagoManual({
        torneoId, eventoId: torneo ? torneo.eventoId : null, playerId, categoria, precio
      });
      notificar('Pago en efectivo registrado (demo).');
      PanelOrganizadorView.render(contenedor, ruta);
    });
  }
  const botonPagos = contenedor.querySelector('#boton-exportar-pagos');
  if (botonPagos) {
    botonPagos.addEventListener('click', async () => {
      try {
        await OrganizadorRepository.exportarPagosCsv();
        notificar('CSV de pagos generado (demo).');
      } catch {
        notificar('No fue posible generar el CSV.');
      }
    });
  }
  const formTorneo = contenedor.querySelector('#formulario-torneo');
  if (formTorneo) {
    const listaCats = formTorneo.querySelector('#lista-categorias');
    const botonCat = formTorneo.querySelector('#boton-agregar-categoria');
    if (botonCat && listaCats) {
      botonCat.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'categoria-editor';
        div.innerHTML = '<input class="campo-control" placeholder="Nombre de la categoria" value="">'
          + '<input class="campo-control" type="number" min="0" step="0.01" placeholder="Precio MXN" value="">';
        listaCats.appendChild(div);
      });
    }
    formTorneo.addEventListener('submit', async (e) => {
      e.preventDefault();
      const datos = new FormData(formTorneo);
      const nombre = String(datos.get('nombre') || '').trim();
      const fecha = String(datos.get('fecha') || '').trim();
      if (!nombre || !fecha) {
        notificar('Nombre y fecha son obligatorios.');
        return;
      }
      const categorias = [...formTorneo.querySelectorAll('.categoria-editor')].map((div) => {
        const [nom, pre] = div.querySelectorAll('input');
        return { nombre: nom.value.trim(), precio: Number(pre.value) || 0 };
      }).filter((c) => c.nombre);
      const torneo = await OrganizadorRepository.guardarTorneo({
        id: formTorneo.dataset.id || null,
        nombre,
        grupo: String(datos.get('grupo') || ''),
        fecha,
        eventoId: String(datos.get('eventoId') || '') || null,
        descripcion: String(datos.get('descripcion') || ''),
        ciudad: String(datos.get('ciudad') || ''),
        estado: String(datos.get('estado') || ''),
        sede: String(datos.get('sede') || ''),
        categorias: categorias.length ? categorias : [{ nombre: 'General', precio: 0 }],
        swissManagerEventId: String(datos.get('swissManagerEventId') || '') || null,
        chessResultsId: String(datos.get('chessResultsId') || '') || null,
        chessResultsUrl: String(datos.get('chessResultsUrl') || '') || null
      });
      notificar(torneo ? 'Torneo guardado (demo).' : 'No se pudo guardar.');
      if (torneo) window.location.hash = '#/panel/torneos';
    });
  }
}

export const PanelOrganizadorView = {
  async render(contenedor, ruta = '#/panel') {
    ORGANIZADOR = await OrganizadorRepository.getPerfil();
    let html = '';
    let clave = 'resumen';
    if (ruta === '#/panel' || ruta === '#/panel/') {
      html = await renderResumen();
    } else if (ruta === '#/panel/eventos') {
      clave = 'eventos'; html = await renderEventos();
    } else if (ruta.startsWith('#/panel/evento/')) {
      clave = 'eventos'; html = await renderFichaEvento(extraerId(ruta, '#/panel/evento/'));
    } else if (ruta === '#/panel/torneos') {
      clave = 'torneos'; html = await renderTorneos();
    } else if (ruta === '#/panel/crear' || ruta === '#/publicar' || ruta === '#/publicar/') {
      clave = 'crear'; html = await renderCrear();
    } else if (ruta.startsWith('#/panel/torneo/') && ruta.endsWith('/editar')) {
      clave = 'torneos'; html = await renderEditar(extraerId(ruta, '#/panel/torneo/', '/editar'));
    } else if (ruta.startsWith('#/panel/torneo/') && ruta.endsWith('/participantes')) {
      clave = 'torneos'; html = await renderParticipantes(extraerId(ruta, '#/panel/torneo/', '/participantes'));
    } else if (ruta.startsWith('#/panel/torneo/') && ruta.endsWith('/inscripciones')) {
      clave = 'torneos'; html = await renderInscripciones(extraerId(ruta, '#/panel/torneo/', '/inscripciones'));
    } else if (ruta.startsWith('#/panel/torneo/') && ruta.endsWith('/checkin')) {
      clave = 'torneos'; html = await renderCheckin(extraerId(ruta, '#/panel/torneo/', '/checkin'));
    } else if (ruta === '#/panel/pagos') {
      clave = 'pagos'; html = await renderPagos();
    } else if (ruta === '#/panel/checkin') {
      clave = 'checkin'; html = await renderIndiceCheckin();
    } else if (ruta === '#/panel/qr') {
      clave = 'qr'; html = await renderQr();
    } else if (ruta === '#/panel/reportes') {
      clave = 'reportes'; html = await renderReportes();
    } else {
      html = renderNoEncontrada();
    }
    contenedor.innerHTML = plantillaPanel(html, clave);
    vincularEventos(ruta, contenedor);
  }
};

