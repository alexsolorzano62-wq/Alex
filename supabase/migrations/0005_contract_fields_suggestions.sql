-- Rediseño del modelo: estados nuevos, campos de contrato, y sistema de
-- sugerencias de corrección entre agentes.
-- Correr en el SQL Editor, después de 0004_property_types_status.sql.

-- ---------------------------------------------------------------------------
-- Estados: disponible / reservado / proximamente / pausado
-- ---------------------------------------------------------------------------
update public.listings set status = 'pausado' where status = 'no_disponible';

alter table public.listings drop constraint if exists listings_status_check;
alter table public.listings add constraint listings_status_check
  check (status in ('disponible', 'reservado', 'proximamente', 'pausado'));

-- ---------------------------------------------------------------------------
-- Campos que se eliminan (ambientes, teléfono de contacto, fotos)
-- ---------------------------------------------------------------------------
alter table public.listings drop column if exists rooms;
alter table public.listings drop column if exists contact_phone;
alter table public.listings drop column if exists photos;

-- ---------------------------------------------------------------------------
-- Campos nuevos de contrato y clasificación
-- ---------------------------------------------------------------------------
alter table public.listings
  add column if not exists contract_months int,
  add column if not exists adjustment_frequency text,
  add column if not exists adjustment_index text
    check (adjustment_index in ('icl', 'ipc', 'fijo')),
  add column if not exists adjustment_fixed_pct numeric,
  add column if not exists rental_purpose text
    check (rental_purpose in ('vivienda', 'comercial', 'profesional', 'otro')),
  add column if not exists priority_note text;

-- ---------------------------------------------------------------------------
-- Sugerencias de corrección entre agentes
-- ---------------------------------------------------------------------------
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  suggested_by uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'aprobada', 'rechazada')),
  created_at timestamptz not null default now(),
  resolved_by uuid references public.profiles (id),
  resolved_at timestamptz
);

create index if not exists suggestions_listing_idx on public.suggestions (listing_id);
create index if not exists suggestions_status_idx on public.suggestions (status);

alter table public.suggestions enable row level security;

create policy "suggestions: lectura de autenticados"
  on public.suggestions for select
  to authenticated
  using (true);

create policy "suggestions: crear propia"
  on public.suggestions for insert
  to authenticated
  with check (auth.uid() = suggested_by);

-- Solo el agente responsable del alquiler (o un admin) puede aprobar/rechazar.
create policy "suggestions: resolver responsable o admin"
  on public.suggestions for update
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.listings l
      where l.id = listing_id and l.created_by = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.listings l
      where l.id = listing_id and l.created_by = auth.uid()
    )
  );

create policy "suggestions: borrar propia pendiente o admin"
  on public.suggestions for delete
  to authenticated
  using (
    (auth.uid() = suggested_by and status = 'pendiente')
    or public.is_admin()
  );
