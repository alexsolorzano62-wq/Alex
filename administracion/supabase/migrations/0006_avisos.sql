-- Registro de los avisos que se le mandaron a cada uno.
--
-- Los mensajes salen por WhatsApp desde el teléfono de la inmobiliaria: la app
-- arma el texto y abre el chat, la persona toca enviar. Lo que se guarda acá
-- es que ese aviso ya salió, para no mandar dos veces el mismo recordatorio y
-- para poder decir "a este se le avisó el martes" cuando alguien lo discuta.
--
-- No se impide reenviar: a veces hay que insistir, y esa insistencia también
-- queda registrada.

create table public.avisos_enviados (
  id uuid primary key default gen_random_uuid(),

  tipo text not null
    check (tipo in ('vencimiento', 'aumento', 'liquidacion', 'recibo')),

  -- Según el tipo, el aviso cuelga de un contrato o de una liquidación.
  contrato_id uuid references public.contratos (id),
  liquidacion_id uuid references public.liquidaciones (id),
  -- El mes al que corresponde el aviso, para no repetirlo dentro del mismo mes.
  periodo date,

  -- A qué número se mandó, tal como estaba ese día: si mañana el inquilino
  -- cambia de teléfono, el registro sigue diciendo adónde fue el aviso.
  destino text,

  enviado_at timestamptz not null default now(),
  enviado_por uuid references auth.users (id),

  constraint avisos_cuelgan_de_algo check (
    contrato_id is not null or liquidacion_id is not null
  )
);

create index avisos_contrato_idx
  on public.avisos_enviados (contrato_id, tipo, periodo desc);

create index avisos_liquidacion_idx
  on public.avisos_enviados (liquidacion_id);

alter table public.avisos_enviados enable row level security;

create policy "avisos_select" on public.avisos_enviados
  for select using (public.es_miembro());
create policy "avisos_insert" on public.avisos_enviados
  for insert with check (public.es_miembro());
