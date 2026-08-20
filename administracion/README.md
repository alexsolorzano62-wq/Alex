# Administración de alquileres — Lamelas & Chaumont

App para administrar los alquileres que la inmobiliaria maneja para terceros:
contratos, aumentos por índice, cobranzas al inquilino, gastos del inmueble y
la liquidación mensual a cada propietario.

Es una app **separada** del catálogo de alquileres disponibles que está en la
raíz de este repositorio. No comparten base de datos ni usuarios.

## Qué resuelve

El ciclo del mes, que es de lo que vive la administración:

1. **¿Toca aumento?** Los contratos que cumplieron período aparecen en
   *Aumentos*, con el monto nuevo ya calculado contra la serie del índice.
2. **Cobrar.** Se registra el pago, los punitorios salen solos según los días
   de atraso, y se pueden sumar los gastos que le tocan al inquilino.
3. **Recibo.** PDF con el logo en marca de agua. Desde la segunda impresión
   sale marcado como DUPLICADO.
4. **Gastos.** Expensas, ABL, servicios y reparaciones, indicando si los paga
   el inquilino o el propietario.
5. **Liquidar.** Cobrado − honorarios − gastos = neto a transferir, agrupado
   por propietario y con su PDF.
6. **Cerrar.** El panel muestra cobrado contra pendiente, honorarios generados
   y qué contratos vencen.

## Decisiones que conviene conocer antes de tocar el código

**Los honorarios viven en el contrato, no en una configuración global.** Van
del 7 al 10% según el propietario. Además, cada renglón de liquidación guarda
el porcentaje con el que se emitió: si mañana se renegocia de 8 a 9, las
liquidaciones viejas siguen diciendo 8.

**Nada se borra.** Propietarios, inquilinos, propiedades, contratos y gastos
usan `deleted_at`. Un error humano se deshace sin restaurar un respaldo.

**Los recibos y las liquidaciones emitidas son inmutables**, y no por
convención: lo impide un trigger en la base. Si hay un error se anula y se
emite de nuevo. Es lo que corresponde para documentos que respaldan plata de
terceros.

**El motor de ajustes no tiene nada fijo.** Desde el DNU 70/2023 el índice, la
frecuencia y la moneda se pactan libremente, así que salen del contrato. Los
valores de ICL e IPC se guardan en la base (`indices_valores`) en lugar de
consultarse al vuelo: el cierre del mes no puede depender de que la web del
BCRA esté arriba, y guardar los valores usados deja cada ajuste auditable.

**Los cálculos son funciones puras y están testeadas.** `lib/ajustes.ts`,
`lib/punitorios.ts` y `lib/liquidacion.ts` no tocan la base ni React. Se
verifican con `npm test`, sin levantar nada.

## Stack

- [Next.js](https://nextjs.org/) 16 (App Router, TypeScript) + Tailwind CSS
- [Supabase](https://supabase.com/) — base de datos y autenticación
- [pdf-lib](https://pdf-lib.js.org/) — recibos y liquidaciones
- [API de Claude](https://console.anthropic.com/) — lectura de contratos en PDF
  (opcional, hoy apagada)

## Puesta en marcha

### 1. Proyecto en Supabase

Creá un proyecto nuevo (no reutilices el del catálogo) y copiá de
**Project Settings → API Keys**:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `Publishable key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `Secret key` → `SUPABASE_SECRET_KEY` (solo servidor, nunca al navegador)

> El plan gratuito de Supabase permite **dos proyectos activos**. Si el
> catálogo y préstamos ya ocupan los dos, este necesita otra cuenta o el plan
> Pro.

### 2. Migraciones

En **SQL Editor → New query**, correr en orden el contenido de
`supabase/migrations/`:

1. `0001_init.sql` — perfiles, propietarios, inquilinos, propiedades,
   contratos y las políticas de seguridad.
2. `0002_indices_ajustes.sql` — series de índices e historial de aumentos.
3. `0003_cobros_gastos.sql` — recibos (con su inmutabilidad) y gastos.
4. `0004_liquidaciones.sql` — liquidaciones al propietario y su detalle.

### 3. Crear el primer usuario

En **Authentication → Users → Add user**, creá tu cuenta con email y
contraseña. Después, en el SQL Editor:

```sql
insert into public.perfiles (id, nombre, email, rol)
select id, 'Tu Nombre', email, 'admin'
  from auth.users where email = 'tu@email.com';
```

Los demás usuarios del equipo se crean igual: primero en Authentication,
después su fila en `perfiles`.

### 4. Correr

```bash
cp .env.local.example .env.local   # completá las variables
npm install
npm run dev
```

### 5. Cargar los índices

Entrá a **Más → Índices** y tocá *Actualizar ICL*. Baja la serie diaria del
BCRA desde 2020. Sin esto, los aumentos por índice no se pueden calcular.

## Hosting

El plan gratuito de Vercel **prohíbe el uso comercial**, y administrar
alquileres de terceros cobrando honorarios lo es. Las opciones sanas son
Cloudflare Workers (desde US$5/mes, permite uso comercial) o Vercel Pro
(US$20/mes).

## Respaldos

`.github/workflows/respaldo-administracion.yml`, en la raíz del repositorio,
hace un volcado completo de la base todas las noches y lo guarda como commit
en la rama `respaldos`. Necesita un secret `SUPABASE_DB_URL` con la cadena de
conexión.

**Falta cubrir los archivos subidos** (contratos escaneados, comprobantes):
viven en Supabase Storage y hay que sincronizarlos aparte.

Un respaldo que nunca se restauró no es un respaldo: antes de confiar en esto,
restaurá una copia sobre un proyecto de prueba.

## Lectura de contratos con IA (pausada)

**Está apagada por defecto: la carga de contratos es manual.** El recuadro de
"Cargar desde el PDF" solo aparece si existe la variable `ANTHROPIC_API_KEY`.
Sin esa variable, la pantalla de nuevo contrato muestra únicamente el
formulario, sin ofrecer algo que no funcionaría.

Para encenderla más adelante alcanza con cargar la clave. El código quedó
escrito y compilando: `app/api/contratos/importar/route.ts`.

Se usa `claude-opus-5` por defecto. Para extraer datos de un contrato alcanza
con un modelo más chico y sale bastante menos: poné `ANTHROPIC_MODEL` en
`claude-haiku-4-5` o `claude-sonnet-5` en las variables de entorno.

| Modelo | Aprox. por contrato |
|---|---|
| `claude-haiku-4-5` | US$0,03 |
| `claude-sonnet-5` | US$0,08 |
| `claude-opus-5` | US$0,14 |

## Estructura

```
app/
  (privado)/          Todo lo que requiere sesión, con el marco de la app
    panel/            Resumen del mes
    contratos/        Alta, detalle y edición
    ajustes/          Aumentos pendientes de aplicar
    cobros/           Cobranzas y recibos
    gastos/           Gastos del inmueble
    liquidaciones/    Rendición al propietario
    propiedades/  propietarios/  inquilinos/  indices/  mas/
  api/
    contratos/importar/   Lee un contrato en PDF con IA
    recibos/[id]/         Genera el recibo en PDF
    liquidaciones/[id]/   Genera la liquidación en PDF
    indices/actualizar/   Baja las series del BCRA y del INDEC
  acciones.ts         Todas las escrituras a la base (Server Actions)
lib/
  ajustes.ts          Motor de aumentos
  punitorios.ts       Intereses por mora
  liquidacion.ts      Cobrado − honorarios − gastos
  dinero.ts fechas.ts parseo.ts
  pdf/                Recibo y liquidación, con la marca de agua
  supabase/           Clientes de conexión y perfil
supabase/migrations/  El esquema, con RLS y triggers de inmutabilidad
scripts/              Verificación de los cálculos (npm test)
```

## Comandos

```bash
npm run dev     # desarrollo
npm run build   # compilar
npm test        # verificar los cálculos
npm run lint
```
