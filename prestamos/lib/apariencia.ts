import type { Tema } from "@/lib/types";

/**
 * Las tipografías que se pueden elegir.
 *
 * `variable` es el nombre de la variable CSS que define `app/layout.tsx` con
 * `next/font`. Los archivos de cada fuente se descargan solo cuando se usa la
 * que corresponde, así que tener diez opciones no le cuesta nada a quien elige
 * la de sistema.
 */
export const FUENTES: { clave: string; nombre: string; variable: string | null }[] = [
  { clave: "sistema", nombre: "La del teléfono", variable: null },
  { clave: "inter", nombre: "Inter", variable: "--fuente-inter" },
  { clave: "roboto", nombre: "Roboto", variable: "--fuente-roboto" },
  { clave: "opensans", nombre: "Open Sans", variable: "--fuente-opensans" },
  { clave: "lato", nombre: "Lato", variable: "--fuente-lato" },
  { clave: "montserrat", nombre: "Montserrat", variable: "--fuente-montserrat" },
  { clave: "poppins", nombre: "Poppins", variable: "--fuente-poppins" },
  { clave: "nunito", nombre: "Nunito", variable: "--fuente-nunito" },
  { clave: "raleway", nombre: "Raleway", variable: "--fuente-raleway" },
  { clave: "serif", nombre: "Source Serif", variable: "--fuente-serif" },
  { clave: "mono", nombre: "JetBrains Mono", variable: "--fuente-mono" },
];

export const TEMAS: { clave: Tema; nombre: string; detalle: string }[] = [
  { clave: "claro", nombre: "Claro", detalle: "Fondo blanco, como hasta ahora" },
  { clave: "oscuro", nombre: "Oscuro", detalle: "Fondo negro, cansa menos de noche" },
];

/** La familia que corresponde poner en `font-family`. */
export function familiaDe(clave: string): string {
  const fuente = FUENTES.find((f) => f.clave === clave);
  const sistema =
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  return fuente?.variable ? `var(${fuente.variable}), ${sistema}` : sistema;
}
