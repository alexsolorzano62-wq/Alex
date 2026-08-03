-- Sistema de roles: agrega "role" a profiles y permite que los administradores
-- editen/eliminen los alquileres de cualquier agente (no solo los propios).
-- Correr en el SQL Editor, después de 0002_extra_fields.sql.

alter table public.profiles
  add column if not exists role text not null default 'agent'
  check (role in ('agent', 'admin'));

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "listings: edicion propia" on public.listings;
create policy "listings: edicion propia o admin"
  on public.listings for update
  to authenticated
  using (auth.uid() = created_by or public.is_admin())
  with check (auth.uid() = created_by or public.is_admin());

drop policy if exists "listings: borrado propio" on public.listings;
create policy "listings: borrado propio o admin"
  on public.listings for delete
  to authenticated
  using (auth.uid() = created_by or public.is_admin());

-- Después de correr esto, convertí tu propio usuario en administrador:
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'tu@email.com');
