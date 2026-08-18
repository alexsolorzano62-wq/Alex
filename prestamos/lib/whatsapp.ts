import {
  aplicarPlantilla,
  plantillaDe,
  variablesDePrestamo,
  type PlantillasGuardadas,
  type TipoMensaje,
} from "@/lib/plantillas";
import type { ResumenPrestamo } from "@/lib/calc";
import type { Pago, Prestamo } from "@/lib/types";

/**
 * Deja el telefono como lo quiere wa.me: 549 + area + numero, sin el 0 ni el 15.
 *
 * Acepta lo que se haya guardado ("11 5555-4444", "+54 9 11 5555 4444",
 * "011 15 5555 4444") y devuelve null si no parece un numero usable.
 */
export function normalizarTelefono(telefono: string | null): string | null {
  if (!telefono) return null;

  let digitos = telefono.replace(/\D/g, "");
  if (digitos.startsWith("00")) digitos = digitos.slice(2);
  if (digitos.startsWith("54")) digitos = digitos.slice(2);
  if (digitos.startsWith("0")) digitos = digitos.slice(1);
  if (digitos.startsWith("9")) digitos = digitos.slice(1);

  // El "15" viejo va despues de la caracteristica, que puede tener 2, 3 o 4
  // digitos. Se saca solo si al quitarlo queda un numero de 10 digitos.
  for (const largoArea of [2, 3, 4]) {
    if (
      digitos.slice(largoArea, largoArea + 2) === "15" &&
      digitos.length - 2 === 10
    ) {
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
  return numero
    ? `https://wa.me/${numero}?text=${texto}`
    : `https://wa.me/?text=${texto}`;
}

/**
 * Arma un mensaje: toma la plantilla que corresponde al tipo y a la modalidad
 * del préstamo, y le completa los datos.
 */
export function mensajeDe(
  tipo: TipoMensaje,
  prestamo: Prestamo,
  datos: ResumenPrestamo,
  nombreCliente: string,
  hoy: string,
  opciones?: { pago?: Pago | null; plantillas?: PlantillasGuardadas | null }
): string {
  return aplicarPlantilla(
    plantillaDe(opciones?.plantillas, tipo, prestamo.modalidad),
    variablesDePrestamo(prestamo, datos, nombreCliente, hoy, opciones?.pago)
  );
}
