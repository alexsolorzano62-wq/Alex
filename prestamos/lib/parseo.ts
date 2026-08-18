/**
 * Convierte lo que se escribe en un campo de plata a un número.
 *
 * Acepta "200.000", "$200.000", "200000" y "85.370,50". Los puntos se toman
 * siempre como separador de miles y la coma como decimal, que es como se
 * escribe acá.
 */
export function parsearPesos(texto: string | null | undefined): number | null {
  if (texto == null) return null;
  const limpio = texto.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  if (limpio === "" || limpio === "-") return null;
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : null;
}

/** Igual que `parsearPesos` pero para tasas: acá el punto sí es decimal. */
export function parsearTasa(texto: string | null | undefined): number | null {
  if (texto == null) return null;
  const limpio = texto.replace(/[^\d,.-]/g, "").replace(",", ".");
  if (limpio === "" || limpio === "-") return null;
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : null;
}
