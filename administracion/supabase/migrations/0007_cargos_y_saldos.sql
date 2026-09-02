-- Cobros fijos además del alquiler, y el saldo que queda de un mes a otro.
--
-- Hay unidades que todos los meses pagan alquiler y agua, otras alquiler y
-- CISI, otras alquiler y luz. Hasta ahora eso se agregaba a mano en cada
-- recibo, mes por mes: 130 unidades por doce meses es mucho lugar para
-- olvidarse uno. Ahora se declara una vez en el contrato y aparece solo.

create table public.contrato_cargos (
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

create index contrato_cargos_contrato_idx
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

create policy "contrato_cargos_select" on public.contrato_cargos
  for select using (public.es_miembro());
create policy "contrato_cargos_insert" on public.contrato_cargos
  for insert with check (public.es_miembro());
create policy "contrato_cargos_update" on public.contrato_cargos
  for update using (public.es_miembro());
