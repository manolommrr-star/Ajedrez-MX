/**
 * Adaptador de integración: SWISS-MANAGER (Nivel 1 · Exportación).
 *
 * ⚠️ ADVERTENCIA IMPORTANTE:
 *   Swiss-Manager no expone (hasta donde se sabe) una API pública de
 *   importación verificada para este prototipo. Este CSV es un FORMATO
 *   PROPUESTO, pensado para abre sillar el flujo; antes de producción
 *   debe verificarse contra el mecanismo real de Swiss-Manager
 *   (importación de fichero) y ajustarse columnas/orden si hace falta.
 *
 * Nivel 1: exportar jugadores (y CSV auxiliar de check-in) → archivo → Swiss-Manager.
 * Nivel 2 (futuro): importar resultados. Nivel 3: API automatizada.
 */
import { RegistrationsRepository } from '../core/registrationsRepository.js';

const COLUMNAS = [
  'Apellidos', 'Nombre', 'FIDE ID', 'Federacion', 'Elo',
  'Club', 'Categoria', 'Precio', 'Estado', 'Email'
];

/** Columnas del CSV auxiliar de check-in (control de asistencia). */
const COLUMNAS_CHECKIN = [
  'Apellidos', 'Nombre', 'FIDE ID', 'Categoria', 'Elo', 'Check-in'
];

/** Escapa un valor CSV (comas, comillas y saltos de línea). */
function escaparCsv(valor) {
  const texto = String(valor ?? '');
  return /[",\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

function nombreArchivo(nombreTorneo) {
  return `jugadores_${String(nombreTorneo).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(' ', '_')}.csv`;
}

/** Descarga un contenido CSV como archivo en el navegador. */
function descargarContenido(contenido, nombre) {
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

export const SwissManagerExport = {
  COLUMNAS,

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
    descargarContenido(csv, nombreArchivo(nombreTorneo));
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
    const nombre = nombreArchivo(nombreTorneo).replace('jugadores_', 'checkin_');
    descargarContenido(csv, nombre);
  }
};