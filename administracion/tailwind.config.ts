import type { Config } from "tailwindcss";

// Los colores no van escritos acá sino en variables de CSS, y `globals.css`
// les da un valor distinto en tema claro y en oscuro. Así las pantallas usan
// las mismas clases de siempre —`bg-white`, `text-stone-900`— y el tema se
// cambia en un solo lugar, en vez de repetir una variante `dark:` en cada
// etiqueta de las treinta pantallas.
const TONOS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const familia = (nombre: string, tonos: number[] = TONOS) =>
  Object.fromEntries(
    tonos.map((t) => [t, `rgb(var(--c-${nombre}-${t}) / <alpha-value>)`])
  );

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "rgb(var(--c-blanco) / <alpha-value>)",
        stone: familia("stone"),
        amber: familia("amber"),
        red: familia("red"),
        orange: familia("orange"),
        marca: familia("marca", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
      },
      fontFamily: {
        // Arial en todo, títulos incluidos. La serif del logotipo quedaba
        // linda en grande y costaba de leer en una planilla de 130 filas.
        sans: ["Arial", "Helvetica Neue", "Helvetica", "Liberation Sans", "sans-serif"],
        titulo: ["Arial", "Helvetica Neue", "Helvetica", "Liberation Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
