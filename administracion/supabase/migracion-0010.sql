-- ============================================================
--  MIGRACIÓN 0010 — Servicios e impuestos
--  Administración de alquileres · Lamelas & Chaumont
--
--  Crea el catálogo de servicios (SAT, EDET, CISI, Expensas, Naturgy)
--  y engancha los cobros fijos de cada contrato a ese catálogo.
--
--  Pegá todo en el SQL Editor de Supabase y tocá Run una vez.
--  Se puede correr dos veces sin romper nada.
-- ============================================================

-- Catálogo de servicios e impuestos que se le cobran al inquilino.
--
-- Hasta ahora cada contrato escribía "SAT" a mano en su cobro fijo. Con 130
-- unidades eso son 130 oportunidades de escribirlo distinto —"SAT", "Sat",
-- "Aguas"— y después no poder contestar cuánto se cobra de agua en total.
--
-- Acá se define una vez cada servicio y desde el contrato se lo elige de una
-- lista. El monto sigue viviendo en el contrato, porque cada unidad paga lo
-- suyo: lo que se comparte es el nombre, no el importe.

create table if not exists public.conceptos (
  id uuid primary key default gen_random_uuid(),

  -- Cómo se lo conoce: "SAT", "EDET", "CISI", "Naturgy".
  nombre text not null check (length(trim(nombre)) > 0),
  tipo text not null default 'otro'
    check (tipo in ('expensas', 'abl', 'luz', 'gas', 'agua', 'otro')),
  -- Quién lo cobra, cuando el nombre corto no alcanza para reconocerlo.
  detalle text,

  -- Se apaga en vez de borrarse: los contratos que ya lo usan tienen que
  -- seguir explicando qué es lo que están cobrando.
  activo boolean not null default true,

  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create unique index if not exists conceptos_nombre_unico
  on public.conceptos (lower(trim(nombre)))
  where deleted_at is null;

-- Los que ya usa la inmobiliaria, para no arrancar con la lista vacía.
insert into public.conceptos (nombre, tipo, detalle) values
  ('SAT',      'agua',     'Agua — Sociedad Aguas del Tucumán'),
  ('EDET',     'luz',      'Luz — Empresa de Distribución Eléctrica de Tucumán'),
  ('CISI',     'abl',      'Contribución municipal'),
  ('Expensas', 'expensas', 'Expensas ordinarias'),
  ('Naturgy',  'gas',      'Gas natural')
on conflict do nothing;

-- El cobro fijo del contrato pasa a apuntar al catálogo. Sigue guardando su
-- propia descripción: si mañana se renombra el concepto, los recibos ya
-- emitidos tienen que seguir diciendo lo que decían.
alter table public.contrato_cargos
  add column if not exists concepto_id uuid references public.conceptos (id);

create index if not exists contrato_cargos_concepto_idx
  on public.contrato_cargos (concepto_id)
  where deleted_at is null;

alter table public.conceptos enable row level security;

drop policy if exists "conceptos_select" on public.conceptos;
create policy "conceptos_select" on public.conceptos
  for select using (public.es_miembro());
drop policy if exists "conceptos_insert" on public.conceptos;
create policy "conceptos_insert" on public.conceptos
  for insert with check (public.es_miembro());
drop policy if exists "conceptos_update" on public.conceptos;
create policy "conceptos_update" on public.conceptos
  for update using (public.es_miembro());

-- ============================================================
--  Comprobación
-- ============================================================
select nombre, tipo, detalle from public.conceptos order by nombre;
