// Smoke test: exportación TXT a Swiss Manager (cp1252, tabs, CRLF)
import { aCp1252 } from '../src/utils/cp1252.js';
import { SwissManagerExport } from '../src/integrations/swissManagerExport.js';

// Shims de navegador (localStorage) mínimos para los repos.
globalThis.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };

let fallos = 0;
const check = (nombre, cond) => {
  console.log((cond ? 'OK  ' : 'FAIL') + ' ' + nombre);
  if (!cond) fallos++;
};

// 1. cp1252: acentos y ñ
const bytes = aCp1252('árbol Ramírez Ñúñez Gutiérrez');
const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join(' ');
check('á → 0xE1', hex.includes('e1'));
check('ñ → 0xF1', hex.includes('f1'));
check('É → 0xC9', Array.from(aCp1252('É')).includes(0xc9));
check('ASCII intacto', Array.from(aCp1252('abc XYZ')).slice(0, 3).join() === '97,98,99');
check('no representable → ?', aCp1252('日本')[0] === 0x3f);

// 2. TXT del torneo Xalapa (jugables: reg1 confirmada, reg2 checkin,
//    reg4 confirmada, reg6 pagada, reg7 confirmada → 5; reg3 pago_pendiente,
//    reg5 cancelada y reg8 pago_pendiente quedan fuera).
const { bytes: txtBytes, cuenta, advertencias } = await SwissManagerExport.generarTxt('xalapa-chess-open');
const texto = Buffer.from(txtBytes).toString('latin1');
const lineas = texto.split('\r\n');
check('CRLF presente', texto.includes('\r\n') && !texto.replace(/\r\n/g, '').includes('\n'));
check('cabecera con 11 columnas', lineas[0].split('\t').length === 11);
check('cabecera correcta', lineas[0] === 'Apellidos\tNombre\tFederacion\tFIDE ID\tElo\tTitulo\tSexo\tFechaNacimiento\tClub\tCiudad\tCategoria');
check('solo estados jugables (5)', cuenta === 5);
check('reg5 cancelada excluida', !texto.includes('Rosa'));
check('reg8 pago_pendiente excluida', !texto.includes('Renata'));

// 3. Normalizadores en la fila de Ana Torres (reg1: FENAMAC, 1994-05-12, sin título)
const filaAna = lineas.find((l) => l.startsWith('Torres\tAna'));
check('Ana presente', !!filaAna);
check('FENAMAC → MEX', filaAna.includes('\tMEX\t'));
check('fecha → 12.05.1994', filaAna.includes('12.05.1994'));
check('elo 1540', filaAna.includes('\t1540\t'));
check('título vacío', !/\t(GM|IM|FM|CM|MN)\t/.test(filaAna));

// 4. José Medina tiene título 'MN' → no debe aparecer como título FIDE
const filaJose = lineas.find((l) => l.startsWith('Medina\tJos'));
check('MN de José no exportado', filaJose && filaJose.split('\t')[5] === '');

// 5. Acentos legibles en cp1252 (decodificación latin1 del Buffer)
check('Ramírez legible', texto.includes('Ramírez'));
check('José legible', texto.includes('José'));

// 6. Advertencias: Pedro (j4) no tiene club
check('advertencia sin club para Pedro', advertencias.some((a) => a.includes('Pedro') && a.includes('club')));

// 7. incluirTodos trae los 8 inscritos del torneo
const todos = await SwissManagerExport.generarTxt('xalapa-chess-open', { incluirTodos: true });
check('incluirTodos = 8', todos.cuenta === 8);

// 8. Copa juvenil (2 inscritos confirmados)
const copa = await SwissManagerExport.generarTxt('copa-juvenil-xalapa');
check('copa juvenil = 2', copa.cuenta === 2);

// 9. XML de exportación
const xmlStr = await SwissManagerExport.generarXml('xalapa-chess-open');
check('XML raíz <Players>', xmlStr.includes('<Players>'));
check('XML cierra </Players>', xmlStr.includes('</Players>'));
check('XML <Player', xmlStr.includes('<Player>'));
check('XML versión xml', xmlStr.includes('<?xml version="1.0"'));
check('XML FENAMAC → MEX', xmlStr.includes('<Federation>MEX</Federation>'));
check('XML Ana - Surname', xmlStr.includes('<Surname>Torres</Surname>'));
check('XML Ana - Firstname', xmlStr.includes('<Firstname>Ana</Firstname>'));
check('XML 5 players', (xmlStr.match(/<Player>/g) || []).length === 5);

console.log(fallos === 0 ? '\nSMOKE OK' : `\nSMOKE con ${fallos} fallo(s)`);
process.exit(fallos === 0 ? 0 : 1);
