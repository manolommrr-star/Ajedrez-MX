/**
 * Punto de entrada del servidor.
 *
 * Aquí NO hay lógica de negocio: solo arranca Express (ver app.js) en el
 * puerto indicado. Si el puerto cambia entre entornos, se pasa con la
 * variable de entorno PUERTO sin tocar código.
 */
import { crearApp } from './app.js';

const PUERTO = Number(process.env.PUERTO) || 3000;

const app = crearApp();

app.listen(PUERTO, () => {
  console.log(`AjedrezMX escuchando en http://localhost:${PUERTO}`);
});
