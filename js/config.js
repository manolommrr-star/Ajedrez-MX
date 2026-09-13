/**
 * Configuración general de la aplicación.
 *
 * Etapa 2: el backend objetivo es Supabase (Postgres + RLS).
 * El prototipo sigue usando datos relacionales locales con la misma
 * forma que las tablas de supabase/schema.sql; cuando se conecte
 * Supabase solo cambiará el origen dentro de js/core/ y js/repositories/.
 */
export const AppConfig = {
  nombreApp: 'AjedrezMX',
  fuenteDatos: 'mock', // 'mock' | 'supabase' (fase 2)

  // Número de días que define la sección "Torneos cercanos".
  rangoCercanosDias: 45
};