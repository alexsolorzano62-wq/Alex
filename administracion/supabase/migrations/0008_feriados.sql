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

create table public.feriados (
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

create policy "feriados_select" on public.feriados
  for select using (public.es_miembro());
create policy "feriados_insert" on public.feriados
  for insert with check (public.es_miembro());
create policy "feriados_delete" on public.feriados
  for delete using (public.es_miembro());
