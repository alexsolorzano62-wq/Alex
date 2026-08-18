-- Sistema de seguimiento de préstamos personales.
--
-- Es de un solo dueño: cada fila guarda el `owner_id` del usuario que la creó y
-- las políticas RLS no dejan ver ni tocar nada de otro usuario. Así, aunque
-- alguien consiga la anon key, sin sesión no ve absolutamente nada.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- clientes --
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  telefono text,
  notas text,
  created_at timestamptz not null default now()
);

create index clientes_owner_idx on public.clientes (owner_id);

-- --------------------------------------------------------------- préstamos --
create table public.prestamos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,

  -- 'mensual': paga el interés y renueva mes a mes.
  -- 'cuotas' : plan cerrado en N cuotas fijas.
  modalidad text not null default 'mensual'
    check (modalidad in ('mensual', 'cuotas')),

  capital_inicial numeric(14, 2) not null check (capital_inicial > 0),
  -- Lo que sigue debiendo hoy: baja con las entregas a cuenta y sube cuando un
  -- mes se capitaliza porque no pagó el interés.
  capital_actual numeric(14, 2) not null check (capital_actual >= 0),

  -- En 'mensual' es la tasa por mes. En 'cuotas', la tasa total del plan.
  tasa_mensual numeric(6, 3) not null default 0 check (tasa_mensual >= 0),

  fecha_inicio date not null,
  fecha_vencimiento date not null,

  -- Solo para 'cuotas'.
  cuotas_total integer check (cuotas_total is null or cuotas_total > 0),
  cuota_monto numeric(14, 2),
  total_a_devolver numeric(14, 2),

  estado text not null default 'vigente'
    check (estado in ('vigente', 'pagado', 'cancelado')),
  observacion text,
  created_at timestamptz not null default now(),

  -- Un plan en cuotas no tiene sentido sin cuotas ni total.
  constraint prestamos_cuotas_completas check (
    modalidad <> 'cuotas'
    or (cuotas_total is not null and total_a_devolver is not null)
  )
);

create index prestamos_owner_idx on public.prestamos (owner_id);
create index prestamos_cliente_idx on public.prestamos (cliente_id);
create index prestamos_vencimiento_idx on public.prestamos (fecha_vencimiento)
  where estado = 'vigente';

-- ------------------------------------------------------------------- pagos --
create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  prestamo_id uuid not null references public.prestamos (id) on delete cascade,

  fecha date not null,
  monto numeric(14, 2) not null check (monto > 0),
  -- 'interes': cobró el interés del mes y el préstamo se renueva.
  -- 'capital': entrega a cuenta del capital.
  -- 'cuota'  : una cuota de un plan.
  -- 'total'  : saldó todo lo que debía.
  tipo text not null check (tipo in ('interes', 'capital', 'cuota', 'total')),
  nota text,
  created_at timestamptz not null default now()
);

create index pagos_owner_idx on public.pagos (owner_id);
create index pagos_prestamo_idx on public.pagos (prestamo_id);

-- --------------------------------------------------------------------- RLS --
alter table public.clientes enable row level security;
alter table public.prestamos enable row level security;
alter table public.pagos enable row level security;

create policy "cada uno ve lo suyo" on public.clientes
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "cada uno ve lo suyo" on public.prestamos
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "cada uno ve lo suyo" on public.pagos
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
