-- Habilita la modalidad 'semanal': planes con cuotas semanales según la lista
-- de precios de `lib/planes.ts`.
--
-- En un préstamo semanal, `cuotas_total` guarda la cantidad de semanas y
-- `cuota_monto` el valor de cada cuota, igual que en los planes mensuales.

alter table public.prestamos
  drop constraint if exists prestamos_modalidad_check;

alter table public.prestamos
  add constraint prestamos_modalidad_check
    check (modalidad in ('mensual', 'cuotas', 'semanal'));

-- Todo plan cerrado necesita su cantidad de cuotas y su total, sea semanal o
-- mensual. Antes esto solo se exigía para 'cuotas'.
alter table public.prestamos
  drop constraint if exists prestamos_cuotas_completas;

alter table public.prestamos
  add constraint prestamos_cuotas_completas
    check (
      modalidad = 'mensual'
      or (cuotas_total is not null and total_a_devolver is not null)
    );
