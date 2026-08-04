-- Novedades: registra automáticamente los cambios de precio y de estado de los
-- alquileres, además de las altas nuevas, para que todo el equipo los vea.
-- Correr en el SQL Editor, después de 0006_geolocation.sql.

create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete cascade,
  -- Se guarda el título del momento del cambio: si después renombran la
  -- propiedad, la novedad sigue teniendo sentido.
  listing_title text not null,
  changed_by uuid references public.profiles (id) on delete set null,
  kind text not null check (kind in ('creada', 'precio', 'estado')),
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create index if not exists activity_created_at_idx on public.activity (created_at desc);

alter table public.activity enable row level security;

-- Todos los agentes ven las novedades del equipo. Nadie escribe a mano:
-- las filas las genera el trigger de abajo.
create policy "activity: lectura de autenticados"
  on public.activity for select
  to authenticated
  using (true);

create or replace function public.log_listing_activity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  actor uuid := coalesce(auth.uid(), new.created_by);
begin
  if TG_OP = 'INSERT' then
    insert into public.activity (listing_id, listing_title, changed_by, kind)
    values (new.id, new.title, new.created_by, 'creada');
    return new;
  end if;

  if new.price is distinct from old.price
     or new.currency is distinct from old.currency then
    insert into public.activity
      (listing_id, listing_title, changed_by, kind, old_value, new_value)
    values (
      new.id, new.title, actor, 'precio',
      case when old.price is null then null
           else old.currency || ' ' || trim(to_char(old.price, 'FM999999999990.00')) end,
      case when new.price is null then null
           else new.currency || ' ' || trim(to_char(new.price, 'FM999999999990.00')) end
    );
  end if;

  if new.status is distinct from old.status then
    insert into public.activity
      (listing_id, listing_title, changed_by, kind, old_value, new_value)
    values (new.id, new.title, actor, 'estado', old.status, new.status);
  end if;

  return new;
end;
$$;

drop trigger if exists listings_log_activity on public.listings;
create trigger listings_log_activity
  after insert or update on public.listings
  for each row execute procedure public.log_listing_activity();
