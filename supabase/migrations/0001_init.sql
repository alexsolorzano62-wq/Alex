-- Esquema inicial: perfiles de agentes + alquileres + storage de fotos.
-- Correr en el SQL Editor del proyecto Supabase (o vía supabase db push).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: un registro por agente, espejo de auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: lectura de autenticados"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles: cada agente actualiza su propio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Crea automáticamente un profile cuando el admin da de alta un usuario en Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- listings: alquileres cargados por los agentes
-- ---------------------------------------------------------------------------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  address text,
  neighborhood text,
  city text,
  price numeric,
  currency text not null default 'ARS' check (currency in ('ARS', 'USD')),
  property_type text not null check (
    property_type in ('departamento', 'casa', 'ph', 'local', 'oficina', 'terreno')
  ),
  rooms int,
  bedrooms int,
  bathrooms int,
  area_m2 numeric,
  description text,
  status text not null default 'disponible' check (
    status in ('disponible', 'reservado', 'alquilado')
  ),
  contact_phone text,
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_created_by_idx on public.listings (created_by);
create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_created_at_idx on public.listings (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
  before update on public.listings
  for each row execute procedure public.set_updated_at();

alter table public.listings enable row level security;

-- Todos los agentes autenticados ven todos los alquileres.
create policy "listings: lectura de autenticados"
  on public.listings for select
  to authenticated
  using (true);

-- Un agente solo puede cargar alquileres a su propio nombre.
create policy "listings: alta propia"
  on public.listings for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Un agente solo puede editar/eliminar lo que él mismo cargó.
create policy "listings: edicion propia"
  on public.listings for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy "listings: borrado propio"
  on public.listings for delete
  to authenticated
  using (auth.uid() = created_by);

-- ---------------------------------------------------------------------------
-- Storage: bucket privado para fotos de alquileres
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', false)
on conflict (id) do nothing;

create policy "listing-photos: lectura de autenticados"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'listing-photos');

create policy "listing-photos: subida de autenticados"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "listing-photos: borrado propio"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
