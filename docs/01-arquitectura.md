# Arquitectura del Sistema

## Visión general
App web progresiva para gestión de torneos de ajedrez. Usa **vanilla JS + ES modules** (sin frameworks) con arquitectura por capas.

## Capas del sistema
1. **UI** → `js/views/` (páginas) + `js/ui/` (componentes reusables)
2. **Core** → `js/core/` (lógica de negocio, repositorios)
3. **Datos** → `js/data/` (mocks) + Supabase (futuro)
4. **Integraciones** → `js/integrations/` (CSV, Chess-Results)
5. **Utilidades** → `js/utils/` (helpers: format, ids, etc.)

## Archivos clave
- `js/app.js` → router principal y navegación
- `js/config.js` → URLs, constantes de la app
- `index.html` → contenedor raíz + header dinámico
- `css/styles.css` → tema claro básico

## Flujo principal
Catálogo → Detalle torneo → Registro/Jugador → Pago → Check-in

## Enrutado (hash routes)
- `#/` → catálogo público
- `#/torneo/:id` → detalle torneo
- `#/torneo/:id/inscribirse` → formulario jugador
- `#/pagar/:folio` → checkout demo
- `#/panel/*` → panel organizador (requiere sesión organizador)
- `#/mis-inscripciones` → historial jugador

Próximo doc: [02-nucleo.md](02-nucleo.md)