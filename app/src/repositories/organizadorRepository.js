/**
 * Repositorio del panel de organizador (Etapa 2 · relacional, objetivo Supabase).
 *
 * Capa única que usa el panel. Ahora es ASÍNCRONA y delega el dominio
 * en core/; cuando se conecte Supabase solo cambiará el origen
 * de datos interno de cada repositorio de core, no esta interfaz.
 */
import { ORGANIZADOR_DEMO, TORNEOS_DEMO } from '../data/mockRelacional.js';
import { EventsRepository } from '../core/eventsRepository.js';
import { RegistrationsRepository } from '../core/registrationsRepository.js';
import { PaymentsRepository } from '../core/paymentsRepository.js';
import { Sesion } from '../core/sesion.js';

export const OrganizadorRepository = {
  /** Organizador activo: la cuenta con sesión (rol organizer) o el club demo. */
  async getPerfil() {
    return (await Sesion.getOrganizador()) || ORGANIZADOR_DEMO;
  },

  async getEventos() {
    const perfil = await this.getPerfil();
    return EventsRepository.getEventos(perfil.id);
  },

  async getEventoPorId(id) {
    return EventsRepository.getEventoPorId(id);
  },

  async getTorneosDeEvento(eventoId) {
    return EventsRepository.getTorneosDeEvento(eventoId);
  },

  /** Torneos del organizador activo (incluye borradores), por fecha. */
  async getTorneos() {
    const perfil = await this.getPerfil();
    return TORNEOS_DEMO
      .filter((t) => t.organizadorId === perfil.id)
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  },

  async getTorneoPorId(id) {
    const perfil = await this.getPerfil();
    const torneo = TORNEOS_DEMO.find((t) => t.id === id);
    return torneo && torneo.organizadorId === perfil.id ? torneo : null;
  },

  /** Publica un torneo en borrador (solo demo local). */
  async publicarTorneo(id) {
    const perfil = await this.getPerfil();
    const torneo = TORNEOS_DEMO.find((t) => t.id === id && t.organizadorId === perfil.id);
    if (!torneo || torneo.estadoPublicacion === 'publicado') return false;
    torneo.estadoPublicacion = 'publicado';
    return true;
  },

  /** Despublica un torneo (vuelve a borrador, solo demo local). */
  async despublicarTorneo(id) {
    const perfil = await this.getPerfil();
    const torneo = TORNEOS_DEMO.find((t) => t.id === id && t.organizadorId === perfil.id);
    if (!torneo || torneo.estadoPublicacion !== 'publicado') return false;
    torneo.estadoPublicacion = 'borrador';
    return true;
  },

  /** Cancela un torneo (estadoPublicacion = 'cancelado', solo demo local). */
  async cancelarTorneo(id) {
    const perfil = await this.getPerfil();
    const torneo = TORNEOS_DEMO.find((t) => t.id === id && t.organizadorId === perfil.id);
    if (!torneo || torneo.estadoPublicacion === 'cancelado') return false;
    torneo.estadoPublicacion = 'cancelado';
    return true;
  },

  /** Duplica un torneo del organizador (solo demo local). */
  async duplicarTorneo(id) {
    const perfil = await this.getPerfil();
    const torneo = TORNEOS_DEMO.find((t) => t.id === id && t.organizadorId === perfil.id);
    if (!torneo) return null;
    // Id único: la primera copia es `<id>-copia`, las siguientes añaden sufijo.
    const base = `${torneo.id}-copia`;
    let idCopia = base;
    let n = 2;
    while (TORNEOS_DEMO.some((t) => t.id === idCopia)) {
      idCopia = `${base}-${n}`;
      n += 1;
    }
    const copia = {
      ...torneo,
      categorias: (torneo.categorias || []).map((c) => ({ ...c })),
      id: idCopia,
      nombre: `${torneo.nombre} (copia)`,
      estadoPublicacion: 'borrador',
      inscritos: 0,
      swissManagerEventId: null,
      chessResultsId: null,
      chessResultsUrl: null,
      fechaCreacion: new Date().toISOString().slice(0, 10)
    };
    TORNEOS_DEMO.push(copia);
    return copia;
  },

  /** Participantes de un torneo (JOIN inscripción + jugador). */
  async getParticipantes(torneoId) {
    return RegistrationsRepository.getParticipantes(torneoId);
  },

  /** Pagos de los torneos del organizador activo (nunca de terceros). */
  async getPagos() {
    const torneos = await this.getTorneos();
    const propios = new Set(torneos.map((t) => t.id));
    const pagos = await PaymentsRepository.getPagos();
    return pagos.filter((p) => propios.has(p.torneoId));
  },

  /** Exporta a CSV los pagos de MIS torneos (demo: descarga en navegador). */
  async exportarPagosCsv() {
    const pagos = await this.getPagos();
    const cabecera = 'Folio,Torneo,Jugador,Monto,Proveedor,Estado,Fecha';
    // Neutraliza fórmulas de hoja de cálculo (CSV injection).
    const esc = (v) => {
      const t = String(v ?? '');
      const seguro = /^[=+\-@\t\r]/.test(t) ? `'${t}` : t;
      return /[",\n]/.test(seguro) ? `"${seguro.replaceAll('"', '""')}"` : seguro;
    };
    const cuerpo = pagos.map((p) =>
      [p.folio, p.torneo, p.jugador, p.monto, p.proveedor, p.estado, p.fecha].map(esc).join(',')
    ).join('\r\n');
    const blob = new Blob([`﻿${cabecera}\r\n${cuerpo}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pagos_organizador.csv';
    a.click();
    URL.revokeObjectURL(url);
    return true;
  },

  /**
   * Crea o actualiza un torneo demo (sin backend).
   * Recibe el objeto del formulario y devuelve el torneo guardado.
   */
  async guardarTorneo(datos) {
    const perfil = await this.getPerfil();
    if (datos.id) {
      const t = TORNEOS_DEMO.find((x) => x.id === datos.id && x.organizadorId === perfil.id);
      if (!t) return null;
      Object.assign(t, {
        nombre: datos.nombre,
        grupo: datos.grupo || null,
        fecha: datos.fecha,
        hora: datos.hora || t.hora,
        eventoId: datos.eventoId || null,
        descripcion: datos.descripcion || '',
        ciudad: datos.ciudad || '',
        estado: datos.estado || '',
        sede: datos.sede || '',
        modalidad: datos.modalidad || t.modalidad,
        sistema: datos.sistema || t.sistema,
        rondas: datos.rondas ?? t.rondas,
        ritmo: datos.ritmo || t.ritmo,
        cupo: datos.cupo ?? t.cupo,
        destacado: !!datos.destacado,
        estadoPublicacion: datos.estadoPublicacion || t.estadoPublicacion,
        categorias: datos.categorias,
        swissManagerEventId: datos.swissManagerEventId,
        chessResultsId: datos.chessResultsId,
        chessResultsUrl: datos.chessResultsUrl
      });
      return t;
    }
    const slug = datos.nombre.normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || `torneo-${Date.now()}`;
    const nuevo = {
      id: `${slug}-${Date.now().toString(36)}`,
      eventoId: datos.eventoId || null,
      organizadorId: perfil.id,
      grupo: datos.grupo || null,
      nombre: datos.nombre,
      descripcion: datos.descripcion || '',
      fecha: datos.fecha,
      hora: datos.hora || '10:00',
      ciudad: datos.ciudad || '',
      estado: datos.estado || '',
      sede: datos.sede || '',
      direccion: '',
      modalidad: datos.modalidad || 'Presencial',
      sistema: datos.sistema || 'Sistema suizo',
      rondas: datos.rondas ?? 5,
      ritmo: datos.ritmo || '',
      cupo: datos.cupo ?? 32,
      inscritos: 0,
      categorias: datos.categorias,
      organizador: { nombre: perfil.nombre, email: perfil.email },
      reglamentoUrl: '',
      imagen: '',
      destacado: !!datos.destacado,
      estadoPublicacion: datos.estadoPublicacion || 'borrador',
      swissManagerEventId: datos.swissManagerEventId || null,
      chessResultsId: datos.chessResultsId || null,
      chessResultsUrl: datos.chessResultsUrl || null,
      fechaCreacion: new Date().toISOString().slice(0, 10)
    };
    TORNEOS_DEMO.push(nuevo);
    return nuevo;
  },

  /** Cambia el estado de una inscripción si la transición es válida. */
  async actualizarEstadoInscripcion(regId, nuevoEstado) {
    return RegistrationsRepository.actualizarEstado(regId, nuevoEstado);
  }
};