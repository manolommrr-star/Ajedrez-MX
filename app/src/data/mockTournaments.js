/**
 * Catálogo de torneos de demostración.
 *
 * Desde la Etapa 2 los torneos viven en datos relacionales
 * (js/data/mockRelacionalTorneos.js, objetivo Supabase).
 * Este archivo solo re-exporta para no romper los módulos existentes.
 */
import { TORNEOS_DEMO } from './mockRelacionalTorneos.js';

export const MOCK_TOURNAMENTS = TORNEOS_DEMO;
