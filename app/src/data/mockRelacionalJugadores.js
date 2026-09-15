/**
 * Jugadores e inscripciones de demostración (Etapa 2 · relacional).
 * Reflejan las tablas players / registrations / payments del esquema
 * canónico (supabase/schema.sql).
 *
 * El jugador es una ENTIDAD INDEPENDIENTE del torneo: la misma persona
 * puede aparecer en varias inscripciones sin duplicarse.
 */
export const JUGADORES_DEMO = [
  { id: 'j1', nombre: 'Ana', apellidos: 'Torres', fechaNacimiento: '1994-05-12', fideId: '5123456', federacion: 'FENAMAC', club: 'Club de Ajedrez Xalapa', elo: 1540, titulo: null, email: 'ana.torres@correo.mx', telefono: '2281112233', ciudad: 'Xalapa', estado: 'Veracruz', fechaCreacion: '2026-08-10' },
  { id: 'j2', nombre: 'Luis', apellidos: 'Ramírez', fechaNacimiento: '2001-11-03', fideId: '5123457', federacion: 'FENAMAC', club: 'Club Coatepec', elo: 1205, titulo: null, email: 'luis.ramirez@correo.mx', telefono: '2282223344', ciudad: 'Coatepec', estado: 'Veracruz', fechaCreacion: '2026-08-12' },
  { id: 'j3', nombre: 'María', apellidos: 'Gutiérrez', fechaNacimiento: '1990-02-25', fideId: '5123458', federacion: 'FENAMAC', club: 'Club Veracruz', elo: 1430, titulo: null, email: 'maria.gutierrez@correo.mx', telefono: '2293334455', ciudad: 'Veracruz', estado: 'Veracruz', fechaCreacion: '2026-08-14' },
  { id: 'j4', nombre: 'Pedro', apellidos: 'Sánchez', fechaNacimiento: '2014-07-19', fideId: '5123459', federacion: 'FENAMAC', club: null, elo: 980, titulo: null, email: null, telefono: null, ciudad: 'Orizaba', estado: 'Veracruz', fechaCreacion: '2026-08-20' },
  { id: 'j5', nombre: 'Rosa', apellidos: 'Hernández', fechaNacimiento: '2003-09-08', fideId: '5123460', federacion: 'FENAMAC', club: 'Club de Ajedrez Xalapa', elo: 1100, titulo: null, email: 'rosa.hdz@correo.mx', telefono: '2284445566', ciudad: 'Xalapa', estado: 'Veracruz', fechaCreacion: '2026-08-15' },
  { id: 'j6', nombre: 'José', apellidos: 'Medina', fechaNacimiento: '1987-01-30', fideId: '5123461', federacion: 'FENAMAC', club: 'Club Tuxpan', elo: 1608, titulo: 'MN', email: 'jose.medina@correo.mx', telefono: '2285556677', ciudad: 'Tuxpan', estado: 'Veracruz', fechaCreacion: '2026-08-22' },
  { id: 'j7', nombre: 'Claudia', apellidos: 'Nava', fechaNacimiento: '2002-04-17', fideId: '5123462', federacion: 'FENAMAC', club: 'Club de Ajedrez Xalapa', elo: 1270, titulo: null, email: 'claudia.nava@correo.mx', telefono: '2286667788', ciudad: 'Xalapa', estado: 'Veracruz', fechaCreacion: '2026-08-24' },
  { id: 'j8', nombre: 'Renata', apellidos: 'Flores', fechaNacimiento: '2015-12-01', fideId: '5123463', federacion: 'FENAMAC', club: null, elo: 1010, titulo: null, email: null, telefono: null, ciudad: 'Coatepec', estado: 'Veracruz', fechaCreacion: '2026-09-01' },
  { id: 'j9', nombre: 'Emiliano', apellidos: 'Cruz', fechaNacimiento: '2008-06-23', fideId: '5123464', federacion: 'FENAMAC', club: 'Club de Ajedrez Xalapa', elo: 1310, titulo: null, email: 'emiliano.cruz@correo.mx', telefono: '2287778899', ciudad: 'Xalapa', estado: 'Veracruz', fechaCreacion: '2026-09-06' },
  { id: 'j10', nombre: 'Valeria', apellidos: 'Ríos', fechaNacimiento: '2014-03-14', fideId: '5123465', federacion: 'FENAMAC', club: null, elo: 940, titulo: null, email: null, telefono: null, ciudad: 'Banderilla', estado: 'Veracruz', fechaCreacion: '2026-09-07' }
];
/** Inscripciones (jugador × torneo/categoría) con estados flexibles. */
export const INSCRIPCIONES_DEMO = [
  { id: 'reg1', playerId: 'j1', torneoId: 'xalapa-chess-open', eventoId: 'evento-xalapa-2027', categoria: 'General', precio: 350, estado: 'confirmada', fechaCreacion: '2026-08-15' },
  { id: 'reg2', playerId: 'j2', torneoId: 'xalapa-chess-open', eventoId: 'evento-xalapa-2027', categoria: 'Estudiante', precio: 250, estado: 'checkin', fechaCreacion: '2026-08-18' },
  { id: 'reg3', playerId: 'j3', torneoId: 'xalapa-chess-open', eventoId: 'evento-xalapa-2027', categoria: 'General', precio: 350, estado: 'pago_pendiente', fechaCreacion: '2026-09-02' },
  { id: 'reg4', playerId: 'j4', torneoId: 'xalapa-chess-open', eventoId: 'evento-xalapa-2027', categoria: 'Infantil (sub 12)', precio: 200, estado: 'confirmada', fechaCreacion: '2026-08-25' },
  { id: 'reg5', playerId: 'j5', torneoId: 'xalapa-chess-open', eventoId: 'evento-xalapa-2027', categoria: 'Estudiante', precio: 250, estado: 'cancelada', fechaCreacion: '2026-08-20' },
  { id: 'reg6', playerId: 'j6', torneoId: 'xalapa-chess-open', eventoId: 'evento-xalapa-2027', categoria: 'General', precio: 350, estado: 'pagada', fechaCreacion: '2026-09-05' },
  { id: 'reg7', playerId: 'j7', torneoId: 'xalapa-chess-open', eventoId: 'evento-xalapa-2027', categoria: 'Estudiante', precio: 250, estado: 'confirmada', fechaCreacion: '2026-08-28' },
  { id: 'reg8', playerId: 'j8', torneoId: 'xalapa-chess-open', eventoId: 'evento-xalapa-2027', categoria: 'Infantil (sub 12)', precio: 200, estado: 'pago_pendiente', fechaCreacion: '2026-09-08' },
  { id: 'reg9', playerId: 'j9', torneoId: 'copa-juvenil-xalapa', eventoId: 'evento-xalapa-2027', categoria: 'Juvenil (sub 18)', precio: 200, estado: 'confirmada', fechaCreacion: '2026-09-11' },
  { id: 'reg10', playerId: 'j10', torneoId: 'copa-juvenil-xalapa', eventoId: 'evento-xalapa-2027', categoria: 'Infantil (sub 12)', precio: 150, estado: 'confirmada', fechaCreacion: '2026-09-12' }
];

/** Pagos de demostración (véase tabla payments). */
export const PAGOS_DEMO = [
  { id: 'pay1', folio: 'FOLIO-1001', registrationId: 'reg1', torneoId: 'xalapa-chess-open', playerId: 'j1', torneo: 'Xalapa Chess Open', jugador: 'Ana Torres', monto: 350, proveedor: 'Mercado Pago', estado: 'pagado', fecha: '2026-08-15' },
  { id: 'pay2', folio: 'FOLIO-1002', registrationId: 'reg2', torneoId: 'xalapa-chess-open', playerId: 'j2', torneo: 'Xalapa Chess Open', jugador: 'Luis Ramírez', monto: 250, proveedor: 'Mercado Pago', estado: 'pagado', fecha: '2026-08-18' },
  { id: 'pay3', folio: 'FOLIO-1004', registrationId: 'reg4', torneoId: 'xalapa-chess-open', playerId: 'j4', torneo: 'Xalapa Chess Open', jugador: 'Pedro Sánchez', monto: 200, proveedor: 'Mercado Pago', estado: 'pagado', fecha: '2026-08-25' },
  { id: 'pay4', folio: 'FOLIO-1005', registrationId: 'reg5', torneoId: 'xalapa-chess-open', playerId: 'j5', torneo: 'Xalapa Chess Open', jugador: 'Rosa Hernández', monto: 250, proveedor: 'Mercado Pago', estado: 'reembolsado', fecha: '2026-08-22' },
  { id: 'pay5', folio: 'FOLIO-1007', registrationId: 'reg7', torneoId: 'xalapa-chess-open', playerId: 'j7', torneo: 'Xalapa Chess Open', jugador: 'Claudia Nava', monto: 250, proveedor: 'Mercado Pago', estado: 'pagado', fecha: '2026-08-28' },
  { id: 'pay6', folio: 'FOLIO-1006', registrationId: 'reg6', torneoId: 'xalapa-chess-open', playerId: 'j6', torneo: 'Xalapa Chess Open', jugador: 'José Medina', monto: 350, proveedor: 'Mercado Pago', estado: 'pagado', fecha: '2026-09-05' },
  { id: 'pay7', folio: 'FOLIO-1003', registrationId: 'reg3', torneoId: 'xalapa-chess-open', playerId: 'j3', torneo: 'Xalapa Chess Open', jugador: 'María Gutiérrez', monto: 350, proveedor: 'Mercado Pago', estado: 'procesando', fecha: '2026-09-09' },
  { id: 'pay8', folio: 'FOLIO-1009', registrationId: 'reg9', torneoId: 'copa-juvenil-xalapa', playerId: 'j9', torneo: 'Copa Juvenil Xalapa', jugador: 'Emiliano Cruz', monto: 200, proveedor: 'Mercado Pago', estado: 'pagado', fecha: '2026-09-11' },
  { id: 'pay9', folio: 'FOLIO-1010', registrationId: 'reg10', torneoId: 'copa-juvenil-xalapa', playerId: 'j10', torneo: 'Copa Juvenil Xalapa', jugador: 'Valeria Ríos', monto: 150, proveedor: 'Mercado Pago', estado: 'pagado', fecha: '2026-09-12' },
  { id: 'pay10', folio: 'FOLIO-1008', registrationId: 'reg8', torneoId: 'xalapa-chess-open', playerId: 'j8', torneo: 'Xalapa Chess Open', jugador: 'Renata Flores', monto: 200, proveedor: 'Mercado Pago', estado: 'pendiente', fecha: '2026-09-10' }
];