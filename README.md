# Alquileres — app privada para Lamelas & Chaumont Inmobiliaria

App mobile-first para que los agentes/vendedores carguen y consulten alquileres disponibles
desde el celular. Acceso privado con usuario y contraseña por agente.

- Todos los agentes ven todos los alquileres cargados por el equipo.
- Cada agente puede editar/eliminar los alquileres que él mismo cargó.
- Los administradores pueden editar/eliminar los alquileres de cualquier agente, y agregar
  nuevos agentes o administradores desde la propia app (`/admin/agents`).
- No hay registro público: las cuentas las da de alta un administrador.

## Stack

- [Next.js](https://nextjs.org/) (App Router, TypeScript) + [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) — base de datos y autenticación
- [Vercel](https://vercel.com/) — hosting (recomendado, tiene plan gratuito)

## 1. Crear el proyecto en Supabase (gratis)

1. Entrá a [supabase.com](https://supabase.com/) y creá una cuenta gratuita.
2. Creá un **New project** (elegí una región cercana, ej. South America).
3. Guardá la contraseña de la base de datos que te pida (no hace falta para esta app, pero
   por las dudas).
4. Andá a **Project Settings → API Keys** y copiá:
   - `Project URL` → va en `NEXT_PUBLIC_SUPABASE_URL`
   - `Publishable key` (o `anon public key`) → va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `Secret key` (o `service_role key`) → va en `SUPABASE_SECRET_KEY`. **Nunca la compartas ni
     la pongas en el navegador** — solo se usa en el servidor, para el panel de agentes.

## 2. Correr las migraciones (crean las tablas, permisos y roles)

En el panel de Supabase, andá a **SQL Editor → New query** y corré, **en este orden**, el
contenido completo de cada archivo de `supabase/migrations/`:

1. `0001_init.sql` — tablas `profiles` y `listings`, seguridad (RLS): todos ven todo, cada uno
   edita solo lo suyo.
2. `0002_extra_fields.sql` — campos de mascotas, amoblado y expensas.
3. `0003_roles.sql` — agrega el rol (`agent`/`admin`) a `profiles`; los administradores pueden
   editar/eliminar los alquileres de cualquier agente.
4. `0004_property_types_status.sql` — ajusta los tipos de propiedad (monoambiente, dúplex,
   galpón, estacionamiento, etc.) y los estados al uso real de la inmobiliaria.
5. `0005_contract_fields_suggestions.sql` — estados finales (`disponible` / `reservado` /
   `proximamente` / `pausado`), campos de contrato (plazo, ajuste, índice, destino, detalle
   prioritario) y el sistema de sugerencias de corrección entre agentes.
6. `0006_geolocation.sql` — coordenadas de cada propiedad, para el mapa y el botón
   "Cómo llegar".
7. `0007_activity_feed.sql` — panel de novedades: registra automáticamente los cambios de
   precio y de estado, y las altas nuevas, para que los vea todo el equipo.

Si agregás más migraciones a futuro, corrélas siempre en orden numérico.

## 3. Convertirte en administrador

Después de correr `0003_roles.sql`, ejecutá esto en el SQL Editor (reemplazando el email) para
que tu propio usuario sea administrador:

```sql
update public.profiles set role = 'admin'
  where id = (select id from auth.users where email = 'tu@email.com');
```

Desde ese momento vas a ver un botón **"Agentes"** en el header de la app para dar de alta a los
demás agentes/administradores del equipo vos mismo, sin tocar Supabase.

## 4. Configurar el proyecto localmente

```bash
cp .env.local.example .env.local
# completá las 3 variables con los datos del paso 1

npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) — te va a redirigir a `/login`.

## 5. Desplegar a Vercel (gratis)

1. Subí este repo a GitHub (si no lo está ya).
2. Entrá a [vercel.com](https://vercel.com/), creá una cuenta e importá el repositorio.
3. En **Environment Variables**, cargá las 3 variables (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`) — los mismos valores del
   `.env.local`.
4. Deploy. Vercel te da una URL pública (ej. `https://alquileres-tuinmobiliaria.vercel.app`)
   que los agentes pueden abrir desde el celular y, si quieren, agregar a la pantalla de inicio.

## Estructura del proyecto

```
app/
  login/               Pantalla de login
  dashboard/           Pantalla principal: totales por estado y por tipo (clickeables)
  listings/            Listado con búsqueda, filtros y orden por precio
  listings/new/        Formulario de carga
  listings/[id]/       Detalle de un alquiler + sugerencias de corrección
  listings/[id]/edit/  Edición (agente responsable o administrador)
  suggestions/         Bandeja de sugerencias (para revisar / enviadas)
  admin/agents/        Panel para agregar agentes/administradores (solo admins)
  api/admin/agents/    Endpoint que crea usuarios (usa la Secret key, solo servidor)
components/            ListingForm, ListingCard, BottomNav, SuggestionForm, etc.
lib/supabase/          Helpers de conexión a Supabase (cliente, servidor y admin)
supabase/migrations/   Esquema SQL: tablas, seguridad (RLS) y roles
```

## Notas de seguridad

- El acceso está protegido por `proxy.ts` (middleware): cualquier ruta que no sea `/login`
  requiere sesión iniciada.
- Los permisos reales (quién puede ver/editar/eliminar qué) están garantizados por las
  políticas de Row Level Security definidas en `supabase/migrations/`, no solo por la interfaz —
  aunque alguien manipule la app, la base de datos igual aplica esas reglas.
- La `Secret key` de Supabase solo se usa del lado del servidor (`lib/supabase/admin.ts`,
  `app/api/admin/agents/route.ts`) y nunca se envía al navegador. El endpoint que crea agentes
  verifica que quien lo llama sea un administrador antes de hacer nada.
