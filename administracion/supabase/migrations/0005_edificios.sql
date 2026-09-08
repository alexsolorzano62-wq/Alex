-- Agrupar la cartera por edificio.
--
-- La mayoría de las veces "edificio" es simplemente la dirección: dos unidades
-- en Rivadavia 2340 están en el mismo edificio y se agrupan solas, sin cargar
-- nada. Este campo existe para los dos casos en que eso no alcanza:
--
--   1. El edificio tiene nombre propio y queda mejor verlo como "Edificio
--      Belgrano" que como "Belgrano 1287".
--   2. Las unidades del mismo edificio se cargaron con la dirección escrita
--      distinto ("Rivadavia 2340" y "Av. Rivadavia 2340") y hay que unirlas.
--
-- Cuando está cargado, manda sobre la dirección para armar el grupo.

alter table public.propiedades
  add column if not exists edificio text;

comment on column public.propiedades.edificio is
  'Nombre del edificio. Si está vacío, la unidad se agrupa por su dirección.';

create index if not exists propiedades_edificio_idx
  on public.propiedades (edificio)
  where deleted_at is null and edificio is not null;
