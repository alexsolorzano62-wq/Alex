-- Liquidación mensual al propietario: cobrado − honorarios − gastos = neto.

create sequence if not exists public.liquidacion_numero_seq;

-- ------------------------------------------------------------ liquidaciones --
-- Se agrupa por propietario, no por propiedad: si un dueño tiene tres
-- departamentos recibe una sola liquidación con los tres.
create table public.liquidaciones (
  id uuid primary key default gen_random_uuid(),
  numero bigint not null default nextval('public.liquidacion_numero_seq') unique,
  propietario_id uuid not null references public.propietarios (id),

  periodo date not null,                 -- siempre el día 1 del mes liquidado
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),

  total_cobrado numeric(14, 2) not null default 0,
  total_honorarios numeric(14, 2) not null default 0,
  total_gastos numeric(14, 2) not null default 0,
  total_ajustes numeric(14, 2) not null default 0,
  neto_a_pagar numeric(14, 2) not null default 0,

  estado text not null default 'borrador'
    check (estado in ('borrador', 'emitida', 'pagada', 'anulada')),

  -- Cómo se le rindió la plata. Varía por propietario y hasta por mes:
  -- algunos cobran en efectivo en la oficina y otros por transferencia.
  metodo_pago text
    check (metodo_pago in ('transferencia', 'efectivo')),
  fecha_pago date,
  -- Respaldo de que el propietario recibió: el comprobante si fue
  -- transferencia, la conformidad firmada o registrada si fue en efectivo.
  comprobante_url text,
  conformidad text,
  recibido_por text,

  notas text,

  -- A partir de acá los números quedan congelados (lo fuerza un trigger).
  emitida_at timestamptz,
  emitida_por uuid references auth.users (id),
  anulado_at timestamptz,
  anulado_motivo text,

  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),

  constraint liquidaciones_periodo_dia_1 check (extract(day from periodo) = 1),
  constraint liquidaciones_pagada_completa check (
    estado <> 'pagada'
    or (metodo_pago is not null and fecha_pago is not null)
  )
);

create index liquidaciones_propietario_idx
  on public.liquidaciones (propietario_id, periodo desc);

-- Un propietario tiene una sola liquidación vigente por mes y moneda.
create unique index liquidaciones_propietario_periodo_unico
  on public.liquidaciones (propietario_id, periodo, moneda)
  where anulado_at is null;

-- --------------------------------------------------------------- el detalle --
-- Cada renglón de lo que el propietario ve en su liquidación.
create table public.liquidacion_detalle (
  id uuid primary key default gen_random_uuid(),
  liquidacion_id uuid not null references public.liquidaciones (id) on delete cascade,
  contrato_id uuid references public.contratos (id),

  tipo text not null check (tipo in ('cobro', 'gasto', 'ajuste')),
  cobro_id uuid references public.cobros (id),
  gasto_id uuid references public.gastos (id),

  descripcion text not null,
  -- Positivo lo que suma (el alquiler cobrado), negativo lo que resta
  -- (un gasto, una nota de crédito).
  monto_bruto numeric(14, 2) not null,

  -- El porcentaje con el que se liquidó, congelado en el renglón. Si mañana
  -- se renegocia de 8 a 9, esta liquidación sigue diciendo 8 para siempre.
  honorarios_porcentaje numeric(5, 2),
  honorarios_monto numeric(14, 2) not null default 0,

  neto numeric(14, 2) not null,
  orden integer not null default 0
);

create index liquidacion_detalle_liq_idx
  on public.liquidacion_detalle (liquidacion_id, orden);

-- Un cobro no puede entrar en dos liquidaciones.
create unique index liquidacion_detalle_cobro_unico
  on public.liquidacion_detalle (cobro_id)
  where cobro_id is not null;

alter table public.gastos
  add constraint gastos_liquidacion_fk
  foreign key (liquidacion_id) references public.liquidaciones (id);

-- -------------------------------------------- inmutabilidad de la emitida --
create or replace function public.liquidaciones_inmutables()
returns trigger
language plpgsql
as $$
begin
  if old.emitida_at is null then
    return new;                          -- todavía es borrador: se edita libre
  end if;

  if (new.propietario_id, new.periodo, new.moneda,
      new.total_cobrado, new.total_honorarios, new.total_gastos,
      new.total_ajustes, new.neto_a_pagar)
     is distinct from
     (old.propietario_id, old.periodo, old.moneda,
      old.total_cobrado, old.total_honorarios, old.total_gastos,
      old.total_ajustes, old.neto_a_pagar)
  then
    raise exception
      'La liquidación % ya fue emitida: sus números no se modifican. Anulala y emití una nueva.',
      old.numero;
  end if;

  return new;
end;
$$;

create trigger liquidaciones_inmutables_trg
  before update on public.liquidaciones
  for each row execute function public.liquidaciones_inmutables();

create trigger liquidaciones_sin_borrado
  before delete on public.liquidaciones
  for each row execute function public.prohibir_borrado();

-- El detalle de una liquidación emitida tampoco se toca.
create or replace function public.detalle_liquidacion_emitida()
returns trigger
language plpgsql
as $$
declare
  emitida timestamptz;
  liq_id uuid;
begin
  liq_id := coalesce(new.liquidacion_id, old.liquidacion_id);
  select l.emitida_at into emitida
    from public.liquidaciones l where l.id = liq_id;

  if emitida is not null then
    raise exception 'La liquidación ya fue emitida: su detalle no se modifica.';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger detalle_liquidacion_emitida_trg
  before insert or update or delete on public.liquidacion_detalle
  for each row execute function public.detalle_liquidacion_emitida();

-- ----------------------------------------------------------------------- RLS --
alter table public.liquidaciones       enable row level security;
alter table public.liquidacion_detalle enable row level security;

create policy "liquidaciones_select" on public.liquidaciones
  for select using (public.es_miembro());
create policy "liquidaciones_insert" on public.liquidaciones
  for insert with check (public.es_miembro());
create policy "liquidaciones_update" on public.liquidaciones
  for update using (public.es_miembro());

create policy "liquidacion_detalle_select" on public.liquidacion_detalle
  for select using (public.es_miembro());
create policy "liquidacion_detalle_insert" on public.liquidacion_detalle
  for insert with check (public.es_miembro());
create policy "liquidacion_detalle_delete" on public.liquidacion_detalle
  for delete using (public.es_miembro());
