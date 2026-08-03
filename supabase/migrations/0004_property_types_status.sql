-- Alinea tipos de propiedad y estados con el uso real de la inmobiliaria
-- (según planilla de referencia): agrega monoambiente/dúplex/galpón/estacionamiento,
-- y reemplaza el estado "alquilado" por "no_disponible".
-- Correr en el SQL Editor, después de 0003_roles.sql.

update public.listings set status = 'no_disponible' where status = 'alquilado';

alter table public.listings drop constraint if exists listings_status_check;
alter table public.listings add constraint listings_status_check
  check (status in ('disponible', 'reservado', 'no_disponible'));

alter table public.listings drop constraint if exists listings_property_type_check;
alter table public.listings add constraint listings_property_type_check
  check (property_type in (
    'monoambiente', 'departamento', 'casa', 'duplex',
    'local', 'oficina', 'galpon', 'estacionamiento', 'terreno'
  ));
