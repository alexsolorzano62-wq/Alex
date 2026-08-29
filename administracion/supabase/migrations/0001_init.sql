-- Administración de alquileres — Lamelas & Chaumont Inmobiliaria.
--
-- A diferencia del catálogo (que muestra lo que está disponible), esta app
-- administra lo que ya está alquilado: contratos, cobros al inquilino, gastos
-- del inmueble y la liquidación mensual al propietario.
--
-- Modelo de acceso: es una app de equipo. Todos los miembros ven y trabajan
-- toda la cartera; solo los administradores pueden anular o dar de baja.
-- Los inquilinos y propietarios NO entran a la app.

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------ perfiles --
-- Un perfil por usuario del equipo. Las cuentas las crea un administrador:
-- no hay registro público.
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  email text not null,
  rol text not null default 'operador'
    check (rol in ('operador', 'admin')),
  created_at timestamptz not null default now()
);

-- ¿El usuario de esta sesión pertenece al equipo?
-- SECURITY DEFINER para que la política pueda leer `perfiles` sin caer en
-- recursión infinita contra la RLS de la propia tabla.
create or replace function public.es_miembro()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.perfiles where id = auth.uid());
$$;

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select rol = 'admin' from public.perfiles where id = auth.uid()),
    false
  );
$$;

-- -------------------------------------------------------------- propietarios --
create table public.propietarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  documento text,                        -- DNI o CUIT
  telefono text,
  email text,

  -- Cómo se le rinde la plata todos los meses. Puede variar por liquidación,
  -- esto es solo el valor que viene propuesto por defecto.
  forma_cobro text not null default 'transferencia'
    check (forma_cobro in ('transferencia', 'efectivo')),
  cbu text,
  alias_cbu text,
  titular_cuenta text,

  notas text,
  -- Nada se borra de verdad: se marca y desaparece de las pantallas.
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create index propietarios_activos_idx on public.propietarios (nombre)
  where deleted_at is null;

-- ---------------------------------------------------------------- inquilinos --
create table public.inquilinos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  documento text,
  telefono text,
  email text,
  notas text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create index inquilinos_activos_idx on public.inquilinos (nombre)
  where deleted_at is null;

-- ---------------------------------------------------------------- propiedades --
create table public.propiedades (
  id uuid primary key default gen_random_uuid(),
  propietario_id uuid not null references public.propietarios (id),

  -- Cuando la escritura está a nombre de más de uno (matrimonios, hermanos).
  -- La plata se le rinde igual al propietario principal.
  titulares_adicionales text,

  direccion text not null,
  piso_depto text,
  localidad text,
  provincia text default 'Buenos Aires',

  tipo text not null default 'departamento'
    check (tipo in (
      'departamento', 'casa', 'ph', 'monoambiente', 'duplex',
      'local', 'oficina', 'galpon', 'cochera', 'terreno', 'otro'
    )),

  ambientes integer,
  superficie_m2 numeric(10, 2),

  -- Identificadores para pagar impuestos y servicios del inmueble.
  partida_inmobiliaria text,
  cuenta_luz text,
  cuenta_gas text,
  cuenta_agua text,
  expensas_unidad text,

  estado text not null default 'alquilado'
    check (estado in ('alquilado', 'disponible', 'en_refaccion', 'retirado')),

  notas text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create index propiedades_propietario_idx on public.propiedades (propietario_id)
  where deleted_at is null;

-- ------------------------------------------------------------------ contratos --
create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  propiedad_id uuid not null references public.propiedades (id),
  inquilino_id uuid not null references public.inquilinos (id),

  -- Los garantes casi nunca hacen falta como ficha propia: alcanza con
  -- tenerlos anotados y el documento adjunto.
  garantes text,

  fecha_inicio date not null,
  fecha_fin date not null,
  destino text not null default 'vivienda'
    check (destino in ('vivienda', 'comercial', 'mixto', 'otro')),

  -- Desde el DNU 70/2023 la moneda se pacta libremente.
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  monto_inicial numeric(14, 2) not null check (monto_inicial > 0),
  -- Lo que se cobra hoy. Lo mueve el motor de ajustes, no se edita a mano.
  monto_actual numeric(14, 2) not null check (monto_actual > 0),

  deposito_monto numeric(14, 2),
  deposito_estado text not null default 'retenido'
    check (deposito_estado in ('retenido', 'devuelto', 'aplicado', 'sin_deposito')),

  -- Día del mes en que vence el alquiler (ej. 10).
  dia_vencimiento integer not null default 10
    check (dia_vencimiento between 1 and 28),

  -- Honorarios de administración. Va del 7 al 10 según el propietario, por eso
  -- vive en el contrato y no en una configuración global. Cada liquidación
  -- guarda además el porcentaje con el que se emitió, para que renegociarlo
  -- no reescriba el pasado.
  honorarios_porcentaje numeric(5, 2) not null default 8
    check (honorarios_porcentaje >= 0 and honorarios_porcentaje <= 100),

  -- Ajuste: índice libre y frecuencia libre, también por el DNU 70/2023.
  indice text not null default 'ICL'
    check (indice in ('ICL', 'IPC', 'UVA', 'CASA_PROPIA', 'FIJO', 'SIN_AJUSTE')),
  ajuste_frecuencia_meses integer not null default 3
    check (ajuste_frecuencia_meses between 1 and 36),
  -- Solo cuando el índice es FIJO: el porcentaje pactado por período.
  ajuste_porcentaje_fijo numeric(6, 3),
  fecha_ultimo_ajuste date,
  fecha_proximo_ajuste date,

  -- Punitorios por pagar fuera de término.
  punitorio_tipo text not null default 'porcentaje_diario'
    check (punitorio_tipo in ('porcentaje_diario', 'monto_fijo_diario', 'ninguno')),
  punitorio_valor numeric(10, 4) not null default 0
    check (punitorio_valor >= 0),
  punitorio_dias_gracia integer not null default 0
    check (punitorio_dias_gracia >= 0),

  estado text not null default 'activo'
    check (estado in ('activo', 'finalizado', 'rescindido')),

  observaciones text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),

  constraint contratos_fechas check (fecha_fin > fecha_inicio),
  -- Un ajuste FIJO sin porcentaje no se puede calcular.
  constraint contratos_ajuste_fijo check (
    indice <> 'FIJO' or ajuste_porcentaje_fijo is not null
  )
);

create index contratos_propiedad_idx on public.contratos (propiedad_id);
create index contratos_inquilino_idx on public.contratos (inquilino_id);
create index contratos_activos_idx on public.contratos (fecha_proximo_ajuste)
  where estado = 'activo' and deleted_at is null;

-- ----------------------------------------------------------------------- RLS --
alter table public.perfiles      enable row level security;
alter table public.propietarios  enable row level security;
alter table public.inquilinos    enable row level security;
alter table public.propiedades   enable row level security;
alter table public.contratos     enable row level security;

-- Cada uno ve su propio perfil; los administradores ven todo el equipo.
create policy "perfiles_select" on public.perfiles
  for select using (id = auth.uid() or public.es_admin());
create policy "perfiles_update_admin" on public.perfiles
  for update using (public.es_admin());

-- El resto de las tablas: todo el equipo trabaja la misma cartera.
-- El borrado físico no está permitido para nadie: se usa `deleted_at`, y solo
-- un administrador puede marcarlo desde la app.
create policy "propietarios_select" on public.propietarios
  for select using (public.es_miembro());
create policy "propietarios_insert" on public.propietarios
  for insert with check (public.es_miembro());
create policy "propietarios_update" on public.propietarios
  for update using (public.es_miembro());

create policy "inquilinos_select" on public.inquilinos
  for select using (public.es_miembro());
create policy "inquilinos_insert" on public.inquilinos
  for insert with check (public.es_miembro());
create policy "inquilinos_update" on public.inquilinos
  for update using (public.es_miembro());

create policy "propiedades_select" on public.propiedades
  for select using (public.es_miembro());
create policy "propiedades_insert" on public.propiedades
  for insert with check (public.es_miembro());
create policy "propiedades_update" on public.propiedades
  for update using (public.es_miembro());

create policy "contratos_select" on public.contratos
  for select using (public.es_miembro());
create policy "contratos_insert" on public.contratos
  for insert with check (public.es_miembro());
create policy "contratos_update" on public.contratos
  for update using (public.es_miembro());
