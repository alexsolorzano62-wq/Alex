-- Campos extra para listings: mascotas, amoblado y expensas.
-- Correr en el SQL Editor del proyecto Supabase, después de 0001_init.sql.

alter table public.listings
  add column if not exists pets_allowed boolean,
  add column if not exists furnished boolean,
  add column if not exists expenses numeric;
