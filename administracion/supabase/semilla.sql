-- Datos de prueba para ver la app funcionando sin cargar nada a mano.
--
-- NO es una migración: no va en supabase/migrations/ y no se corre en la base
-- de verdad. Es para probar el ciclo completo del mes —contratos, aumentos,
-- cobros, gastos y liquidación— antes de tocar la cartera real.
--
-- Cómo usarlo:
--   1. Corré antes las cinco migraciones y creá tu usuario administrador.
--   2. Pegá esto entero en SQL Editor → New query y ejecutalo.
--   3. Entrá a la app: vas a ver 10 unidades, con el mes en curso a medio cobrar.
--
-- Para borrarlo todo y dejar la base limpia, al final del archivo está la
-- consulta de limpieza, comentada.
--
-- Las fechas se calculan contra el día de hoy, así que el archivo no se vence:
-- lo corras cuando lo corras, el mes en curso queda a medio cobrar.

begin;

-- ------------------------------------------------------------ propietarios --
insert into public.propietarios (id, nombre, documento, telefono, email, forma_cobro, cbu, alias_cbu, notas) values
  ('a0000000-0000-4000-8000-000000000001', 'Roberto Ángel Peña', '20-14785236-3', '381 415-8877', 'rpena@ejemplo.com',
   'transferencia', '0110599520000012345678', 'pena.roberto.mp', 'Tiene unidades sueltas en tres direcciones.'),
  ('a0000000-0000-4000-8000-000000000002', 'Nélida Ferrari', '27-10254789-1', '381 422-3311', null,
   'efectivo', null, null, 'Dueña del edificio de Rivadavia. Retira en la oficina los primeros días del mes.'),
  ('a0000000-0000-4000-8000-000000000003', 'Hermanos Duarte S.H.', '30-71025896-4', '381 430-9090', 'duarte.sh@ejemplo.com',
   'transferencia', '0720099788000098765432', 'duarte.sh', null);

-- -------------------------------------------------------------- inquilinos --
insert into public.inquilinos (id, nombre, documento, telefono, email) values
  ('b0000000-0000-4000-8000-000000000001', 'María Fernanda Gutiérrez', 'DNI 32.145.876', '381 555-1122', 'mfgutierrez@ejemplo.com'),
  ('b0000000-0000-4000-8000-000000000002', 'Diego Sosa',                'DNI 28.994.310', '381 555-3344', null),
  ('b0000000-0000-4000-8000-000000000003', 'Carlos Alberto Ruiz',       'DNI 25.487.102', '381 555-5566', null),
  ('b0000000-0000-4000-8000-000000000004', 'Ana Vera',                  'DNI 35.220.114', '381 555-7788', 'anavera@ejemplo.com'),
  ('b0000000-0000-4000-8000-000000000005', 'Luis Valenzuela',           'DNI 30.118.447', '381 555-9900', null),
  ('b0000000-0000-4000-8000-000000000006', 'Rocío Konsorki',            'DNI 38.756.223', '381 556-1234', null),
  ('b0000000-0000-4000-8000-000000000007', 'Gabriela Ledesma',          'DNI 33.401.998', '381 556-5678', null),
  ('b0000000-0000-4000-8000-000000000008', 'Estudio Contable Vega',     '30-70889654-2', '381 456-0011', 'estudiovega@ejemplo.com'),
  ('b0000000-0000-4000-8000-000000000009', 'Esteban Hrabric',           'DNI 29.774.560', '381 556-4321', null);

-- ------------------------------------------------------------- propiedades --
-- Peña: tres direcciones distintas. Es el caso de "agrupar por propietario".
insert into public.propiedades (id, propietario_id, direccion, piso_depto, localidad, tipo, ambientes, estado, expensas_unidad) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Mitre 450',     '2ºB',  'San Miguel de Tucumán', 'departamento', 2, 'alquilado', '2B'),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Alsina 670',    '1ºC',  'San Miguel de Tucumán', 'departamento', 3, 'alquilado', null),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Belgrano 1287', null,   'San Miguel de Tucumán', 'casa',         4, 'alquilado', null);

-- Ferrari: el edificio entero. Es el caso de "agrupar por edificio".
-- Una unidad se cargó con la dirección escrita distinto a propósito, para que
-- se vea para qué sirve el campo `edificio`.
insert into public.propiedades (id, propietario_id, direccion, piso_depto, localidad, tipo, ambientes, estado, edificio, expensas_unidad) values
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'Rivadavia 2340',     '1ºA', 'San Miguel de Tucumán', 'departamento', 2, 'alquilado',  'Edificio Rivadavia', '1A'),
  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002', 'Rivadavia 2340',     '2ºA', 'San Miguel de Tucumán', 'departamento', 2, 'alquilado',  'Edificio Rivadavia', '2A'),
  ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000002', 'Rivadavia 2340',     '3ºA', 'San Miguel de Tucumán', 'departamento', 2, 'alquilado',  'Edificio Rivadavia', '3A'),
  ('c0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000002', 'Av. Rivadavia 2340', '4ºA', 'San Miguel de Tucumán', 'departamento', 3, 'alquilado',  'Edificio Rivadavia', '4A'),
  ('c0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000002', 'Rivadavia 2340',     'PB',  'San Miguel de Tucumán', 'monoambiente', 1, 'disponible', 'Edificio Rivadavia', 'PB');

-- Duarte: un local y un departamento.
insert into public.propiedades (id, propietario_id, direccion, piso_depto, localidad, tipo, ambientes, estado, partida_inmobiliaria) values
  ('c0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000003', 'San Martín 890', 'PB',  'San Miguel de Tucumán', 'local',        1, 'alquilado', '300913'),
  ('c0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000003', 'Chacabuco 452',  '9ºD', 'San Miguel de Tucumán', 'departamento', 3, 'alquilado', '301447');

-- ---------------------------------------------------------------- contratos --
-- Nueve contratos activos con índices, porcentajes y monedas distintos, para
-- que se vea cómo se comporta cada caso. Las fechas se cuentan desde hoy.
insert into public.contratos (
  id, propiedad_id, inquilino_id, garantes, fecha_inicio, fecha_fin, destino, moneda,
  monto_inicial, monto_actual, deposito_monto, dia_vencimiento, honorarios_porcentaje,
  indice, ajuste_frecuencia_meses, ajuste_porcentaje_fijo,
  fecha_ultimo_ajuste, fecha_proximo_ajuste,
  punitorio_tipo, punitorio_valor, punitorio_dias_gracia, observaciones
) values
  -- Con el ajuste ya vencido: aparece en la pantalla de Aumentos.
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
   'Jorge Gutiérrez, DNI 20.114.556', current_date - interval '14 months', current_date + interval '10 months',
   'vivienda', 'ARS', 420000, 500000, 500000, 10, 8,
   'ICL', 3, null, (date_trunc('month', current_date) - interval '4 months')::date,
   (date_trunc('month', current_date) - interval '1 month')::date,
   'porcentaje_diario', 0.1, 0, null),

  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002',
   null, current_date - interval '8 months', current_date + interval '2 months',
   'vivienda', 'ARS', 520000, 585500, 520000, 5, 8,
   'ICL', 3, null, (date_trunc('month', current_date) - interval '2 months')::date,
   (date_trunc('month', current_date) + interval '1 month')::date,
   'porcentaje_diario', 0.1, 3, 'El contrato vence pronto: hay que hablar de renovación.'),

  ('d0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000003',
   'Seguro de caución', current_date - interval '20 months', current_date + interval '4 months',
   'vivienda', 'ARS', 380000, 448500, 380000, 10, 9,
   'IPC', 4, null, (date_trunc('month', current_date) - interval '3 months')::date,
   (date_trunc('month', current_date) + interval '1 month')::date,
   'monto_fijo_diario', 2000, 0, null),

  -- Edificio Rivadavia, todos al 7%.
  ('d0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000004',
   null, current_date - interval '6 months', current_date + interval '18 months',
   'vivienda', 'ARS', 380000, 400000, 380000, 10, 7,
   'ICL', 3, null, (date_trunc('month', current_date) - interval '3 months')::date,
   date_trunc('month', current_date)::date,
   'porcentaje_diario', 0.1, 0, null),

  ('d0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000005',
   null, current_date - interval '11 months', current_date + interval '13 months',
   'vivienda', 'ARS', 350000, 415000, 350000, 10, 7,
   'ICL', 3, null, (date_trunc('month', current_date) - interval '2 months')::date,
   (date_trunc('month', current_date) + interval '1 month')::date,
   'porcentaje_diario', 0.1, 0, 'Paga siempre unos días tarde.'),

  ('d0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000006',
   null, current_date - interval '5 months', current_date + interval '19 months',
   'vivienda', 'ARS', 430000, 430000, 430000, 10, 7,
   'FIJO', 6, 12, null, (date_trunc('month', current_date) + interval '1 month')::date,
   'porcentaje_diario', 0.1, 0, null),

  ('d0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000007',
   null, current_date - interval '9 months', current_date + interval '15 months',
   'vivienda', 'ARS', 460000, 495000, 460000, 10, 7,
   'IPC', 3, null, (date_trunc('month', current_date) - interval '3 months')::date,
   date_trunc('month', current_date)::date,
   'porcentaje_diario', 0.1, 0, 'Debe agua y CISI de dos períodos.'),

  -- Un local comercial, con el honorario más alto.
  ('d0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000008',
   'Fianza solidaria de los socios', current_date - interval '16 months', current_date + interval '20 months',
   'comercial', 'ARS', 900000, 1120000, 1800000, 10, 10,
   'ICL', 3, null, (date_trunc('month', current_date) - interval '1 month')::date,
   (date_trunc('month', current_date) + interval '2 months')::date,
   'porcentaje_diario', 0.15, 0, null),

  -- Uno en dólares, para ver que los totales no mezclan monedas.
  ('d0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000010', 'b0000000-0000-4000-8000-000000000009',
   null, current_date - interval '3 months', current_date + interval '21 months',
   'vivienda', 'USD', 450, 450, 900, 10, 10,
   'SIN_AJUSTE', 12, null, null, null,
   'ninguno', 0, 0, 'Contrato pactado en dólares, se paga en dólares.');

commit;

-- ------------------------------------------------------------ los índices --
-- Series sintéticas para que la pantalla de Aumentos pueda calcular. El ICL
-- real se baja desde Más → Índices; esto es solo para la prueba.
begin;

insert into public.indices_valores (indice, fecha, valor)
select
  'ICL',
  dia::date,
  round((10 * power(1.04, extract(epoch from (dia - (current_date - interval '18 months'))) / (30.44 * 86400)))::numeric, 8)
from generate_series(current_date - interval '18 months', current_date, interval '1 day') as dia
on conflict (indice, fecha) do nothing;

insert into public.indices_valores (indice, fecha, valor)
select
  'IPC',
  date_trunc('month', mes)::date,
  round((100 * power(1.045, extract(epoch from (mes - (current_date - interval '18 months'))) / (30.44 * 86400)))::numeric, 8)
from generate_series(current_date - interval '18 months', current_date, interval '1 month') as mes
on conflict (indice, fecha) do nothing;

commit;

-- ------------------------------------------------------------------ cobros --
-- El mes anterior está cobrado en todos menos en Rivadavia 4ºA: es el que
-- después queda en amarillo por arrastrar un mes.
begin;

with contratos_del_mes_pasado as (
  select c.id, c.monto_actual, c.moneda, c.dia_vencimiento,
         (date_trunc('month', current_date) - interval '1 month')::date as periodo
    from public.contratos c
   where c.id <> 'd0000000-0000-4000-8000-000000000007'
),
insertados as (
  insert into public.cobros (contrato_id, periodo, fecha_pago, vencimiento, moneda, total, medio_pago)
  select
    id,
    periodo,
    (periodo + (dia_vencimiento - 1) * interval '1 day')::date,
    (periodo + (dia_vencimiento - 1) * interval '1 day')::date,
    moneda,
    monto_actual,
    case when random() < 0.5 then 'transferencia' else 'efectivo' end
  from contratos_del_mes_pasado
  returning id, contrato_id, total
)
insert into public.cobro_conceptos (cobro_id, tipo, descripcion, monto, orden)
select id, 'alquiler', 'Alquiler del mes anterior', total, 0 from insertados;

commit;

-- El mes en curso, a propósito a medio cobrar: tres verdes, dos amarillos y
-- cuatro naranjas, para ver los tres estados de la planilla.
begin;

-- Verde: pagaron el alquiler completo.
insert into public.cobros (id, contrato_id, periodo, fecha_pago, vencimiento, moneda, total, medio_pago, notas) values
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   date_trunc('month', current_date)::date, current_date - 2,
   (date_trunc('month', current_date) + interval '9 days')::date, 'ARS', 618000, 'transferencia', null),

  ('e0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000004',
   date_trunc('month', current_date)::date, current_date - 5,
   (date_trunc('month', current_date) + interval '9 days')::date, 'ARS', 400000, 'efectivo', null),

  ('e0000000-0000-4000-8000-000000000008', 'd0000000-0000-4000-8000-000000000008',
   date_trunc('month', current_date)::date, current_date - 1,
   (date_trunc('month', current_date) + interval '9 days')::date, 'ARS', 1120000, 'transferencia', null),

  -- Amarillo: entregó menos que el alquiler, queda saldo.
  ('e0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000005',
   date_trunc('month', current_date)::date, current_date,
   (date_trunc('month', current_date) + interval '9 days')::date, 'ARS', 250000, 'efectivo',
   'Entregó una parte, dijo que completa la semana que viene.'),

  -- Amarillo: pagó todo este mes, pero no pagó el anterior.
  ('e0000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000007',
   date_trunc('month', current_date)::date, current_date - 3,
   (date_trunc('month', current_date) + interval '9 days')::date, 'ARS', 495000, 'transferencia', null);

insert into public.cobro_conceptos (cobro_id, tipo, descripcion, monto, orden) values
  -- Mitre 450: alquiler más expensas.
  ('e0000000-0000-4000-8000-000000000001', 'alquiler', 'Alquiler del mes',        500000, 0),
  ('e0000000-0000-4000-8000-000000000001', 'expensas', 'Expensas ordinarias',     118000, 1),
  ('e0000000-0000-4000-8000-000000000004', 'alquiler', 'Alquiler del mes',        400000, 0),
  ('e0000000-0000-4000-8000-000000000008', 'alquiler', 'Alquiler del mes',       1120000, 0),
  ('e0000000-0000-4000-8000-000000000005', 'alquiler', 'Entrega a cuenta',        250000, 0),
  ('e0000000-0000-4000-8000-000000000007', 'alquiler', 'Alquiler del mes',        495000, 0);

commit;

-- ------------------------------------------------------------------ gastos --
begin;

insert into public.gastos (propiedad_id, contrato_id, fecha, tipo, descripcion, monto, a_cargo_de, notas) values
  -- Pendientes de imputar: aparecen en el panel y al cobrar o liquidar.
  ('c0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000003',
   current_date - 6, 'abl', 'ABL bimestral', 48500, 'inquilino', null),
  ('c0000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000006',
   current_date - 9, 'reparacion', 'Cambio de termotanque', 185000, 'propietario', 'Se rompió el anterior, hubo que reponerlo.'),
  ('c0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000004',
   current_date - 4, 'expensas', 'Expensas extraordinarias por bomba de agua', 92000, 'propietario', null),
  ('c0000000-0000-4000-8000-000000000008', null,
   current_date - 12, 'reparacion', 'Pintura de la unidad antes de alquilar', 260000, 'propietario', 'La unidad está vacía.'),

  -- Ya cobrado al inquilino en el recibo de Mitre 450.
  ('c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   current_date - 8, 'expensas', 'Expensas ordinarias', 118000, 'inquilino', null);

update public.gastos
   set cobro_id = 'e0000000-0000-4000-8000-000000000001'
 where propiedad_id = 'c0000000-0000-4000-8000-000000000001'
   and tipo = 'expensas'
   and cobro_id is null;

commit;

-- ------------------------------------------------------------- para borrar --
-- Cuando termines de probar y quieras dejar la base limpia para la cartera
-- real, descomentá y corré esto. Va en orden inverso por las claves foráneas.
--
-- begin;
-- delete from public.liquidacion_detalle where liquidacion_id in (select id from public.liquidaciones);
-- alter table public.liquidaciones disable trigger liquidaciones_sin_borrado;
-- delete from public.liquidaciones;
-- alter table public.liquidaciones enable trigger liquidaciones_sin_borrado;
-- delete from public.gastos;
-- alter table public.cobro_conceptos disable trigger cobro_conceptos_sin_borrado;
-- alter table public.cobros disable trigger cobros_sin_borrado;
-- delete from public.cobro_conceptos;
-- delete from public.cobros;
-- alter table public.cobros enable trigger cobros_sin_borrado;
-- alter table public.cobro_conceptos enable trigger cobro_conceptos_sin_borrado;
-- delete from public.ajustes;
-- delete from public.contratos;
-- delete from public.propiedades;
-- delete from public.inquilinos;
-- delete from public.propietarios;
-- delete from public.indices_valores;
-- commit;
