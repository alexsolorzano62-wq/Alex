// La gente escribe la plata como la lee: "500.000,50", "$ 480000", "1.200".
// Todo eso tiene que entrar sin pelear con el formulario.
export function parsearMonto(texto: string | null | undefined): number | null {
  if (texto == null) return null;
  const limpio = String(texto).replace(/[^\d.,-]/g, "").trim();
  if (!limpio) return null;

  const tienePunto = limpio.includes(".");
  const tieneComa = limpio.includes(",");

  let normalizado = limpio;
  if (tienePunto && tieneComa) {
    // "1.234.567,89" → el punto es separador de miles.
    normalizado = limpio.replace(/\./g, "").replace(",", ".");
  } else if (tieneComa) {
    // "1234,56" → la coma es el decimal.
    normalizado = limpio.replace(",", ".");
  } else if (tienePunto) {
    // Ambiguo: "1.234" son mil doscientos treinta y cuatro, pero "1.5" es uno
    // y medio. Si lo que sigue al último punto son exactamente 3 dígitos, es
    // separador de miles.
    const partes = limpio.split(".");
    const ultima = partes[partes.length - 1];
    normalizado = ultima.length === 3 ? partes.join("") : limpio;
  }

  const valor = Number(normalizado);
  return Number.isFinite(valor) ? valor : null;
}

// Un porcentaje: "8", "8,5", "8.5%".
export function parsearPorcentaje(texto: string | null | undefined): number | null {
  if (texto == null) return null;
  const limpio = String(texto).replace(/[^\d.,-]/g, "").replace(",", ".").trim();
  if (!limpio) return null;
  const valor = Number(limpio);
  return Number.isFinite(valor) ? valor : null;
}

// Lo que viene de un <input> vacío es "", y en la base tiene que ser null.
export function textoONulo(valor: FormDataEntryValue | null): string | null {
  const texto = typeof valor === "string" ? valor.trim() : "";
  return texto === "" ? null : texto;
}

export function enteroONulo(valor: FormDataEntryValue | null): number | null {
  const texto = textoONulo(valor);
  if (texto == null) return null;
  const numero = Number.parseInt(texto, 10);
  return Number.isFinite(numero) ? numero : null;
}
