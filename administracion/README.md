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
2. **Cobrar.** La *Planilla del mes* es la pantalla principal: una fila por
   unidad con inquilino, alquiler, cobrado, honorarios y neto al dueño, con los
   colores que ya usaba la inmobiliaria en su planilla de Excel:

   - **verde** — abonado, no debe nada
   - **amarillo** — pagó pero quedó saldo, o arrastra meses anteriores
   - **naranja** — no pagó este mes

   Al registrar el pago, los punitorios salen solos según los días de atraso y
   se pueden sumar los gastos del inquilino.
3. **Recibo.** Una hoja A4 con el comprobante **impreso dos veces**: la mitad
   de arriba para el inquilino, la de abajo para el archivo de la inmobiliaria,
   con línea de corte al medio. Lleva el logo en marca de agua y, desde la
   segunda impresión, la leyenda DUPLICADO.
4. **Gastos.** Expensas, ABL, servicios y reparaciones, indicando si los paga
   el inquilino o el propietario.
5. **Liquidar.** Cobrado − honorarios − gastos = neto a transferir, agrupado
   por propietario y con su PDF.
6. **Cerrar.** El panel muestra cobrado contra pendiente, honorarios generados
   y qué contratos vencen.

Y cuando algo hay que comunicar, **Avisos**: la app arma el mensaje de
WhatsApp —recordatorio de pago, aviso de aumento, liquidación lista— y abre el
chat con el texto escrito. La persona toca enviar. No se manda nada solo, no
cuesta nada por mensaje y no hace falta trámite con Meta; queda registrado a
quién se le avisó y cuándo.

Y transversal a todo eso, **Unidades**: la cartera completa en una lista, con
buscador por dirección, propietario o inquilino, filtros por estado, tipo y
orden (alfabético, o del alquiler más caro al más barato), y **agrupado por
propietario o por edificio** — con subtotal de renta y vacantes en cada grupo.

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
`lib/punitorios.ts`, `lib/liquidacion.ts` y `lib/unidades.ts` no tocan la base
ni React. Se verifican con `npm test`, sin levantar nada.

**La planilla del mes reemplazó a la vista de cobros en tarjetas.** La
inmobiliaria administra ~130 unidades y las mira como una tabla: en tarjetas no
entran. Los totales de la planilla suman solo los contratos en pesos —
mezclarlos con los que están en dólares daría un número que no significa nada.

**El saldo se mide contra el alquiler, no contra el total del recibo.** Un
recibo puede traer expensas y punitorios, así que comparar su total con el
alquiler pactado marcaría como "pagado de más" a alguien que entregó menos
alquiler del que debía. Por eso la planilla lee el detalle del recibo y suma
solo los conceptos de tipo `alquiler`. Pagar de más no genera deuda: el saldo
nunca es negativo, porque tener plata a favor y deber plata son cosas distintas
y sumarlas daría un total de deuda que miente. Y una diferencia de menos de un
peso es redondeo, no deuda.

**La deuda de meses anteriores se mira un año para atrás.** Más atrás que eso
ya no es un saldo, es otro problema. Se cuenta desde el inicio del contrato:
un contrato nuevo no arrastra nada.

**Los honorarios de la planilla se calculan sobre lo cobrado, no sobre el
alquiler pactado.** Un recibo puede traer expensas y punitorios además del
alquiler, y es sobre ese total que se liquida. Es la misma cuenta que hace la
liquidación al propietario, para que los dos números coincidan.

**Los recordatorios de pago se avisan recién dos días antes del vencimiento.**
Mandar el aviso el día 1 para algo que vence el 10 solo enseña a ignorarlo.
Pasado el vencimiento el texto cambia de tono y dice cuántos días van.

**Los textos de los avisos viven en `lib/avisos.ts` y no dentro de las
pantallas**, para que se puedan leer todos juntos: el tono de lo que la
inmobiliaria le manda a sus inquilinos es una decisión del negocio, no un
detalle de implementación.

**El buscador y los filtros viven en la URL, y filtran en memoria.** Con ~100
unidades, traer todo y filtrar en JavaScript sale más barato y mucho más simple
que pelear con la consulta para buscar por campos de tablas relacionadas. Si
algún día la cartera crece a miles, ese es el momento de moverlo a la base —
no antes. La búsqueda ignora acentos y mayúsculas, y cada palabra puede caer en
un campo distinto: "alsina peña" encuentra la unidad de Alsina cuyo dueño es Peña.

**El edificio se deduce de la dirección, y el piso va en su propio campo.** Dos
unidades cargadas en "Rivadavia 2340" se agrupan solas; si el piso se escribe
adentro de la dirección ("Rivadavia 2340 1ºA") el edificio se parte en dos, y
hay un chequeo en `npm test` que deja constancia de eso. El campo `edificio`
existe para los dos casos en que la dirección no alcanza: cuando el edificio
tiene nombre propio, y cuando las direcciones se cargaron escritas distinto
("Av. Rivadavia 2340") y hay que unirlas a mano.

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
5. `0005_edificios.sql` — el nombre de edificio, para agrupar la cartera.
6. `0006_avisos.sql` — registro de los avisos de WhatsApp enviados.

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

### 5. Ver la app funcionando, sin cargar nada

Antes de tocar la cartera real conviene probar el ciclo completo con datos
inventados. Pegá en el SQL Editor el contenido de `supabase/semilla.sql`:
carga 10 unidades de 3 propietarios —uno con unidades sueltas, otro con un
edificio entero, otro con un local—, sus contratos con índices y porcentajes
distintos, y el mes en curso a medio cobrar, con los tres colores de la
planilla representados.

Al final del archivo está la consulta para borrar todo y dejar la base limpia
cuando termines de probar.

### 6. Cargar los índices

Entrá a **Más → Índices** y tocá *Actualizar ICL*. Baja la serie diaria del
BCRA desde 2020. Sin esto, los aumentos por índice no se pueden calcular.

### 7. Dejar los índices al día solos

`.github/workflows/indices-diarios.yml` llama todas las mañanas al mismo
endpoint que usa el botón, así nadie tiene que acordarse. Como el proceso no
tiene sesión, se identifica con la variable `CRON_SECRET`: inventá una tira
larga al azar, cargala en las variables del hosting y como secret del
repositorio, junto con `URL_APP` (la dirección de la app, sin barra final).

Con `CRON_SECRET` vacía la puerta queda cerrada y solo funciona el botón.

### 8. Cargar la cartera real

`supabase/carga-inicial.sql` reconstruye 108 unidades de la planilla de
agosto: dirección, piso, inquilino, monto y el porcentaje de honorarios, que
sale de dividir la comisión por el alquiler en la misma planilla.

Entra solo lo que la planilla daba entero. Las 20 unidades a las que les
faltaba el inquilino o la comisión quedan afuera y están listadas al pie del
archivo: media ficha cargada es peor que una ficha ausente, porque la ausente
se nota y la incompleta se confunde con un dato real.

Lo único que no sale de la planilla es el propietario, que la base exige: van
todas a un marcador "A asignar" salvo las de los Maldonado y Attar, que sí
figuran. Las fechas de contrato y el índice son provisorios y cada contrato
lo dice en Observaciones.

Se puede volver a ejecutar sin duplicar: cada inserción comprueba antes si la
fila ya existe.

## Cobros fijos, saldos, punitorios y tareas

**Cobros fijos.** Cada contrato declara lo que se cobra todos los meses además
del alquiler —el agua, el CISI, la luz— en `contrato_cargos`. Aparecen tildados
al registrar el cobro; destildar es la excepción. Se apagan en vez de borrarse:
los recibos viejos tienen que seguir explicando por qué cobraron el agua.

**Saldos.** Cada recibo guarda el saldo que queda *después* de él, no el
movimiento. Así, para saber cómo está alguien alcanza con mirar su último
recibo en vez de sumar la historia entera. Positivo es plata a favor del
inquilino, negativo es lo que debe, y el mes siguiente entra como un renglón
con el signo dado vuelta para que el total se explique solo.

**Punitorios.** Corren sobre el alquiler, nunca sobre el agua ni la luz. El
vencimiento se corre al día siguiente hábil si cae domingo o feriado nacional;
el sábado no lo corre. El vencimiento se recalcula en el servidor y no se toma
del formulario: si viniera de la pantalla, un POST armado a mano podría
fabricar un vencimiento tardío y hacer desaparecer los punitorios.

**Feriados.** Los de fecha fija van cargados hasta 2030. Los que se mueven por
decreto y los puentes turísticos no se pueden calcular: se cargan en
Más → Feriados cuando se publican.

**Tareas.** Cuelgan de la unidad, el contrato o el inquilino que las motivó, y
se anotan desde la misma fila de la planilla. El contador del menú sale de una
consulta con `head` en el layout: devuelve el número, no las filas.

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
    cobros/           Planilla del mes: verde, amarillo y naranja
    avisos/           Mensajes de WhatsApp listos para enviar
    unidades/         Toda la cartera, con buscador y filtros
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
  unidades.ts         Búsqueda, orden y agrupado de la cartera
  planilla.ts         Filas, estados (abonado/saldo/impago) y totales del mes
  avisos.ts           Los textos de cada tipo de aviso
  whatsapp.ts         Teléfonos argentinos y enlaces a wa.me
  punitorios.ts       Intereses por mora
  liquidacion.ts      Cobrado − honorarios − gastos
  dinero.ts fechas.ts parseo.ts
  pdf/                Recibo (dos por hoja A4) y liquidación, con marca de agua
  supabase/           Clientes de conexión y perfil
supabase/migrations/  El esquema, con RLS y triggers de inmutabilidad
supabase/semilla.sql  Datos de prueba: 10 unidades y un mes a medio cobrar
scripts/              Verificación de los cálculos (npm test)
```

## Comandos

```bash
npm run dev     # desarrollo
npm run build   # compilar
npm test        # verificar los cálculos y la sintaxis de la SQL
npm run lint
```

`npm test` corre dos cosas: los chequeos de los cálculos puros y un parseo de
todas las migraciones y de la semilla contra el parser de PostgreSQL de verdad.
Lo segundo no prueba que las columnas existan, pero sí que nada de lo que vas a
pegar en la consola de Supabase se rompa por una coma.
