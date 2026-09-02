-- Tareas pendientes del día a día.
--
-- Un inquilino avisa que tiene una filtración cuando viene a pagar. Eso no es
-- un cobro, ni un gasto, ni un aviso: es algo que hay que hacer y que hoy se
-- anota en un papel o no se anota. Acá queda colgado de la unidad, del
-- contrato o del inquilino que lo motivó, y se ve todo junto en una pantalla.

create table public.tareas (
  id uuid primary key default gen_random_uuid(),

  titulo text not null check (length(trim(titulo)) > 0),
  detalle text,

  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'hecha')),
  prioridad text not null default 'normal'
    check (prioridad in ('baja', 'normal', 'alta')),

  -- Para cuándo. Vacío es "algún día".
  vence_el date,

  -- De dónde salió. Las tres son opcionales: una tarea puede no colgar de
  -- nada ("comprar tinta para la impresora").
  propiedad_id uuid references public.propiedades (id),
  contrato_id  uuid references public.contratos (id),
  inquilino_id uuid references public.inquilinos (id),

  completada_at timestamptz,
  completada_por uuid references auth.users (id),

  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),

  -- Una tarea hecha tiene fecha de hecha, y una pendiente no.
  constraint tareas_estado_coherente check (
    (estado = 'hecha' and completada_at is not null) or
    (estado = 'pendiente' and completada_at is null)
  )
);

-- El índice que sostiene el contador del menú: las pendientes, primero las de
-- vencimiento más cercano.
create index tareas_pendientes_idx
  on public.tareas (vence_el nulls last, created_at)
  where deleted_at is null and estado = 'pendiente';

create index tareas_propiedad_idx on public.tareas (propiedad_id)
  where deleted_at is null;
create index tareas_contrato_idx on public.tareas (contrato_id)
  where deleted_at is null;

-- Marcar hecha y desmarcar sin tener que acordarse de tocar dos columnas.
create or replace function public.tareas_sellar_completada()
returns trigger
language plpgsql
as $$
begin
  if new.estado = 'hecha' and old.estado is distinct from 'hecha' then
    new.completada_at := coalesce(new.completada_at, now());
    new.completada_por := coalesce(new.completada_por, auth.uid());
  elsif new.estado = 'pendiente' then
    new.completada_at := null;
    new.completada_por := null;
  end if;
  return new;
end;
$$;

create trigger tareas_sellar_completada
  before update on public.tareas
  for each row execute function public.tareas_sellar_completada();

alter table public.tareas enable row level security;

create policy "tareas_select" on public.tareas
  for select using (public.es_miembro());
create policy "tareas_insert" on public.tareas
  for insert with check (public.es_miembro());
create policy "tareas_update" on public.tareas
  for update using (public.es_miembro());
