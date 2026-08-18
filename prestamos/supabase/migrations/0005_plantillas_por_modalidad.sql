-- Cada mensaje pasa a tener su propio texto para cada modalidad de préstamo:
-- lo que el cliente necesita saber no es lo mismo en un plan en cuotas que en
-- uno con interés mensual.
--
-- Se guardan juntas en una sola columna, con la forma:
--   { "estado_cuenta": { "semanal": "...", "mensual": "..." }, ... }
-- Solo se guarda lo que el usuario cambió; el resto sale del texto de fábrica.

alter table public.ajustes
  add column if not exists plantillas jsonb not null default '{}'::jsonb;

-- Las columnas viejas quedan como estaban: si alguien ya había guardado un
-- texto ahí, la app lo sigue usando hasta que lo reemplace por modalidad.
