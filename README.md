# AjedrezMX — Prototipo MVP (Etapa 2 · Supabase como objetivo)

Plataforma web para buscar, publicar e inscribirse en torneos de ajedrez en México.
Esta etapa es un **prototipo funcional con datos relacionales locales** que ya
tienen la forma de las tablas de `supabase/schema.sql` (aún sin backend conectado).

## Cómo ejecutar el prototipo

Los módulos JS (`type="module"`) requieren servirse por HTTP. Opciones:

```bash
# Opción 1 — Python
python -m http.server 8000
# luego abre http://localhost:8000

# Opción 2 — VS Code: extensión "Live Server" y clic en "Go Live"
```

Abrir `index.html` con doble clic (**file://**) NO funciona para módulos ES.

## Qué incluye esta etapa

### Marketplace (torneos)
- Página principal con hero, buscador y filtros (ciudad y modalidad).
- Secciones: torneos destacados, cercanos (próximos 45 días) y próximos.
- Tarjetas de torneo: nombre, fecha, ciudad/estado, modalidad, sistema,
  precio (desde), lugares disponibles y botón "Ver torneo".
- Página de detalle: descripción, características, categorías con precio,
  cupo, organizador y botón "Inscribirme" que abre el formulario de inscripción.

### Panel de organizador (preview)
Maqueta navegable con datos ficticios (sin guardar ni escribir en Firestore):

| Ruta | Contenido |
|---|---|
| `#/panel` | Resumen con estadísticas, "mis torneos" y últimos pagos |
| `#/panel/torneos` | Listado de torneos del organizador (publicado/borrador) |
| `#/panel/crear` | Formulario de creación (maqueta) |
| `#/panel/torneo/:id/editar` | Formulario precargado |
| `#/panel/eventos` | Mis eventos (XVIII Torneo Internacional de Xalapa…) |
| `#/panel/evento/:id` | Ficha del evento con sus torneos/grupos |
| `#/panel/torneo/:id/inscripciones` | Gestión de estados (validar pago → confirmar → check-in) |
| `#/panel/torneo/:id/participantes` | Tabla con FIDE ID/Elo/federación + buscador + **Exportar CSV Swiss-Manager** y CSV de check-in |
| `#/panel/pagos` | Pagos con estados (pagado, pendiente, procesando…) |
| `#/panel/qr` | Avance de validación QR |
| `#/panel/reportes` | Ocupación por torneo |

### Cuentas y flujo del jugador (Etapas 3–4, demo con datos locales)

| Ruta | Contenido |
|---|---|
| `#/registro` | **Crear cuenta con rol**: jugador u organizador (correo + contraseña) |
| `#/acceder` | Iniciar sesión + accesos rápidos a las cuentas demo |
| `#/torneo/:id/inscribirse` | Formulario: categoría del torneo + datos del jugador |
| `#/mis-inscripciones` | Inscripciones del jugador con estado y cancelación temprana |

- Las cuentas son un mock de `auth.users + profiles`: correo con formato válido,
  contraseña de mínimo 8 caracteres (guardada solo como hash SHA-256) y rol
  `player | organizer`; se conservan en `localStorage` del navegador.
- Cuentas demo preinstaladas (contraseña `demo1234`): jugador `ana.torres@correo.mx`
  y organizador `contacto@ajedrezxalapa.mx`.
- Al registrarse como organizador, el panel se adapta a esa cuenta: sus torneos,
  pagos y eventos parten vacíos y todo lo que cree le pertenece (con sesión de
  jugador, `#/panel` muestra un aviso). Sin sesión, el panel muestra el preview
  del club demo, como hasta ahora.
- Las inscripciones aplican las reglas del esquema: torneo publicado, cupo
  disponible, una inscripción por jugador/torneo y categoría válida; cada cambio
  de estado queda en el historial (mock de `registration_historial`).

El encabezado muestra **"Mi panel"** únicamente con una cuenta de organizador;
sin sesión o como jugador, `#/panel` muestra un aviso con los accesos (publicar
y gestionar es exclusivo del rol organizador). Para navegar el panel del club
demo, entra con su cuenta demo (contraseña `demo1234`).

El panel es un **dashboard con barra lateral**:
- **Mobile**: sidebar oculto que se abre con botón hamburguesa, con fondo oscurecido.
- **Desktop (≥900px)**: sidebar fijo a la izquierda con las 8 secciones.
- Header superior con botón hamburguesa, título de sección y nombre del organizador.
- Contenido con tarjetas de estadísticas, tarjetas de torneo con acciones, tablas
  responsivas y formularios. Sin emojis, paleta de colores básica.

## Estructura de carpetas

```
ajedrez/
├── index.html
├── css/
│   └── styles.css
├── supabase/
│   └── schema.sql              → esquema canónico: events, tournaments,
│                                 categories, players, registrations,
│                                 payments, checkins, registration_historial + RLS
└── js/
    ├── app.js                    → punto de entrada + router por hash
    ├── config.js                 → configuración (backend objetivo: supabase)
    ├── utils/
    │   └── formatters.js         → formato de fechas, precios, plurales
    ├── data/
    │   ├── mockTournaments.js    → re-exporta TORNEOS_DEMO (compatibilidad)
    │   ├── mockRelacional.js     → índice de datos relacionales demo
    │   ├── mockRelacionalTorneos.js → EVENTOS_DEMO + TORNEOS_DEMO
    │   └── mockRelacionalJugadores.js → JUGADORES_DEMO + INSCRIPCIONES_DEMO + PAGOS_DEMO
    ├── core/                     → dominio administrativo (fuente de verdad)
    │   ├── eventsRepository.js
    │   ├── playersRepository.js       → búsqueda + crearJugador (Etapa 3)
    │   ├── registrationsRepository.js → estados, transiciones, inscribir(), historial
    │   ├── sesion.js                  → sesión por cuenta (jugador u organizador)
    │   ├── cuentasRepository.js       → registro/acceso demo (mock auth.users + profiles)
    │   └── paymentsRepository.js
    ├── integrations/             → adaptadores externos (desacoplados)
    │   ├── swissManagerExport.js → CSV Nivel 1 (formato propuesto, por verificar)
    │   └── chessResultsLinks.js  → referencia chessResultsId/Url
    ├── repositories/
    │   ├── mockTournamentProvider.js → proveedor local (misma interfaz de datos)
    │   ├── tournamentRepository.js   → capa única de acceso a torneos (catálogo)
    │   └── organizadorRepository.js  → acceso a datos del panel (delega en core/)
    ├── ui/
    │   └── components.js         → tarjetas, detalle (+bloque Chess-Results), toast
    └── views/
        ├── catalogView.js        → catálogo: hero, búsqueda, filtros, secciones
        ├── torneoDetalleView.js  → detalle de un torneo
        ├── inscripcionView.js    → formulario de inscripción (Etapa 3)
        ├── misInscripcionesView.js → mis inscripciones del jugador (Etapa 3)
        ├── registroView.js       → crear cuenta con rol (Etapa 4 · demo)
        ├── accederView.js        → iniciar sesión (Etapa 4 · demo)
        └── panelOrganizadorView.js → panel de organizador (preview)
```

## Cómo se preparó la migración a Supabase (Etapa 2)

- Las vistas **nunca consultan el origen de datos directamente**:
  - el catálogo pasa por `TournamentRepository` (`getAll`, `getById`, `search`);
  - el panel pasa por `OrganizadorRepository` (async, delega en `js/core/`).
- `supabase/schema.sql` es el **esquema canónico**: events → tournaments →
  categories, players → registrations → payments → checkins, más la tabla de
  auditoría `registration_historial` y políticas RLS (público solo lee lo
  publicado; el jugador solo su registro; el organizador gestiona lo suyo;
  los pagos solo se escriben desde edge functions con service_role).
- Los mocks (`js/data/mockRelacional*.js`) ya tienen la forma de esas tablas.
- Para conectar Supabase solo se necesita:
  1. Crear el proyecto y aplicar `supabase/schema.sql`.
  2. Implementar el origen Supabase dentro de `js/core/` y
     `js/repositories/` con las mismas interfaces (sin tocar las vistas).
- Todo texto dinámico se escapa con `escapar()` antes de inyectarse al HTML
  (preparación para contenido creado por organizadores).

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
   Supabase en `js/core/` (sin tocar vistas).
2. Registro online del jugador: el flujo ya existe como demo (perfil, inscripción
   con validación de cupo/duplicados, historial y cancelación temprana); con
   Supabase se apoya en la RLS "Jugador se inscribe en torneos abiertos".
3. Pasarela de pagos (Mercado Pago) con confirmación por webhook/edge function
   (nunca por retorno del cliente) y QR por inscripción pagada.
4. Importación de resultados desde Swiss-Manager (Nivel 2) y reportes SQL.
5. La plataforma NO clona Swiss-Manager (deporte) ni Chess-Results
   (publicación): solo integra por exportación CSV y enlaces de referencia.