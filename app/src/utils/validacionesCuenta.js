/**
 * Validaciones de CUENTA compartidas (registro, Mi cuenta y recuperación).
 * Fuente única: si cambia una regla, cambia para todas las vistas.
 */

/** Correo con forma válida. */
export function esCorreo(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || '').trim());
}

/** Regla de contraseña: mínimo 8 caracteres. Devuelve el motivo o ''. */
export function claveAceptable(clave) {
  if (String(clave || '').length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  return '';
}
