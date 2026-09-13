/**
 * Identificadores únicos para los datos locales (demo).
 * En Supabase los ids son uuid generados por la base (gen_random_uuid()).
 */
export function generarId(prefijo) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefijo}-${crypto.randomUUID()}`;
  }
  return `${prefijo}-${Date.now()}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}