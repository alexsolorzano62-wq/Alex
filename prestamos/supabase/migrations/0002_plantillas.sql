-- Plantillas de los mensajes de WhatsApp, editables desde /ajustes.
--
-- Una sola fila por usuario. Si no hay fila, o si un campo está vacío, la app
-- usa el texto que viene por defecto en `lib/plantillas.ts`.

create table public.ajustes (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  plantilla_estado_cuenta text,
  plantilla_prestamo_nuevo text,
  actualizado_at timestamptz not null default now()
);

alter table public.ajustes enable row level security;

create policy "cada uno ve lo suyo" on public.ajustes
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
