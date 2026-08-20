-- Motor de ajustes: la serie de cada índice y el historial de aumentos.

-- --------------------------------------------------------- valores de índice --
-- Copia local de las series oficiales. El ICL del BCRA es diario; el IPC del
-- INDEC es mensual (se guarda con fecha del día 1). Tener la serie propia
-- evita depender de que la API esté arriba justo el día del cierre, y deja
-- calcular coeficientes entre dos fechas exactas.
create table public.indices_valores (
  indice text not null
    check (indice in ('ICL', 'IPC', 'UVA', 'CASA_PROPIA')),
  fecha date not null,
  valor numeric(20, 8) not null check (valor > 0),
  actualizado_at timestamptz not null default now(),
  primary key (indice, fecha)
);

create index indices_valores_fecha_idx on public.indices_valores (indice, fecha desc);

-- ------------------------------------------------------------------- ajustes --
-- Un renglón por aumento aplicado. Es historial: no se edita ni se borra.
-- Guarda los dos valores del índice usados, así el cálculo queda auditable
-- aunque el organismo corrija la serie después.
create table public.ajustes (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos (id),

  fecha_aplicacion date not null,
  periodo_desde date not null,          -- fecha base del cálculo
  periodo_hasta date not null,          -- fecha final del cálculo

  indice text not null,
  valor_indice_base numeric(20, 8),
  valor_indice_final numeric(20, 8),
  coeficiente numeric(12, 6) not null check (coeficiente > 0),

  monto_anterior numeric(14, 2) not null,
  monto_nuevo numeric(14, 2) not null,

  -- Se avisó al inquilino antes de que empiece a regir.
  notificado_at timestamptz,

  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create index ajustes_contrato_idx on public.ajustes (contrato_id, fecha_aplicacion desc);

alter table public.indices_valores enable row level security;
alter table public.ajustes         enable row level security;

-- La serie de índices la lee todo el equipo; la escribe el proceso automático
-- con la clave de servicio, que no pasa por RLS.
create policy "indices_select" on public.indices_valores
  for select using (public.es_miembro());

create policy "ajustes_select" on public.ajustes
  for select using (public.es_miembro());
create policy "ajustes_insert" on public.ajustes
  for insert with check (public.es_miembro());
-- Solo se puede tocar para marcar que se notificó: el cálculo es inmutable.
create policy "ajustes_update" on public.ajustes
  for update using (public.es_miembro());
