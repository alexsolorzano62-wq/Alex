-- Modalidad 'personalizado': se carga el capital, la tasa por mes y cada cuánto
-- paga (semanal, quincenal o mensual), y la app arma el plan de cuotas.
--
-- La frecuencia se guarda aparte porque ahora no se deduce de la modalidad:
-- un plan personalizado puede cobrarse por semana, por quincena o por mes.

alter table public.prestamos
  add column if not exists frecuencia text
    check (frecuencia is null or frecuencia in ('semanal', 'quincenal', 'mensual'));

-- Los préstamos ya cargados se completan según cómo venían funcionando.
update public.prestamos
   set frecuencia = case modalidad
                      when 'semanal' then 'semanal'
                      when 'cuotas' then 'mensual'
                    end
 where frecuencia is null
   and modalidad in ('semanal', 'cuotas');

alter table public.prestamos
  drop constraint if exists prestamos_modalidad_check;

alter table public.prestamos
  add constraint prestamos_modalidad_check
    check (modalidad in ('mensual', 'cuotas', 'semanal', 'personalizado'));
