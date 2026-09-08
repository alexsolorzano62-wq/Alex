-- ============================================================
--  MIGRACIONES 0007, 0008 y 0009 — en un solo bloque
--  Administración de alquileres · Lamelas & Chaumont
--
--  Agrega: cobros fijos por unidad, saldo arrastrado de un mes a otro,
--  feriados nacionales y tareas pendientes.
--
--  Pegá TODO esto en el SQL Editor de Supabase y tocá Run una vez.
--  Se puede volver a correr sin romper nada: todo está escrito para que
--  la segunda vez no haga nada en lugar de dar error.
-- ============================================================

-- ============================================================
-- 0007_cargos_y_saldos.sql
-- ============================================================

-- Cobros fijos además del alquiler, y el saldo que queda de un mes a otro.
--
-- Hay unidades que todos los meses pagan alquiler y agua, otras alquiler y
-- CISI, otras alquiler y luz. Hasta ahora eso se agregaba a mano en cada
-- recibo, mes por mes: 130 unidades por doce meses es mucho lugar para
-- olvidarse uno. Ahora se declara una vez en el contrato y aparece solo.

create table if not exists public.contrato_cargos (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos (id),

  tipo text not null default 'otro'
    check (tipo in ('expensas', 'abl', 'luz', 'gas', 'agua', 'otro')),
  -- Cómo se llama en la boleta real: "SAT", "CISI", "Aguas del Tucumán".
  descripcion text not null,
  monto numeric(14, 2) not null check (monto > 0),

  -- Se apaga en vez de borrarse: si el mes que viene deja de cobrarse el agua,
  -- los recibos viejos tienen que seguir explicando por qué la cobraron.
  activo boolean not null default true,

  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create index if not exists contrato_cargos_contrato_idx
  on public.contrato_cargos (contrato_id)
  where deleted_at is null and activo;

-- ------------------------------------------------------------------- saldos --
-- Lo que el inquilino pagó de más o de menos, arrastrado al mes siguiente.
--
-- Se guarda el saldo que queda DESPUÉS de este recibo, no el movimiento: así
-- para saber cómo está alguien alcanza con mirar su último recibo, sin sumar
-- la historia entera. Positivo es plata a favor del inquilino; negativo es lo
-- que debe.
alter table public.cobros
  add column if not exists saldo_anterior   numeric(14, 2) not null default 0,
  add column if not exists saldo_resultante numeric(14, 2) not null default 0;

comment on column public.cobros.saldo_anterior is
  'Saldo con el que llegaba el inquilino. Positivo: a favor. Negativo: debe.';
comment on column public.cobros.saldo_resultante is
  'Saldo que queda después de este recibo, con el mismo signo.';

-- El recibo puede traer un renglón por el saldo que venía de antes, y ese
-- renglón puede ser negativo (descuenta). Los demás tipos ya existían.
alter table public.cobro_conceptos
  drop constraint if exists cobro_conceptos_tipo_check;

alter table public.cobro_conceptos
  add constraint cobro_conceptos_tipo_check check (tipo in (
    'alquiler', 'expensas', 'abl', 'luz', 'gas', 'agua',
    'punitorios', 'reparacion', 'ajuste_manual', 'saldo_anterior', 'otro'
  ));

alter table public.contrato_cargos enable row level security;

drop policy if exists "contrato_cargos_select" on public.contrato_cargos;
create policy "contrato_cargos_select" on public.contrato_cargos
  for select using (public.es_miembro());
drop policy if exists "contrato_cargos_insert" on public.contrato_cargos;
create policy "contrato_cargos_insert" on public.contrato_cargos
  for insert with check (public.es_miembro());
drop policy if exists "contrato_cargos_update" on public.contrato_cargos;
create policy "contrato_cargos_update" on public.contrato_cargos
  for update using (public.es_miembro());

-- ============================================================
-- 0008_feriados.sql
-- ============================================================

-- Feriados nacionales, para correr el vencimiento cuando cae en uno.
--
-- El alquiler vence el día pactado, salvo que ese día sea domingo o feriado:
-- ahí se corre al día siguiente hábil, y los punitorios empiezan a contar
-- desde ese día corrido. El sábado NO corre el vencimiento.
--
-- Los feriados con fecha fija se cargan acá abajo hasta 2030. Los que se
-- mueven cada año por decreto —Carnaval, Güemes, San Martín, Diversidad
-- Cultural, Soberanía— y los puentes turísticos NO están: no se pueden
-- calcular, se publican cada año. Se cargan desde Más → Feriados.

create table if not exists public.feriados (
  fecha date primary key,
  nombre text not null,
  -- 'fijo' son los que caen siempre el mismo día; 'movible' los que cambian
  -- de año en año y hay que cargar a mano.
  origen text not null default 'fijo' check (origen in ('fijo', 'movible')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

-- Feriados nacionales de fecha fija, 2026 a 2030.
insert into public.feriados (fecha, nombre) values
  ('2026-01-01', 'Año Nuevo'),
  ('2026-03-24', 'Día de la Memoria'),
  ('2026-04-02', 'Día del Veterano y de los Caídos en Malvinas'),
  ('2026-05-01', 'Día del Trabajador'),
  ('2026-05-25', 'Día de la Revolución de Mayo'),
  ('2026-06-20', 'Paso a la Inmortalidad del General Belgrano'),
  ('2026-07-09', 'Día de la Independencia'),
  ('2026-12-08', 'Inmaculada Concepción de María'),
  ('2026-12-25', 'Navidad'),
  ('2027-01-01', 'Año Nuevo'),
  ('2027-03-24', 'Día de la Memoria'),
  ('2027-04-02', 'Día del Veterano y de los Caídos en Malvinas'),
  ('2027-05-01', 'Día del Trabajador'),
  ('2027-05-25', 'Día de la Revolución de Mayo'),
  ('2027-06-20', 'Paso a la Inmortalidad del General Belgrano'),
  ('2027-07-09', 'Día de la Independencia'),
  ('2027-12-08', 'Inmaculada Concepción de María'),
  ('2027-12-25', 'Navidad'),
  ('2028-01-01', 'Año Nuevo'),
  ('2028-03-24', 'Día de la Memoria'),
  ('2028-04-02', 'Día del Veterano y de los Caídos en Malvinas'),
  ('2028-05-01', 'Día del Trabajador'),
  ('2028-05-25', 'Día de la Revolución de Mayo'),
  ('2028-06-20', 'Paso a la Inmortalidad del General Belgrano'),
  ('2028-07-09', 'Día de la Independencia'),
  ('2028-12-08', 'Inmaculada Concepción de María'),
  ('2028-12-25', 'Navidad'),
  ('2029-01-01', 'Año Nuevo'),
  ('2029-03-24', 'Día de la Memoria'),
  ('2029-04-02', 'Día del Veterano y de los Caídos en Malvinas'),
  ('2029-05-01', 'Día del Trabajador'),
  ('2029-05-25', 'Día de la Revolución de Mayo'),
  ('2029-06-20', 'Paso a la Inmortalidad del General Belgrano'),
  ('2029-07-09', 'Día de la Independencia'),
  ('2029-12-08', 'Inmaculada Concepción de María'),
  ('2029-12-25', 'Navidad'),
  ('2030-01-01', 'Año Nuevo'),
  ('2030-03-24', 'Día de la Memoria'),
  ('2030-04-02', 'Día del Veterano y de los Caídos en Malvinas'),
  ('2030-05-01', 'Día del Trabajador'),
  ('2030-05-25', 'Día de la Revolución de Mayo'),
  ('2030-06-20', 'Paso a la Inmortalidad del General Belgrano'),
  ('2030-07-09', 'Día de la Independencia'),
  ('2030-12-08', 'Inmaculada Concepción de María'),
  ('2030-12-25', 'Navidad')
on conflict (fecha) do nothing;

alter table public.feriados enable row level security;

drop policy if exists "feriados_select" on public.feriados;
create policy "feriados_select" on public.feriados
  for select using (public.es_miembro());
drop policy if exists "feriados_insert" on public.feriados;
create policy "feriados_insert" on public.feriados
  for insert with check (public.es_miembro());
drop policy if exists "feriados_delete" on public.feriados;
create policy "feriados_delete" on public.feriados
  for delete using (public.es_miembro());

-- ============================================================
-- 0009_tareas.sql
-- ============================================================

-- Tareas pendientes del día a día.
--
-- Un inquilino avisa que tiene una filtración cuando viene a pagar. Eso no es
-- un cobro, ni un gasto, ni un aviso: es algo que hay que hacer y que hoy se
-- anota en un papel o no se anota. Acá queda colgado de la unidad, del
-- contrato o del inquilino que lo motivó, y se ve todo junto en una pantalla.

create table if not exists public.tareas (
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
create index if not exists tareas_pendientes_idx
  on public.tareas (vence_el nulls last, created_at)
  where deleted_at is null and estado = 'pendiente';

create index if not exists tareas_propiedad_idx on public.tareas (propiedad_id)
  where deleted_at is null;
create index if not exists tareas_contrato_idx on public.tareas (contrato_id)
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

drop trigger if exists tareas_sellar_completada on public.tareas;
create trigger tareas_sellar_completada
  before update on public.tareas
  for each row execute function public.tareas_sellar_completada();

alter table public.tareas enable row level security;

drop policy if exists "tareas_select" on public.tareas;
create policy "tareas_select" on public.tareas
  for select using (public.es_miembro());
drop policy if exists "tareas_insert" on public.tareas;
create policy "tareas_insert" on public.tareas
  for insert with check (public.es_miembro());
drop policy if exists "tareas_update" on public.tareas;
create policy "tareas_update" on public.tareas
  for update using (public.es_miembro());

-- ============================================================
--  Comprobación
-- ============================================================
select 'contrato_cargos' as tabla, count(*) from public.contrato_cargos
union all select 'feriados', count(*) from public.feriados
union all select 'tareas',   count(*) from public.tareas;
