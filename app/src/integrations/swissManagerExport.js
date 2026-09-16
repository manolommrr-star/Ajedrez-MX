/**
 * Adaptador de integración: SWISS-MANAGER (Nivel 1 · Exportación).
 *
 * TXT para importar jugadores: File → Import players from text file.
 * Formato elegido para el asistente de Swiss Manager:
 *   - Separador: TABULACIÓN (columnas fijas, sin comillas)
 *   - Finales de línea: CRLF
 *   - Codificación: Windows-1252 (ANSI) vía utils/cp1252.js
 *
 * Estados exportados: solo quienes van a jugar (pagada/confirmada/checkin)
 * salvo que `incluirTodos` sea verdadero.
 *
 * ⚠️ VERIFICACIÓN: el formato es PROPUESTO hasta probarse con el asistente
 * real; el perfil de mapeo se guarda en Swiss Manager y queda documentado
 * en docs/04-swiss-manager.md.
 *
 * Nivel 1: exportar jugadores (TXT/CSV) → archivo → Swiss-Manager.
 * Nivel 2 (futuro): importar resultados. Nivel 3: API automatizada.
 */
import { RegistrationsRepository } from '../core/registrationsRepository.js';
import { OrganizadorRepository } from '../repositories/organizadorRepository.js';
import { aCp1252 } from '../utils/cp1252.js';

/** Columnas del CSV de inscritos (referencia, Excel). */
const COLUMNAS = [
  'Apellidos', 'Nombre', 'FIDE ID', 'Federacion', 'Elo',
  'Club', 'Categoria', 'Precio', 'Estado', 'Email'
];

/** Columnas del TXT de importación a Swiss Manager (orden fijo). */
const COLUMNAS_TXT = [
  'Apellidos', 'Nombre', 'Federacion', 'FIDE ID', 'Elo', 'Titulo',
  'Sexo', 'FechaNacimiento', 'Club', 'Ciudad', 'Categoria'
];

/** Columnas del CSV auxiliar de check-in (control de asistencia). */
const COLUMNAS_CHECKIN = [
  'Apellidos', 'Nombre', 'FIDE ID', 'Categoria', 'Elo', 'Check-in'
];

/** Estados que implican participación activa en el torneo. */
const ESTADOS_JUEGAN = ['pagada', 'confirmada', 'checkin'];

/** Títulos FIDE válidos (los nacionales como 'MN' no se exportan). */
const TITULOS_FIDE = new Set(['GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'WFM', 'WCM']);

/** Códigos FIDE de federación conocidos (ampliable). */
const CODIGOS_FEDERACION = new Map([
  ['FENAMAC', 'MEX'],
  ['MEXICO', 'MEX'],
  ['FMN', 'MEX']
]);

/** Escapa un valor CSV (comas, comillas y saltos de línea). */
/** Escapa caracteres XML especiales. */
function escaparXml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, '&apos;');
}

function escaparCsv(valor) {
  const texto = String(valor ?? '');
  return /[",\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

/** Limpia un valor para el TXT (tabulaciones y saltos de línea fuera). */
function limpiarTxt(valor) {
  return String(valor ?? '').replace(/[\t\r\n]+/g, ' ').trim();
}

/** '1994-05-12' → '12.05.1994' (formato Swiss Manager). */
function fechaSwiss(iso) {
  const m = String(iso ?? '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
}

/** 'FENAMAC' → 'MEX'; código de 3 letras se respeta; vacío → 'MEX'. */
function federacionSwiss(valor) {
  const texto = String(valor ?? '').trim().toUpperCase();
  return CODIGOS_FEDERACION.get(texto) || (texto.length === 3 ? texto : 'MEX');
}

/** Solo títulos FIDE; 'MN' u otros títulos nacionales → ''. */
function tituloSwiss(valor) {
  const t = String(valor ?? '').trim().toUpperCase();
  return TITULOS_FIDE.has(t) ? t : '';
}

/** Sexo normalizado ('M'/'F'/''), vacío si no se capturó. */
function sexoSwiss(valor) {
  const t = String(valor ?? '').trim().toUpperCase();
  return t === 'M' || t === 'F' ? t : '';
}

/** Elo como texto o '' (Swiss Manager admite vacío = sin rating). */
function eloSwiss(valor) {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? String(n) : '';
}

/**
 * Convierte participantes a filas TXT + advertencias de calidad de datos.
 * Cada fila ya normalizada; las advertencias se muestran en la UI.
 */
function aFilasTxt(participantes) {
  const filas = [];
  const advertencias = [];
  for (const p of participantes) {
    const j = p.jugador || {};
    filas.push([
      limpiarTxt(j.apellidos),
      limpiarTxt(j.nombre),
      federacionSwiss(j.federacion),
      limpiarTxt(j.fideId),
      eloSwiss(j.elo),
      tituloSwiss(j.titulo),
      sexoSwiss(j.sexo),
      fechaSwiss(j.fechaNacimiento),
      limpiarTxt(j.club),
      limpiarTxt(j.ciudad),
      limpiarTxt(p.categoria)
    ]);
    if (!j.fideId) advertencias.push(`${p.nombreJugador}: sin FIDE ID`);
    if (!eloSwiss(j.elo)) advertencias.push(`${p.nombreJugador}: sin Elo`);
    if (!j.club) advertencias.push(`${p.nombreJugador}: sin club`);
  }
  return { filas, advertencias };
}

function nombreArchivo(nombreTorneo, prefijo = 'jugadores', ext = 'csv') {
  const base = String(nombreTorneo).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(' ', '_');
  return `${prefijo}_${base}.${ext}`;
}

/** Descarga bytes como archivo en el navegador. */
function descargarBytes(bytes, nombre, tipoMime) {
  const blob = new Blob([bytes], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

export const SwissManagerExport = {
  COLUMNAS,
  COLUMNAS_TXT,
  ESTADOS_JUEGAN,

  /**
   * Genera el TXT de importación (cp1252, tabulaciones, CRLF).
   * Opciones: { incluirTodos: true } exporta también pendientes/cancelados.
   */
  async generarTxt(torneoId, { incluirTodos = false } = {}) {
    const participantes = await RegistrationsRepository.getParticipantes(torneoId);
    const lista = incluirTodos
      ? participantes
      : participantes.filter((p) => ESTADOS_JUEGAN.includes(p.estado));
    const { filas, advertencias } = aFilasTxt(lista);
    const texto = [COLUMNAS_TXT.join('\t'), ...filas.map((f) => f.join('\t'))].join('\r\n');
    return { bytes: aCp1252(texto), cuenta: filas.length, advertencias };
  },

  /** Descarga directa del TXT de importación en el navegador. */
  async descargarTxt(torneoId, nombreTorneo, opciones = {}) {
    const { bytes, cuenta, advertencias } = await this.generarTxt(torneoId, opciones);
    descargarBytes(bytes, nombreArchivo(nombreTorneo, 'jugadores', 'txt'), 'text/plain;charset=windows-1252');
    return { cuenta, advertencias };
  },

    /**
   * Genera el contenido XML de importación para Swiss Manager.
   * Formato compatible con: File → Import → Import tournament with participants.
   */
  async generarXml(torneoId) {
    const torneo = await OrganizadorRepository.getTorneoPorId(torneoId);
    if (!torneo) return '';
    const participantes = await RegistrationsRepository.getParticipantes(torneoId);
    const jugadores = participantes.filter((p) => ESTADOS_JUEGAN.includes(p.estado));

    const partidas = jugadores.map((p) => {
      const j = p.jugador || {};
      const attrs = [
        `surname="${escaparXml(j.apellidos || '')}" firstname="${escaparXml(j.nombre || '')}"`,
        `federation="${federacionSwiss(j.federacion)}"`,
        `oid="${escaparXml(j.fideId || '')}"`,
        `title="${tituloSwiss(j.titulo)}"`,
        `sex="${sexoSwiss(j.sexo)}"`,
        `birthday="${fechaSwiss(j.fechaNacimiento)}"`,
        `club="${escaparXml(j.club || '')}"`
      ];
            return `    <Player ${attrs.join(' ')} />`;
    });

        const xml = [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<Players>',
      ...partidas,
      '</Players>'
    ];
    return xml.join('\n') + '\n';
  },

  /** Descarga directa del XML de importación en el navegador. */
  async descargarXml(torneoId, nombreTorneo) {
    const xml = await this.generarXml(torneoId);
    const bytes = new TextEncoder().encode(xml);
    descargarBytes(bytes, nombreArchivo(nombreTorneo, 'torneo', 'xml'), 'application/xml;charset=utf-8');
    const participantes = await RegistrationsRepository.getParticipantes(torneoId);
    const cuenta = participantes.filter((p) => ESTADOS_JUEGAN.includes(p.estado)).length;
    return { cuenta };
  },

  /**
   * Genera el contenido CSV con todos los inscritos de un torneo.
   * Incluye BOM UTF-8 para que Excel abra los acentos correctamente.
   */
  async generarCsv(torneoId) {
    const participantes = await RegistrationsRepository.getParticipantes(torneoId);
    const filas = participantes.map((r) => [
      r.jugador.apellidos,
      r.jugador.nombre,
      r.jugador.fideId,
      r.jugador.federacion,
      r.jugador.elo,
      r.jugador.club,
      r.categoria,
      r.precio,
      r.estado,
      r.jugador.email
    ]);

    const cuerpo = [COLUMNAS.join(','), ...filas.map((f) => f.map(escaparCsv).join(','))].join('\r\n');
    return `\uFEFF${cuerpo}`;
  },

  /** Descarga directa del CSV de inscritos en el navegador. */
  async descargar(torneoId, nombreTorneo) {
    const csv = await this.generarCsv(torneoId);
    descargarBytes(new TextEncoder().encode(csv), nombreArchivo(nombreTorneo), 'text/csv;charset=utf-8');
  },

  /**
   * CSV de control de asistencia (check-in): incluye a los jugadores
   * confirmados y a los que ya registraron entrada (demo local).
   */
  async generarCsvCheckin(torneoId) {
    const participantes = await RegistrationsRepository.getParticipantes(torneoId);
    const filas = participantes
      .filter((p) => p.estado === 'confirmada' || p.estado === 'checkin')
      .map((p) => [
        p.jugador.apellidos,
        p.jugador.nombre,
        p.jugador.fideId,
        p.categoria,
        p.jugador.elo,
        p.estado === 'checkin' ? 'Presente' : 'Pendiente'
      ]);
    const cuerpo = [COLUMNAS_CHECKIN.join(','), ...filas.map((f) => f.map(escaparCsv).join(','))].join('\r\n');
    return `\uFEFF${cuerpo}`;
  },

  /** Descarga directa del CSV de check-in en el navegador. */
  async descargarCheckin(torneoId, nombreTorneo) {
        const csv = await this.generarCsvCheckin(torneoId);
    const bytes = new TextEncoder().encode(csv);
    descargarBytes(bytes, nombreArchivo(nombreTorneo, 'checkin', 'csv'), 'text/csv;charset=utf-8');
  }
};