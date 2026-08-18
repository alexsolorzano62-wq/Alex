# Préstamos — seguimiento de clientes

App privada para llevar tus préstamos personales: quién te debe, cuánto, cuándo
vence y cuánto ganaste. Se usa desde el celular (se instala como app) y desde la
computadora, con los mismos datos.

Es **solo tuya**: no hay registro público y los clientes no entran acá. Vos cargás
todo y, si querés, les mandás el estado de cuenta por WhatsApp.

## Qué hace

- **Dashboard** con lo que tenés en la calle, lo que vas a cobrar, el interés
  pendiente y la ganancia ya cobrada.
- **Avisos** de lo vencido y lo que vence en los próximos 7 días.
- **Clientes** con teléfono y notas, y el historial de todo lo que le prestaste.
- **Préstamos** en dos modalidades:
  - *Interés mensual*: paga el interés y renueva mes a mes (lo de siempre).
  - *En cuotas*: plan cerrado en N cuotas fijas. Podés pactar el total a mano y la
    tasa se calcula sola.
- **Cobros** con un toque: "cobré el interés" renueva el mes, "entrega a cuenta"
  baja el capital, "saldó todo" cierra el préstamo.
- **Si no pagó**, el interés del mes se suma al capital y desde ahí en más el
  interés se calcula sobre ese capital más grande.
- **WhatsApp**: manda el estado de cuenta o el aviso de préstamo nuevo, con el
  texto ya escrito. Si el cliente tiene teléfono cargado, abre su chat directo;
  si no, te deja elegir el contacto o copiar el texto.
- **Mensajes a tu manera**: en *Ajustes* (el engranaje del encabezado) escribís vos
  el texto de los dos mensajes, con etiquetas como `{cliente}`, `{total}` o
  `{vence}` que se reemplazan solas. Hay vista previa en vivo.
- **La planilla de siempre**: en pantalla grande los préstamos se ven como tabla,
  con la fila de totales abajo.

## Stack

- [Next.js](https://nextjs.org/) (App Router, TypeScript) + [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) — base de datos y login
- [Vercel](https://vercel.com/) — hosting (tiene plan gratuito)

## 1. Crear el proyecto en Supabase (gratis)

1. Entrá a [supabase.com](https://supabase.com/) y creá una cuenta.
2. Creá un **New project** (elegí una región cercana, ej. South America).
3. Andá a **Project Settings → API Keys** y copiá:
   - `Project URL` → va en `NEXT_PUBLIC_SUPABASE_URL`
   - `Publishable key` (o `anon public key`) → va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Esta app **no** necesita la secret key.

## 2. Crear las tablas

En Supabase, andá a **SQL Editor → New query** y corré, **en este orden**, el
contenido completo de cada archivo de `supabase/migrations/`:

1. `0001_init.sql` — crea `clientes`, `prestamos` y `pagos`, con seguridad a nivel
   de fila: cada fila queda atada a tu usuario y nadie más puede leerla.
2. `0002_plantillas.sql` — guarda los textos de WhatsApp que editás en *Ajustes*.

Si agregás más migraciones a futuro, corrélas siempre en orden numérico.

## 3. Crear tu usuario

No hay registro público: te creás la cuenta vos mismo, una sola vez.

En Supabase: **Authentication → Users → Add user → Create new user**. Poné tu
email y una contraseña, y marcá *Auto Confirm User*.

Con ese email y esa contraseña entrás a la app.

## 4. Correrla en tu compu (opcional)

```bash
cd prestamos
npm install
cp .env.local.example .env.local   # y completá las dos variables
npm run dev
```

Abrí http://localhost:3000.

## 5. Publicarla (para usarla desde el celular)

1. Subí el repo a GitHub.
2. En [vercel.com](https://vercel.com/) → **Add New → Project** → importá el repo.
3. **Importante**: en *Root Directory* elegí la carpeta `prestamos`.
4. En **Environment Variables** cargá `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. **Deploy**. Te queda una dirección tipo `https://algo.vercel.app`.

## 6. Instalarla en el celular

La app es una PWA: se instala desde el navegador, sin pasar por ninguna tienda.

**Android (Chrome)**: entrá a la dirección, tocá los tres puntitos → *Instalar
aplicación* (o *Agregar a pantalla principal*).

**iPhone (Safari)**: entrá a la dirección, tocá el botón de compartir → *Agregar a
inicio*. Tiene que ser **Safari**; desde Chrome en iPhone no se puede instalar.

Queda con su ícono propio y abre en pantalla completa, sin la barra del navegador.
Cuando publicás un cambio en Vercel, la app se actualiza sola.

## Cómo se calculan los números

- **Interés mensual**: `interés = capital × tasa / 100`, y `a devolver = capital +
  interés`. Es lo de la planilla: 200.000 al 30% son 60.000 de interés y 260.000 a
  devolver.
- **Cobrás solo el interés**: el capital queda igual y el vencimiento se corre un
  mes. El préstamo sigue vivo.
- **No paga**: con el botón *No pagó este mes*, esos 60.000 se suman al capital.
  Pasa a deber 260.000 y el mes siguiente el 30% se calcula sobre 260.000
  (o sea 78.000). Interés compuesto.
- **En cuotas**: el total queda fijo desde el día uno y cada cuota lo va bajando.
- **Atrasos**: se marcan en rojo con los días de atraso, pero el monto no cambia
  solo. Si querés cobrarle algo extra, lo cargás vos.

Todo eso está en `lib/calc.ts` y hay tests que lo verifican contra la planilla:

```bash
npm test
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta la app en tu compu |
| `npm run build` | Compila para producción |
| `npm run lint` | Revisa el código |
| `npm test` | Verifica los cálculos de préstamos, importes y teléfonos |
| `python3 scripts/generar-iconos.py` | Regenera los íconos de la app |

## Estructura

```
prestamos/
├─ app/              Pantallas y acciones del servidor
├─ components/       Piezas de interfaz
├─ lib/
│  ├─ calc.ts        Toda la matemática de los préstamos
│  ├─ fechas.ts      Fechas sin líos de zona horaria
│  ├─ whatsapp.ts    Armado de los mensajes y del link
│  ├─ plantillas.ts  Plantillas editables y sus etiquetas
│  └─ datos.ts       Consultas a Supabase
├─ scripts/          Tests de cálculo y generador de íconos
└─ supabase/         Migraciones SQL
```

## Ideas para más adelante

- Recordatorio automático el día que vence un préstamo.
- Registrar el interés punitorio por día de atraso.
- Exportar a Excel o PDF para tener respaldo.
- Historial de cuánto ganaste mes a mes.
