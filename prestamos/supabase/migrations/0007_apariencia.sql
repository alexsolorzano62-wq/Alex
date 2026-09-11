-- Cómo se ve la app para cada usuario: tema claro u oscuro y tipografía.
--
-- Se guarda en la base y no en el navegador para que la elección viaje con el
-- usuario: si entra desde otro teléfono, la app se ve igual.

alter table public.ajustes
  add column if not exists tema text not null default 'claro'
    check (tema in ('claro', 'oscuro')),
  add column if not exists fuente text not null default 'sistema';
