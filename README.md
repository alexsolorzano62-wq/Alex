# Alquileres — app privada para la inmobiliaria

App mobile-first para que los agentes/vendedores carguen y consulten alquileres disponibles
desde el celular. Acceso privado con usuario y contraseña por agente.

- Todos los agentes ven todos los alquileres cargados por el equipo.
- Cada agente solo puede editar/eliminar los alquileres que él mismo cargó.
- Las fotos se sacan directamente con la cámara del celular o se eligen de la galería.
- No hay registro público: las cuentas las da de alta el administrador.

## Stack

- [Next.js](https://nextjs.org/) (App Router, TypeScript) + [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) — base de datos, autenticación y almacenamiento de fotos
- [Vercel](https://vercel.com/) — hosting (recomendado, tiene plan gratuito)

## 1. Crear el proyecto en Supabase (gratis)

1. Entrá a [supabase.com](https://supabase.com/) y creá una cuenta gratuita.
2. Creá un **New project** (elegí una región cercana, ej. South America).
3. Guardá la contraseña de la base de datos que te pida (no hace falta para esta app, pero
   por las dudas).
4. Andá a **Project Settings → API** y copiá:
   - `Project URL` → va en `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Correr la migración (crea las tablas, permisos y el storage de fotos)

1. En el panel de Supabase, andá a **SQL Editor → New query**.
2. Pegá todo el contenido de [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql).
3. Ejecutalo (▶ Run). Esto crea:
   - la tabla `profiles` (perfil de cada agente)
   - la tabla `listings` (los alquileres)
   - las reglas de seguridad (RLS): todos ven todo, cada uno edita solo lo suyo
   - el bucket privado `listing-photos` para las fotos
4. Repetí el mismo paso con [`supabase/migrations/0002_extra_fields.sql`](./supabase/migrations/0002_extra_fields.sql)
   (agrega los campos de mascotas, amoblado y expensas). Si agregás más migraciones a futuro,
   se corren siempre en orden numérico.

## 3. Dar de alta a los agentes (manual, sin registro público)

1. En Supabase, andá a **Authentication → Users → Add user**.
2. Cargá el email y una contraseña provisoria para cada agente.
3. Pasale esas credenciales al agente (puede cambiar la contraseña después desde
   "Reset password" si querés habilitar esa opción).

No hace falta hacer nada más: el trigger de la migración crea automáticamente su perfil.

## 4. Configurar el proyecto localmente

```bash
cp .env.local.example .env.local
# completá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY con los datos del paso 1

npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) — te va a redirigir a `/login`.

## 5. Desplegar a Vercel (gratis)

1. Subí este repo a GitHub (si no lo está ya).
2. Entrá a [vercel.com](https://vercel.com/), creá una cuenta e importá el repositorio.
3. En **Environment Variables**, cargá `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (los mismos valores del `.env.local`).
4. Deploy. Vercel te da una URL pública (ej. `https://alquileres-tuinmobiliaria.vercel.app`)
   que los agentes pueden abrir desde el celular y, si quieren, agregar a la pantalla de inicio.

## Estructura del proyecto

```
app/
  login/              Pantalla de login
  listings/           Feed de alquileres (home), filtros por tipo/estado/zona
  listings/new/        Formulario de carga (con fotos desde la cámara)
  listings/[id]/       Detalle de un alquiler
  listings/[id]/edit/  Edición (solo visible para quien lo cargó)
components/            ListingForm, PhotoUploader, ListingCard, etc.
lib/supabase/           Helpers de conexión a Supabase (cliente y servidor)
supabase/migrations/    Esquema SQL: tablas, seguridad (RLS) y storage de fotos
```

## Notas de seguridad

- El acceso está protegido por `middleware.ts`: cualquier ruta que no sea `/login` requiere
  sesión iniciada.
- Los permisos reales (quién puede ver/editar qué) están garantizados por las políticas de Row
  Level Security definidas en `supabase/migrations/0001_init.sql`, no solo por la interfaz —
  aunque alguien manipule la app, la base de datos igual aplica esas reglas.
- Las fotos se guardan en un bucket privado; se sirven con URLs firmadas de corta duración, no
  son públicas ni indexables.
