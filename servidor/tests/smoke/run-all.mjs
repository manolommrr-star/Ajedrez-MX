/**
 * Runner de los smokes del servidor (npm test).
 * Mismo patrón que app/tests/smoke/run-all.mjs: un proceso por archivo,
 * resumen final "N PASS / M FAIL en K archivos" y exit code != 0 si falla.
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
