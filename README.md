# AjedrezMX — Plataforma de torneos de ajedrez (Vue 3 + Vite)

Plataforma web para buscar, publicar e inscribirse en torneos de ajedrez en
México. La app es **Vue 3 + Vue Router (hash) + Vite** y usa datos de
demostración locales que ya tienen la forma de las tablas de
`supabase/schema.sql` (backend todavía sin conectar).

## Cómo ejecutar

```bash
cd app
npm install
npm run dev       # servidor de desarrollo en http://localhost:5173
npm run build     # build de producción en app/dist (base relativa, listo para GitHub Pages)
npm run preview   # sirve localmente el build
```

Nota: ejecuta los comandos tal cual, **sin comentarios al final de la línea**;
en cmd.exe de Windows el carácter `#` no inicia un comentario y se pasaría
a Vite como argumento (haría que busque el proyecto en una carpeta `#`).

## Rutas (hash)

| Ruta                            | Contenido                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| `#/`                          | Catálogo con hero, buscador y filtros                                              |
| `#/torneo/:id`                | Detalle con categorías y panel de inscripción                                     |
| `#/torneo/:id/inscribirse`    | Formulario de inscripción                                                          |
| `#/mis-inscripciones`         | Inscripciones del jugador + cancelación temprana                                   |
| `#/registro` · `#/acceder` | Cuentas con rol (jugador/organizador)                                               |
| `#/panel`                     | Resumen con estadísticas, "mis torneos" y últimos pagos                           |
| `#/panel/torneos`             | Torneos del organizador (publicado/borrador) con acciones                           |
| `#/panel/crear`               | Formulario de creación de torneo                                                   |
| `#/panel/torneo/:id/editar`   | Formulario precargado                                                               |
| `#/panel/torneo/:id`          | Detalle con pestañas: General, Inscripciones, Participantes, Check-in y Pagos      |

El panel exige una cuenta con rol **organizador**: la guardia vive en
`app/src/router/index.js` y redirige a `#/acceder` (sin sesión) o a
`#/mis-inscripciones` (sesión de jugador).

Las pestañas Inscripciones, Participantes, Check-in y Pagos son componentes
dentro del detalle del torneo, no rutas independientes.

## Qué incluye

### Marketplace (torneos)

- Página principal con hero, buscador y filtros (ciudad y modalidad).
- Secciones: torneos destacados, cercanos (próximos 45 días) y próximos.
- Tarjetas de torneo: nombre, fecha, ciudad/estado, modalidad, sistema,
  precio (desde), lugares disponibles y botón "Ver torneo".
- Página de detalle: descripción, características, categorías con precio,
  cupo, organizador y botón "Inscribirme" que abre el formulario de inscripción.

### Panel de organizador

Maqueta navegable con datos ficticios en memoria (no escribe en Supabase):

| Sección           | Contenido                                                                                                                                                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inicio             | Resumen con estadísticas, "mis torneos" y últimos pagos                                                                                                                                                                                       |
| Torneos            | Listado de torneos del organizador (publicado/borrador) con publicar, despublicar, cancelar y duplicar                                                                                                                                          |
| Crear / Editar     | Formulario de torneo con categorías y precios                                                                                                                                                                                                  |
| Detalle del torneo | Pestaña Inscripciones (validar pago → confirmar → check-in), Participantes (FIDE ID/Elo/federación + buscador +**Exportar TXT/XML/CSV Swiss-Manager** y CSV de check-in), Check-in y Pagos (estados: pagado, pendiente, procesando…) |
| Configuración     | Opciones de pagos y QR como maqueta visual                                                                                                                                                                                                      |

### Cuentas y flujo del jugador

| Ruta                         | Contenido                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `#/registro`               | **Crear cuenta con rol**: jugador u organizador (correo + contraseña) |
| `#/acceder`                | Iniciar sesión + accesos rápidos a las cuentas demo                        |
| `#/torneo/:id/inscribirse` | Formulario: categoría del torneo + datos del jugador                        |
| `#/mis-inscripciones`      | Inscripciones del jugador con estado y cancelación temprana                 |

- Las cuentas son un mock de `auth.users + profiles`: correo con formato válido,
  contraseña de mínimo 8 caracteres (guardada solo como hash SHA-256) y rol
  `player | organizer`; se conservan en `localStorage` del navegador.
- Cuentas demo preinstaladas (contraseña `demo1234`): jugador `ana.torres@correo.mx`
  y organizador `contacto@ajedrezxalapa.mx`.
- Al registrarse como organizador, el panel se adapta a esa cuenta: sus torneos,
  pagos y eventos parten vacíos y todo lo que cree le pertenece. Sin sesión, el
  panel del club demo no es accesible porque la guardia exige rol organizador.
- Las inscripciones aplican las reglas del esquema: torneo publicado, cupo
  disponible, una inscripción por jugador/torneo y categoría válida; cada cambio
  de estado queda en el historial (mock de `registration_historial`).

El panel es un **dashboard con barra lateral**:

- **Mobile**: sidebar oculto que se abre con botón hamburguesa, con fondo oscurecido.
- **Desktop (≥900px)**: sidebar fijo a la izquierda.
- Header superior con botón hamburguesa, título de sección y nombre del organizador.
- Contenido con tarjetas de estadísticas, tarjetas de torneo con acciones, tablas
  responsivas y formularios. Sin emojis, paleta de colores básica.

## Estructura de carpetas

```
Ajedrez-MX/
├── app/                           → aplicación Vue 3 + Vite
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .smoke/
│   │   └── smoke-swiss.mjs        → smoke test de la exportación a Swiss Manager
│   └── src/
│       ├── main.js                → punto de entrada
│       ├── App.vue                → layout general
│       ├── config.js              → constantes de la app
│       ├── router/                → rutas hash + guardia de organizador
│       ├── components/            → AppBarra, AppPie, TarjetaTorneo, TablaBase,
│       │                           EstadoInsignia, AvisoToast
│       ├── composables/           → useSesion, useAviso
│       ├── data/                  → mocks con la forma de supabase/schema.sql
│       │   ├── mockRelacional.js
│       │   ├── mockRelacionalTorneos.js
│       │   ├── mockRelacionalJugadores.js
│       │   └── catalogoCategorias.js
│       ├── core/                  → dominio (fuente de verdad)
│       │   ├── eventsRepository.js
│       │   ├── playersRepository.js       → búsqueda + crearJugador
│       │   ├── registrationsRepository.js → estados, transiciones, historial
│       │   ├── sesion.js                  → sesión por cuenta
│       │   ├── cuentasRepository.js       → mock auth.users + profiles
│       │   └── paymentsRepository.js
│       ├── integrations/          → adaptadores externos (desacoplados)
│       │   └── swissManagerExport.js → TXT/XML/CSV para Swiss Manager
│       ├── repositories/          → única puerta de acceso a datos
│       │   ├── mockTournamentProvider.js → proveedor local
│       │   ├── tournamentRepository.js   → catálogo
│       │   └── organizadorRepository.js  → panel (delega en core/)
│       ├── styles/                → base.css, layout.css, responsive.css, tema.css
│       ├── utils/                 → cp1252, formatters, ids
│       └── views/                 → páginas públicas + views/panel/ del panel
├── docs/                          → documentación técnica
└── supabase/
    └── schema.sql                 → esquema canónico: events, tournaments,
                                     categories, players, registrations,
                                     payments, checkins, registration_historial + RLS
```

## Validación

- `npm run build` (dentro de `app/`) compila sin errores.
- `node app/.smoke/smoke-swiss.mjs` verifica la exportación a Swiss Manager
  (codificación cp1252, separadores, estados exportados y XML).

## Cómo se preparó la migración a Supabase

- Las vistas **nunca consultan el origen de datos directamente**:
  - el catálogo pasa por `TournamentRepository` (`getAll`, `getById`, `search`);
  - el panel pasa por `OrganizadorRepository` (async, delega en `app/src/core/`).
- `supabase/schema.sql` es el **esquema canónico**: events → tournaments →
  categories, players → registrations → payments → checkins, más la tabla de
  auditoría `registration_historial` y políticas RLS (público solo lee lo
  publicado; el jugador solo su registro; el organizador gestiona lo suyo;
  los pagos solo se escriben desde edge functions con service_role).
- Los mocks (`app/src/data/mockRelacional*.js`) ya tienen la forma de esas tablas.
- Para conectar Supabase solo se necesita:
  1. Crear el proyecto y aplicar `supabase/schema.sql`.
  2. Implementar el origen Supabase dentro de `app/src/core/` y
     `app/src/repositories/` con las mismas interfaces (sin tocar las vistas).

## Modelo de datos (Supabase · esquema canónico en `supabase/schema.sql`)

- `profiles` — 1:1 con auth.users; rol player|organizer|admin
- `events` — nombre, sede, ciudad/estado, fechas, estado_publicacion
- `tournaments` — evento_id?, organizador_id, grupo, sede, modalidad, sistema,
  rondas, ritmo, cupo, destacado, estado_publicacion + referencias externas
  `swiss_manager_event_id`, `chess_results_id`, `chess_results_url`
- `categories` — filas por torneo (nombre, precio, cupo, elo_min/max)
- `players` — entidad independiente (NO se duplica por torneo): nombre,
  apellidos, fide_id, federación, club, elo, título, contacto
- `registrations` — player_id × torneo_id; estado flexible:
  pendiente | pago_pendiente | pago_en_revision | pagada | confirmada |
  cancelada | rechazada | checkin | retirada (con historial de auditoría)
- `payments` — registration_id, monto, método, referencia, comprobante,
  proveedor, estado; escritura solo desde edge function (webhook)
- `checkins` — asistencia por inscripción (solo organizador)

## Próximas etapas (fuera de este prototipo)

1. Conexión a Supabase: aplicar `supabase/schema.sql`, Auth con roles
   (player/organizer/admin; la demo ya simula el registro con rol) y origen
   Supabase en `app/src/core/` (sin tocar vistas).
2. Registro online del jugador: el flujo ya existe como demo (perfil, inscripción
   con validación de cupo/duplicados, historial y cancelación temprana); con
   uSupabase se apoya en la RLS "Jugador se inscribe en torneos abiertos".
3. Pasarela de pagos (Mercado Pago) con confirmación por webhook/edge function
   (nunca por retorno del cliente) y QR por inscripción pagada.
4. Importación de resultados desde Swiss-Manager (Nivel 2) y reportes SQL.
5. La plataforma NO clona Swiss-Manager (deporte) ni Chess-Results
   (publicación): solo integra por exportación y enlaces de referencia.
