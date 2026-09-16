import { SwissManagerExport } from '../src/integrations/swissManagerExport.js';

// Generar y mostrar el XML
const xml = await SwissManagerExport.generarXml('xalapa-chess-open');
console.log('=== XML ACTUAL (con atributos) ===');
console.log(xml);
console.log('=== FIN XML ===');

console.log('\n=== XML ALTERNATIVO (con elementos hijos) ===');
const xmlAlt = `<?xml version="1.0" encoding="utf-8"?>
<Players>
    <Player>
        <Surname>Medina</Surname>
        <Firstname>José</Firstname>
        <Federation>MEX</Federation>
        <Oid>5123461</Oid>
        <Title></Title>
        <Sex></Sex>
        <Birthday>30.01.1987</Birthday>
        <Club>Club Tuxpan</Club>
    </Player>
    <Player>
        <Surname>Nava</Surname>
        <Firstname>Claudia</Firstname>
        <Federation>MEX</Federation>
        <Oid>5123462</Oid>
        <Title></Title>
        <Sex>F</Sex>
        <Birthday>17.04.2002</Birthday>
        <Club>Club de Ajedrez Xalapa</Club>
    </Player>
    <Player>
        <Surname>Sánchez</Surname>
        <Firstname>Pedro</Firstname>
        <Federation>MEX</Federation>
        <Oid>5123459</Oid>
        <Title></Title>
        <Sex>M</Sex>
        <Birthday>19.07.2014</Birthday>
        <Club></Club>
    </Player>
    <Player>
        <Surname>Ramírez</Surname>
        <Firstname>Luis</Firstname>
        <Federation>MEX</Federation>
        <Oid>5123457</Oid>
        <Title></Title>
        <Sex>M</Sex>
        <Birthday>03.11.2001</Birthday>
        <Club>Club Coatepec</Club>
    </Player>
    <Player>
        <Surname>Torres</Surname>
        <Firstname>Ana</Firstname>
        <Federation>MEX</Federation>
        <Oid>5123456</Oid>
        <Title></Title>
        <Sex>F</Sex>
        <Birthday>12.05.1994</Birthday>
        <Club>Club de Ajedrez Xalapa</Club>
    </Player>
</Players>`;
console.log(xmlAlt);
console.log('=== FIN XML ALTERNATIVO ===');