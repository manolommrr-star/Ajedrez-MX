/**
 * Configuración de Express: plantillas EJS, estáticos y rutas.
 *
 * Elegimos Express + EJS (render en servidor) para migrar el frontend Vue
 * vista a vista: cada ruta HTTP equivale a una ruta hash del SPA.
 * Aquí NO hay lógica de negocio; vive en ../puente y, de momento, en la
 * app Vue (migración gradual, ver README de esta carpeta).
 */
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rutasPublicas } from './rutas/publicas.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));

/** Carpeta de la app Vue de la que todavía provienen CSS, favicon y datos. */
const CARPETA_APP = path.resolve(aqui, '../../app');

export function crearApp() {
  const app = express();

  // Motor de plantillas: vistas en ./vistas con extensión .ejs
  app.set('view engine', 'ejs');
  app.set('views', path.join(aqui, 'vistas'));

  // CSS y favicon COMPARTIDOS con la app Vue (una sola fuente, sin copias).
  // Orden de enlaces en la cabecera: tema → base → layout → responsive,
  // el mismo que usa app/src/main.js.
  app.use('/estilos', express.static(path.join(CARPETA_APP, 'src/styles')));
  app.use(express.static(path.join(CARPETA_APP, 'public')));

  // Rutas de contenido (catálogo y detalle).
  app.use(rutasPublicas);

  // 404: cualquier GET sin ruta conocida responde la vista de error.
  app.use((req, res) => {
    res.status(404).render('error', {
      tituloPagina: 'Página no encontrada',
      mensaje: 'La ruta que buscas no existe o ya no está disponible.'
    });
  });

  // 500: errores inesperados de una ruta (se registran en consola).
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).render('error', {
      tituloPagina: 'Error interno',
      mensaje: 'Ocurrió un problema al cargar la página. Inténtalo de nuevo.'
    });
  });

  return app;
}
