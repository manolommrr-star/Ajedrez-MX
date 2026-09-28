# AjedrezMX · Servidor Node.js (migración del frontend)

Este carpeta recrea el comportamiento del frontend Vue (`app/`) **con Node.js**,
vista a vista, sin frameworks de frontend: **Express + EJS** (HTML renderizado
en el servidor). La prioridad desde el primer archivo es que el código sea
fácil de leer y de documentar.

## Cómo ejecutar

```bash
cd servidor
npm install       # una sola vez
npm run dev       # servidor con recarga automática en http://localhost:3000
npm start         # arranque normal (puerto con la variable PUERTO, por defecto 3000)
npm test          # smokes → "Total: N PASS / 0 FAIL en 2 archivos"
```

En Windows, desde scripts/atajos usa `npm.cmd` (no `npm`).

## Estructura (y qué leer primero)

```
servidor/
  package.json            Express + EJS; scripts dev / start / test
  src/
    index.js              arranca el servidor (solo puerto y listen)
    app.js                configuración de Express: vistas, estáticos, 404, 500
    rutas/publicas.js     GET / (catálogo) y GET /torneo/:id (detalle)
    modelos.js            torneo crudo → objeto listo para plantilla
    puente/torneos.js     ÚNICO archivo que importa datos de ../../app/src
    vistas/
      partials/cabecera.ejs   <head> + barra superior (layout compartido)
      partials/pie.ejs        pie de página
      partials/tarjeta.ejs    tarjeta de torneo del catálogo
      catalogo.ejs            página principal (hero, filtros, secciones)
      torneo.ejs              detalle de torneo
      error.ejs               vistas de error (404 y 500)
  tests/smoke/
    01-catalogo.mjs       rutas, filtros, 404 y contenido del HTML
    02-sesion.mjs         contrato de rutas, escaping e inyección
    run-all.mjs           runner de npm test (mismo patrón que app/)
```

Orden de lectura sugerido: `index.js` → `app.js` → `rutas/publicas.js` →
`modelos.js` → una vista (`catalogo.ejs`).

## Reglas de la casa (iguales al resto del repo)

- Todo en español: nombres de archivo, variables, comentarios y mensajes.
- Los comentarios explican el **por qué**, no el qué.
- Las plantillas **no calculan nada**: todo dato derivado nace en `modelos.js`.
- La lógica de negocio no vive en las rutas: hoy viene del puente; mañana, de
  los repositorios de esta carpeta.
- `puente/torneos.js` es el único punto que toca `app/src` (datos, formatos,
  constantes). Cambiar el origen de los datos = cambiar ese archivo.

## Equivalencias con el SPA (para migrar vista a vista)

| Vue (app/)                      | Node (servidor/)                      |
| ------------------------------- | ------------------------------------- |
| `#/` (hash)                     | `GET /` (query: `?texto=&ciudad=&modalidad=`) |
| `#/torneo/:id`                  | `GET /torneo/:id`                     |
| Filtros reactivos en cliente    | Formulario GET + filtrado en servidor |
| `CatalogoView.vue`              | `vistas/catalogo.ejs`                 |
| `TorneoDetalleView.vue`         | `vistas/torneo.ejs`                   |
| `TarjetaTorneo.vue`             | `vistas/partials/tarjeta.ejs`         |
| `AppBarra.vue` / `AppPie.vue`   | `partials/cabecera.ejs` / `pie.ejs`   |
| Guardas del router              | aún sin sesión: llega en fase 2       |

## Plan de migración (de a poco)

- **Fase 1 (hecha)** — catálogo + detalle + 404/500, CSS y favicon
  compartidos con `app/`, datos vía puente, 2 smokes.
- **Fase 2** — cuentas y sesión: `GET/POST /acceder`, `/registro`,
  cookies de sesión, y que la barra muestre Acceder/Salir.
- **Fase 3** — inscripción y pago: `/torneo/:id/inscribirse`, `/pagar/:folio`,
  `/mis-inscripciones` (máquina de estados de `registrationsRepository`).
- **Fase 4** — panel del organizador (`/panel/*`).
- **Fase 5** — retirar el puente: portar/mover el núcleo (`app/src/core`) a
  esta carpeta o conectar Supabase como origen único.

Mientras dure la migración, `app/` (Vue) sigue funcionando en GitHub Pages
sin cambios: esta carpeta es adicional y no toca su build ni su workflow.

## Decisiones abiertas (decidir al llegar la fase)

- Sesión: cookie firmada con `express-session` (almacén en memoria) o JWT.
- Persistencia: seguir mocks con `localStorage` simulado o pasar directo a
  Supabase (el `supabase/schema.sql` sigue siendo el esquema canónico).
- Despliegue del servidor (hoy solo local): VPS, Fly.io, Render, etc.
