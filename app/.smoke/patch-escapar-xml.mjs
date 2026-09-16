/** Script: actualiza el formato XML para usar <Players> y <Player> */
import { readFileSync, writeFileSync } from 'fs';

const f = 'c:\\Users\\t\\Desktop\\ajedrez\\app\\src\\integrations\\swissManagerExport.js';
let c = readFileSync(f, 'utf8');

// Reemplazar la generación del XML
const oldXml = `    const xml = [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<Tournament>',
      `  <Name>${escaparXml(torneo.nombre)}</Name>`,
      `  <StartDate>${fechaSwiss(torneo.fecha)}</StartDate>`,
      `  <EndDate>${fechaSwiss(torneo.fecha)}</EndDate>`,
      `  <Rounds>${torneo.rondas || 7}</Rounds>`,
      `  <TimeControl>${escaparXml(torneo.ritmo || '15+10')}</TimeControl>`,
      `  <Place>${escaparXml(torneo.sede || torneo.ciudad || '')}</Place>`,
      '  <Participants>',
      ...partidas,
      '  </Participants>',
      '</Tournament>'
    ];`;

const newXml = `    const xml = [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<Players>',
      ...partidas,
      '</Players>'
    ];`;

if (c.includes(oldXml)) {
  c = c.replace(oldXml, newXml);
  writeFileSync(f, c);
  console.log('XML actualizado: <Players>/<Player>');
} else {
  console.log('No se encontró el patrón XML');
}



