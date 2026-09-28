/**
 * Rutas públicas: lo que el SPA hacía con rutas hash, aquí son GET.
 *
 *   #/                     → GET /          (catálogo + filtros por query)
 *   #/torneo/:id           → GET /torneo/:id
 *
 * Las funciones son async: si algo falla se pasa a next(err) y el
 * manejador de errores de app.js responde un 500 con vista de error.
 */
import { Router } from 'express';
import { TournamentRepository } from '../puente/torneos.js';
import { aTarjeta, aDetalle, secciones, valoresDeFiltro } from '../modelos.js';

export const rutasPublicas = Router();

/** Query string → cadena limpia (nunca llega undefined ni arrays). */
function texto(query) {
  const valor = Array.isArray(query) ? query[0] : query;
  return typeof valor === 'string' ? valor.trim() : '';
}

/**
 * GET / — catálogo.
 * Con parámetros (?texto=&ciudad=&modalidad=) muestra resultados;
 * sin ellos, las tres secciones del inicio. Mismo comportamiento que
 * CatalogoView.vue, pero filtrando en el servidor.
 */
rutasPublicas.get('/', async (req, res, next) => {
  try {
    const filtros = {
      textoTorneo: texto(req.query.texto),
      ciudad: texto(req.query.ciudad),
      modalidad: texto(req.query.modalidad)
    };
    const hayFiltros = Object.values(filtros).some((v) => v !== '');

    const todos = await TournamentRepository.getAll();
    const visibles = hayFiltros
      ? await TournamentRepository.search(filtros)
      : todos;

    res.render('catalogo', {
      tituloPagina: 'Torneos de ajedrez en México',
      filtros,
      hayFiltros,
      resultados: visibles.map(aTarjeta),
      ciudades: valoresDeFiltro(todos).ciudades,
      modalidades: valoresDeFiltro(todos).modalidades,
      secciones: hayFiltros ? null : secciones(todos)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /torneo/:id — detalle.
 * Solo torneos publicados (getById ya filtra); si no existe responde 404
 * con la misma vista de error que una ruta desconocida.
 */
rutasPublicas.get('/torneo/:id', async (req, res, next) => {
  try {
    const torneo = await TournamentRepository.getById(req.params.id);
    if (!torneo) {
      res.status(404).render('error', {
        tituloPagina: 'Torneo no encontrado',
        mensaje: 'El torneo no existe o ya no está disponible.'
      });
      return;
    }
    res.render('torneo', {
      tituloPagina: torneo.nombre,
      torneo: aDetalle(torneo)
    });
  } catch (err) {
    next(err);
  }
});
