/**
 * Runner de los smokes del dominio (npm test).
 *
 * Cada archivo es un proceso independiente: los repositorios de la demo
 * mantienen estado en memoria y en localStorage, así que mezclarlos en un
 * mismo proceso daría falsos positivos. Los archivos se ejecutan por orden
 * de nombre (prefijo 01, 02, …).
 */
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));
const archivos = readdirSync(aqui).filter((f) => /^\d\d-.*\.mjs$/.test(f)).sort();

let pass = 0;
let fail = 0;
let archivosConFallo = 0;

for (const archivo of archivos) {
  const r = spawnSync(process.execPath, [join(aqui, archivo)], { encoding: 'utf8' });
  const salida = `${r.stdout || ''}${r.stderr || ''}`;
  const resumen = salida.match(/(\d+)\s+PASS\s*\/\s*(\d+)\s+FAIL\s+de\s+(\d+)/);
  if (!resumen) {
    archivosConFallo += 1;
    console.log(`ERROR  ${archivo}: no se pudo interpretar la salida`);
    console.log(salida.split('\n').slice(-5).join('\n'));
    continue;
  }
  const [, p, f] = resumen;
  pass += Number(p);
  fail += Number(f);
  if (Number(f) > 0) archivosConFallo += 1;
  console.log(`${Number(f) > 0 ? 'FALLA ' : 'OK    '} ${archivo}: ${p} pass / ${f} fail`);
}

console.log(`\nTotal: ${pass} PASS / ${fail} FAIL en ${archivos.length} archivos`);
process.exit(archivosConFallo ? 1 : 0);
