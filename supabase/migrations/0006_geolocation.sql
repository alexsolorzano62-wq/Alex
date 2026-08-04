-- Ubicación geográfica de los alquileres: coordenadas para mostrar el mapa
-- y abrir la dirección en Google Maps / Waze desde el celular.
-- Correr en el SQL Editor, después de 0005_contract_fields_suggestions.sql.

alter table public.listings
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;
