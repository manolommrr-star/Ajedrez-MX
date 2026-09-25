/**
 * Guardas de ruta: decisión de acceso pura (sin Vue ni router), para que la
 * regla se pueda probar sola y el router solo la aplique.
 *
 * Metas de ruta:
 *   requiereSesion      → cualquier cuenta
 *   requiereOrganizador → solo organizador (panel)
 *   requiereJugador     → solo jugador (mis inscripciones)
 */

export function evaluarAcceso(meta = {}, cuenta = null) {
  const exigeSesion = Boolean(
    meta.requiereSesion || meta.requiereOrganizador || meta.requiereJugador
  );
  if (!exigeSesion) return true;
  if (!cuenta) return { nombre: 'acceder', conRedir: true };
  if (meta.requiereOrganizador && cuenta.rol !== 'organizer') {
    return { nombre: 'mis-inscripciones' };
  }
  if (meta.requiereJugador && cuenta.rol !== 'player') {
    return { nombre: 'mi-cuenta' };
  }
  return true;
}
