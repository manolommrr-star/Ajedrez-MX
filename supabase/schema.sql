-- ============================================================
-- AjedrezMX — Esquema canónico (Etapa 2 · Objetivo Supabase)
--
-- Base relacional:
--   eventos → torneos → categorías
--   jugadores → inscripciones → pagos → check-ins
--
-- Principios:
--  * La plataforma es la fuente de verdad administrativa.
--  * Swiss-Manager y Chess-Results viven como REFERENCIAS EXTERNAS
--    en el torneo (integración, no duplicación).
--  * Las transiciones de pago solo ocurren desde funciones con
--    service_role (webhook), nunca desde el cliente.
-- ============================================================

-- ---------- Perfiles (1:1 con auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  rol text not null default 'player'
    check (rol in ('player', 'organizer', 'admin')),
  nombre text not null default '',
  apellidos text not null default '',
  nombre_usuario text unique,
  email text,
  telefono text,
  ciudad text,
  estado text,                     -- entidad federativa (México)
  club text,
  elo int,
  titulo text,
  federacion text,
  fide_id text,
  fecha_nacimiento date,
  fecha_creacion timestamptz not null default now()
);

-- ---------- Eventos ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizador_id uuid not null references public.profiles (id),
  nombre text not null,
  descripcion text not null default '',
  convocatoria_url text,
  sede text,
  direccion text,
  ciudad text,
  estado text,                     -- entidad federativa
  fecha_inicio date,
  fecha_fin date,
  estado_publicacion text not null default 'borrador'
    check (estado_publicacion in ('borrador', 'publicado', 'cancelado')),
  fecha_creacion timestamptz not null default now()
);

-- ---------- Torneos / grupos ----------
create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references public.events (id) on delete set null,
  organizador_id uuid not null references public.profiles (id),
  grupo text,                      -- Primera fuerza, Sub-12, etc.
  nombre text not null,
  descripcion text not null default '',
  fecha date,
  hora time,
  ciudad text,
  estado text,                     -- entidad federativa
  sede text,
  direccion text,
  modalidad text not null default 'Presencial'
    check (modalidad in ('Presencial', 'Online')),
  sistema text,
  rondas int,
  ritmo text,
  cupo int not null default 0 check (cupo >= 0),
  imagen text,
  destacado boolean not null default false,
  estado_publicacion text not null default 'borrador'
    check (estado_publicacion in ('borrador', 'publicado', 'cancelado')),
  -- Referencias externas (integración, no duplicación)
  swiss_manager_event_id text,
  chess_results_id text,
  chess_results_url text,
  fecha_creacion timestamptz not null default now()
);

create index tournaments_organizador_idx on public.tournaments (organizador_id);
create index tournaments_evento_idx on public.tournaments (evento_id);
-- ---------- Categorías ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  torneo_id uuid not null references public.tournaments (id) on delete cascade,
  nombre text not null,
  precio numeric(10, 2) not null default 0,
  cupo int,
  elo_min int,
  elo_max int,
  orden int not null default 0
);

create index categories_torneo_idx on public.categories (torneo_id);

-- ---------- Jugadores (entidad independiente del torneo) ----------
create table public.players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles (id) on delete set null,
  nombre text not null,
  apellidos text not null default '',
  fecha_nacimiento date,
  fide_id text,
  federacion text,
  club text,
  elo int,
  titulo text,
  email text,
  telefono text,
  ciudad text,
  estado text,                     -- entidad federativa
  fecha_creacion timestamptz not null default now()
);

-- ---------- Inscripciones ----------
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id),
  torneo_id uuid not null references public.tournaments (id) on delete cascade,
  evento_id uuid references public.events (id),
  categoria_id uuid references public.categories (id),
  -- Snapshots administrativos (la categoría puede renombrarse después)
  categoria_nombre text,
  precio numeric(10, 2),
  estado text not null default 'pendiente'
    check (estado in (
      'pendiente', 'pago_pendiente', 'pago_en_revision',
      'pagada', 'confirmada', 'cancelada',
      'rechazada', 'checkin', 'retirada'
    )),
  fecha_creacion timestamptz not null default now(),
  unique (player_id, torneo_id)    -- un jugador por torneo
);

create index registrations_torneo_idx on public.registrations (torneo_id);
create index registrations_player_idx on public.registrations (player_id);
create index registrations_estado_idx on public.registrations (estado);

-- ---------- Pagos (separados de la inscripción) ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations (id) on delete cascade,
  torneo_id uuid not null references public.tournaments (id),
  player_id uuid not null references public.players (id),
  monto numeric(10, 2) not null,
  metodo text,
  proveedor text,
  referencia text,
  comprobante_url text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'procesando', 'pagado', 'cancelado', 'reembolsado')),
  fecha_creacion timestamptz not null default now()
);

create index payments_registration_idx on public.payments (registration_id);

-- ---------- Check-ins ----------
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations (id) on delete cascade,
  registrado_por uuid references public.profiles (id),
  checkin_en timestamptz not null default now(),
  unique (registration_id)
);

-- ---------- Historial de estados de inscripción (auditoría) ----------
create table public.registration_historial (
  id bigint generated always as identity primary key,
  registration_id uuid not null references public.registrations (id) on delete cascade,
  estado_anterior text,
  estado_nuevo text not null,
  cambiado_por uuid references public.profiles (id),
  fecha timestamptz not null default now()
);

create index historial_registration_idx on public.registration_historial (registration_id);

-- ============================================================
-- Row Level Security (RLS)
--  * Lectura pública: eventos, torneos y categorías publicados.
--  * Jugadores: cada uno ve/edita únicamente su propio registro.
--  * Inscripciones: el propio jugador (lectura) y el organizador
--    del torneo (lectura/actualización).
--  * Pagos/check-ins/historial: solo el organizador del torneo.
--    Las inserciones de pago se hacen SOLO desde edge functions
--    con service_role (webhook), NUNCA desde el cliente.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.tournaments enable row level security;
alter table public.categories enable row level security;
alter table public.players enable row level security;
alter table public.registrations enable row level security;
alter table public.payments enable row level security;
alter table public.checkins enable row level security;
alter table public.registration_historial enable row level security;

-- Auxiliar: ¿el usuario autenticado organiza este torneo?
create or replace function public.es_organizador_de_torneo(torneo_id uuid)
returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from public.tournaments t
    where t.id = torneo_id and t.organizador_id = auth.uid()
  );
$$;

-- Perfiles: cada usuario solo sobre su propia fila
create policy "Perfil propio"
  on public.profiles for all
  using (auth.uid() = id);

-- Eventos: lectura pública de publicados; organizador gestiona los suyos
create policy "Eventos publicados de lectura pública"
  on public.events for select
  using (estado_publicacion = 'publicado');

create policy "Organizador edita sus eventos"
  on public.events for all
  using (organizador_id = auth.uid());

-- Torneos: lectura pública de publicados; organizador gestiona los suyos
create policy "Torneos publicados de lectura pública"
  on public.tournaments for select
  using (estado_publicacion = 'publicado');

create policy "Organizador edita sus torneos"
  on public.tournaments for all
  using (organizador_id = auth.uid());

-- Categorías: visibles si el torneo es público
create policy "Categorías de torneos publicados"
  on public.categories for select
  using (
    exists (
      select 1 from public.tournaments t
      where t.id = torneo_id and t.estado_publicacion = 'publicado'
    )
  );

create policy "Organizador edita categorías de sus torneos"
  on public.categories for all
  using (
    exists (
      select 1 from public.tournaments t
      where t.id = torneo_id and t.organizador_id = auth.uid()
    )
  );

-- Jugadores: cada quien su propio registro
create policy "Jugador solo su propio registro"
  on public.players for all
  using (user_id = auth.uid());

-- Inscripciones
create policy "Jugador lee sus inscripciones"
  on public.registrations for select
  using (
    exists (
      select 1 from public.players p
      where p.id = player_id and p.user_id = auth.uid()
    )
    or public.es_organizador_de_torneo(torneo_id)
  );

-- Un jugador se inscribe a sí mismo solo en torneos publicados con cupo
create policy "Jugador se inscribe en torneos abiertos"
  on public.registrations for insert
  with check (
    exists (
      select 1 from public.players p
      where p.id = player_id and p.user_id = auth.uid()
    )
    and exists (
      select 1 from public.tournaments t
      where t.id = torneo_id
        and t.estado_publicacion = 'publicado'
        and (select count(*) from public.registrations r
             where r.torneo_id = torneo_id) < t.cupo
    )
  );

-- El organizador actualiza inscripciones de su torneo.
-- NOTA: las transiciones de estado que cambian dinero/check-in deberán
-- pasar por edge functions + service_role para validaciones de negocio.
create policy "Organizador actualiza inscripciones"
  on public.registrations for update
  using (public.es_organizador_de_torneo(torneo_id));

-- Pagos: solo el organizador (lectura/gestión). Sin insert para clientes.
create policy "Organizador gestiona pagos"
  on public.payments for all
  using (public.es_organizador_de_torneo(torneo_id));

-- Check-ins: solo el organizador
create policy "Organizador gestiona check-ins"
  on public.checkins for all
  using (
    exists (
      select 1 from public.registrations r
      join public.tournaments t on t.id = r.torneo_id
      where r.id = registration_id and t.organizador_id = auth.uid()
    )
  );

-- Historial: solo el organizador del torneo
create policy "Organizador lee historial"
  on public.registration_historial for select
  using (
    exists (
      select 1 from public.registrations r
      join public.tournaments t on t.id = r.torneo_id
      where r.id = registration_id and t.organizador_id = auth.uid()
    )
  );