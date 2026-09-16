/** Script: corrige atributo 'live' a 'title' en el XML */
import { readFileSync, writeFileSync } from 'fs';

const f = 'c:\\Users\\t\\Desktop\\ajedrez\\app\\src\\integrations\\swissManagerExport.js';
let c = readFileSync(f, 'utf8');

if (c.includes('`live="${tituloSwiss')) {
  c = c.replace('`live="${tituloSwiss', '`title="${tituloSwiss');
  writeFileSync(f, c);
  console.log('Atributo live → title corregido');
} else {
  console.log('No se encontró live');
}



