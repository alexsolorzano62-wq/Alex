-- Plantilla del comprobante que se le manda al cliente cuando paga.
-- Como las otras, si queda vacía la app usa el texto que trae por defecto.

alter table public.ajustes
  add column if not exists plantilla_comprobante text;
