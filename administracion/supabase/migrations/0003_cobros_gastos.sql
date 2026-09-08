-- Cobranzas al inquilino y gastos del inmueble.

create sequence if not exists public.recibo_numero_seq;

-- -------------------------------------------------------------------- cobros --
-- Cabecera del recibo. Un recibo emitido NO se modifica: si hubo un error se
-- anula y se emite uno nuevo. Eso lo garantiza un trigger, no la interfaz.
create table public.cobros (
  id uuid primary key default gen_random_uuid(),
  numero bigint not null default nextval('public.recibo_numero_seq') unique,
  contrato_id uuid not null references public.contratos (id),

  -- Mes que se está pagando (siempre el día 1 del período).
  periodo date not null,
  fecha_pago date not null,
  vencimiento date not null,

  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  -- Suma de los conceptos. Se guarda congelado para que el recibo diga
  -- siempre lo mismo que decía el día que se entregó.
  total numeric(14, 2) not null check (total >= 0),

  medio_pago text not null default 'transferencia'
    check (medio_pago in ('transferencia', 'efectivo', 'cheque', 'deposito', 'otro')),
  comprobante_url text,
  notas text,

  -- Cuántas veces se reimprimió: a partir de la segunda, el PDF sale con la
  -- leyenda DUPLICADO para que no se presente dos veces como pagos distintos.
  emisiones integer not null default 1 check (emisiones >= 1),

  anulado_at timestamptz,
  anulado_motivo text,
  anulado_por uuid references auth.users (id),

  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),

  constraint cobros_periodo_dia_1 check (extract(day from periodo) = 1),
  constraint cobros_anulacion_con_motivo check (
    anulado_at is null or anulado_motivo is not null
  )
);

create index cobros_contrato_idx on public.cobros (contrato_id, periodo desc);
create index cobros_periodo_idx on public.cobros (periodo desc) where anulado_at is null;

-- Un contrato no puede tener dos recibos vigentes del mismo mes.
create unique index cobros_contrato_periodo_unico
  on public.cobros (contrato_id, periodo)
  where anulado_at is null;

-- ---------------------------------------------------------- detalle del recibo --
create table public.cobro_conceptos (
  id uuid primary key default gen_random_uuid(),
  cobro_id uuid not null references public.cobros (id) on delete cascade,
  tipo text not null
    check (tipo in (
      'alquiler', 'expensas', 'abl', 'luz', 'gas', 'agua',
      'punitorios', 'reparacion', 'ajuste_manual', 'otro'
    )),
  descripcion text,
  monto numeric(14, 2) not null,
  orden integer not null default 0
);

create index cobro_conceptos_cobro_idx on public.cobro_conceptos (cobro_id, orden);

-- -------------------------------------------------------------------- gastos --
-- Un gasto del inmueble. Según de quién sea la carga, termina en el recibo del
-- inquilino o descontado de la liquidación del propietario. Las columnas
-- cobro_id y liquidacion_id son las que impiden cobrarlo o descontarlo dos veces.
create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  propiedad_id uuid not null references public.propiedades (id),
  contrato_id uuid references public.contratos (id),

  fecha date not null,
  tipo text not null default 'otro'
    check (tipo in (
      'expensas', 'abl', 'luz', 'gas', 'agua', 'reparacion',
      'seguro', 'honorarios_profesionales', 'impuesto', 'otro'
    )),
  descripcion text not null,
  monto numeric(14, 2) not null check (monto > 0),
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),

  a_cargo_de text not null default 'propietario'
    check (a_cargo_de in ('propietario', 'inquilino')),

  comprobante_url text,
  notas text,

  -- Dónde quedó imputado. Mientras estén en null, el gasto está pendiente.
  cobro_id uuid references public.cobros (id),
  liquidacion_id uuid,                    -- FK agregada en 0004

  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create index gastos_propiedad_idx on public.gastos (propiedad_id, fecha desc);
create index gastos_pendientes_idx on public.gastos (a_cargo_de, fecha)
  where cobro_id is null and liquidacion_id is null and deleted_at is null;

-- ------------------------------------------------- inmutabilidad del recibo --
create or replace function public.cobros_inmutables()
returns trigger
language plpgsql
as $$
begin
  if old.anulado_at is not null
     and new.anulado_at is not distinct from old.anulado_at then
    raise exception 'El recibo % está anulado: no se puede modificar.', old.numero;
  end if;

  if (new.numero, new.contrato_id, new.periodo, new.fecha_pago, new.total, new.moneda)
     is distinct from
     (old.numero, old.contrato_id, old.periodo, old.fecha_pago, old.total, old.moneda)
  then
    raise exception
      'Un recibo emitido no se edita. Anulá el recibo % y emití uno nuevo.',
      old.numero;
  end if;

  return new;
end;
$$;

create trigger cobros_inmutables_trg
  before update on public.cobros
  for each row execute function public.cobros_inmutables();

create or replace function public.prohibir_borrado()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'Esta tabla no admite borrado: anulá el registro para conservar el historial.';
end;
$$;

create trigger cobros_sin_borrado
  before delete on public.cobros
  for each row execute function public.prohibir_borrado();

-- Los conceptos siguen la suerte de su recibo: no se editan por separado.
create trigger cobro_conceptos_sin_borrado
  before delete on public.cobro_conceptos
  for each row execute function public.prohibir_borrado();

-- ----------------------------------------------------------------------- RLS --
alter table public.cobros          enable row level security;
alter table public.cobro_conceptos enable row level security;
alter table public.gastos          enable row level security;

create policy "cobros_select" on public.cobros
  for select using (public.es_miembro());
create policy "cobros_insert" on public.cobros
  for insert with check (public.es_miembro());
-- Anular es la única modificación real, y la reserva el administrador.
create policy "cobros_update" on public.cobros
  for update using (public.es_admin());

create policy "cobro_conceptos_select" on public.cobro_conceptos
  for select using (public.es_miembro());
create policy "cobro_conceptos_insert" on public.cobro_conceptos
  for insert with check (public.es_miembro());

create policy "gastos_select" on public.gastos
  for select using (public.es_miembro());
create policy "gastos_insert" on public.gastos
  for insert with check (public.es_miembro());
create policy "gastos_update" on public.gastos
  for update using (public.es_miembro());
