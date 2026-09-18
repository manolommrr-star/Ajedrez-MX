# Arquitectura del Sistema

## Visión general
App web progresiva para gestión de torneos de ajedrez. Está construida con
**Vue 3 + Vue Router (hash) + Vite** y arquitectura por capas. El objetivo de
datos es **Supabase** (hoy con mocks locales que replican el esquema).

## Capas del sistema
1. **UI** → `app/src/views/` (páginas) + `app/src/components/` (reusables)
2. **Core** → `app/src/core/` (lógica de negocio, repositorios)
3. **Datos** → `app/src/data/` (mocks) + Supabase (futuro)
4. **Integraciones** → `app/src/integrations/` (exportación Swiss Manager)
5. **Utilidades** → `app/src/utils/` (cp1252, formatters, ids)

Las vistas nunca consultan el origen de datos directamente: pasan por
`app/src/repositories/`.

## Archivos clave
- `app/src/main.js` → punto de entrada de la aplicación
- `app/src/router/index.js` → rutas hash + guardia de organizador
- `app/src/App.vue` → layout (barra superior, router-view, toast)
- `app/src/config.js` → URLs y constantes de la app
- `app/src/styles/` → base.css, layout.css, responsive.css, tema.css

## Flujo principal
Catálogo → Detalle torneo → Inscripción → Pago → Check-in

## Enrutado (hash routes)
- `#/` → catálogo público
- `#/torneo/:id` → detalle torneo
- `#/torneo/:id/inscribirse` → formulario jugador
- `#/pagar/:folio` → checkout demo
- `#/panel/*` → panel organizador (requiere sesión organizador)
- `#/mis-inscripciones` → historial jugador

Próximo doc: [02-nucleo.md](02-nucleo.md)