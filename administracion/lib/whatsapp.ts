// Los avisos salen por WhatsApp desde el teléfono de la inmobiliaria: la app
// arma el mensaje y abre el chat, la persona toca enviar. Sin API, sin costo
// por mensaje y sin trámite con Meta.

/**
 * Deja el teléfono como lo quiere wa.me: 549 + característica + número, sin el
 * 0 y sin el 15.
 *
 * Acepta lo que haya quedado guardado ("381 415-8877", "+54 9 381 415 8877",
 * "0381 15 415 8877") y devuelve null si no parece un número usable.
 */
export function normalizarTelefono(telefono: string | null): string | null {
  if (!telefono) return null;

  let digitos = telefono.replace(/\D/g, "");
  if (digitos.startsWith("00")) digitos = digitos.slice(2);
  if (digitos.startsWith("54")) digitos = digitos.slice(2);
  if (digitos.startsWith("0")) digitos = digitos.slice(1);
  if (digitos.startsWith("9")) digitos = digitos.slice(1);

  // El "15" viejo va después de la característica, que puede tener 2, 3 o 4
  // dígitos. Se saca solo si al quitarlo queda un número de 10 dígitos.
  for (const largoArea of [2, 3, 4]) {
    if (digitos.slice(largoArea, largoArea + 2) === "15" && digitos.length - 2 === 10) {
      digitos = digitos.slice(0, largoArea) + digitos.slice(largoArea + 2);
      break;
    }
  }

  if (digitos.length < 8) return null;
  return `549${digitos}`;
}

/** Link que abre el chat de WhatsApp con el mensaje ya escrito. */
export function linkWhatsApp(telefono: string | null, mensaje: string): string {
  const numero = normalizarTelefono(telefono);
  const texto = encodeURIComponent(mensaje);

  // Sin número, igual abre WhatsApp con el texto listo: la persona elige el
  // contacto. Es mejor que no ofrecer nada porque falta un dato.
  return numero
    ? `https://wa.me/${numero}?text=${texto}`
    : `https://wa.me/?text=${texto}`;
}
