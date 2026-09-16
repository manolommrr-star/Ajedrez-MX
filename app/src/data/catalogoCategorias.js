/**
 * Catálogos de categorías por defecto del sistema (Etapa 3 · opcional Supabase).
 *
 * Provee los catálogos base que el organizador puede reusar, modificar o ampliar
 * al crear un torneo. Los precios se copian al registrarse para que los cambios
 * futuros no afecten inscripciones ya creadas.
 */

/**
 * Categorías de edad estándar (pueden ser reusadas por cualquier torneo).
 * El organizador puede renamearlas y/o cambiar el precio por torneo.
 */
export const CATEGORIAS_EDAD = [
  { id: 'infantil', nombre: 'Infantil (sub 12)', precioDefault: 200, grupo: 'Edades' },
  { id: 'juvenil',  nombre: 'Juvenil (sub 18)',  precioDefault: 250, grupo: 'Edades' },
  { id: 'cadete',   nombre: 'Cadete (sub 20)',  precioDefault: 300, grupo: 'Edades' },
  { id: 'juvenil-u23', nombre: 'Juvenil U23',    precioDefault: 350, grupo: 'Edades' },
  { id: 'adulto',   nombre: 'Adulto',           precioDefault: 400, grupo: 'Edades' },
  { id: 'mayor',    nombre: 'Mayor (60+)',      precioDefault: 250, grupo: 'Edades' }
];

/**
 * Categorías por nivel/forza. Útiles para torneos con división por rating.
 */
export const CATEGORIAS_NIVEL = [
  { id: 'primera-fuerza', nombre: 'Primera Fuerza', precioDefault: 400, grupo: 'Nivel' },
  { id: 'segunda-fuerza', nombre: 'Segunda Fuerza', precioDefault: 300, grupo: 'Nivel' },
  { id: 'tercera-fuerza', nombre: 'Tercera Fuerza', precioDefault: 200, grupo: 'Nivel' },
  { id: 'principiante',   nombre: 'Principiante',   precioDefault: 150, grupo: 'Nivel' },
  { id: 'absoluto',       nombre: 'Absoluto',       precioDefault: 500, grupo: 'Nivel' }
];

/**
 * Categorías especiales comunes (exhibición, clase, etc.)
 */
export const CATEGORIAS_ESPECIAL = [
  { id: 'exhibicion', nombre: 'Exhibición', precioDefault: 0, grupo: 'Especial' },
  { id: 'clase',      nombre: 'Clase/Aprendizaje', precioDefault: 100, grupo: 'Especial' }
];

/**
 * Todas las categorías base juntas, listas para presentar al organizador
 * cuando cree o edite un torneo.
 */
export const CATALOGO_CATEGORIAS = [
  ...CATEGORIAS_EDAD,
  ...CATEGORIAS_NIVEL,
  ...CATEGORIAS_ESPECIAL
];

/**
 * Devuelve una copia de las categorías base filtradas opcionalmente por grupo.
 * Útil para el formulario de creación del torneo.
 */
export function categoriasPorGrupo(grupo = null) {
  if (!grupo) return CATALOGO_CATEGORIAS.slice();
  return CATALOGO_CATEGORIAS.filter((c) => c.grupo === grupo);
}

/**
 * Construye un array de categorías para un torneo a partir del catálogo base.
 * El organizador selecciona qué categorías usar y puede personalizar nombre y precio.
 *
 * @param seleccion - Array de ids de categoría a incluir (ej: ['adulto','juvenil'])
 * @param personalizaciones - Mapa opcional de ajustes por id:
 *   { 'adulto': { nombre: 'Maestros', precio: 500 } }
 */
export function buildCategoriasTorneo(seleccion = [], personalizaciones = {}) {
  const resultado = [];
  for (const id of seleccion) {
    const base = CATALOGO_CATEGORIAS.find((c) => c.id === id);
    if (!base) continue;
    const personalizado = personalizaciones[id] || {};
    resultado.push({
      id,
      nombre: personalizado.nombre || base.nombre,
      precio: personalizado.precio ?? base.precioDefault,
      grupo: base.grupo
    });
  }
  return resultado;
}