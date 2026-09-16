/** Script: elimina duplicados de descargarBytes y nombreArchivo al final del archivo */
import { readFileSync, writeFileSync } from 'fs';

const f = 'c:\\Users\\t\\Desktop\\ajedrez\\app\\src\\integrations\\swissManagerExport.js';
let c = readFileSync(f, 'utf8');

// Eliminar el bloque duplicado al final (lineas 283-302)
const dupStart = c.indexOf('/** Descarga segura de un Blob en el navegador. */');
if (dupStart !== -1) {
  c = c.substring(0, dupStart).trimEnd();
  writeFileSync(f, c);
  console.log('Duplicado eliminado');
} else {
  console.log('No se encontró el duplicado');
}



