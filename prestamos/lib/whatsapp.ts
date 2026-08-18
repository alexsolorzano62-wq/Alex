import {
  aplicarPlantilla,
  variablesDePrestamo,
  PLANTILLA_ESTADO_CUENTA,
  PLANTILLA_PRESTAMO_NUEVO,
  PLANTILLA_COMPROBANTE,
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
 * Los mensajes salen de las plantillas que se editan en /ajustes. Si todavía no
 * hay ninguna guardada, se usa el texto que viene por defecto.
 */
function armar(
  plantillaGuardada: string | null | undefined,
  plantillaPorDefecto: string,
  prestamo: Prestamo,
  datos: ResumenPrestamo,
  nombreCliente: string,
  hoy: string,
  pago?: Pago | null
): string {
  const plantilla = plantillaGuardada?.trim() || plantillaPorDefecto;
  return aplicarPlantilla(
    plantilla,
    variablesDePrestamo(prestamo, datos, nombreCliente, hoy, pago)
  );
}

export function mensajeEstadoDeCuenta(
  prestamo: Prestamo,
  datos: ResumenPrestamo,
  nombreCliente: string,
  hoy: string,
  plantilla?: string | null
): string {
  return armar(plantilla, PLANTILLA_ESTADO_CUENTA, prestamo, datos, nombreCliente, hoy);
}

export function mensajePrestamoNuevo(
  prestamo: Prestamo,
  datos: ResumenPrestamo,
  nombreCliente: string,
  hoy: string,
  plantilla?: string | null
): string {
  return armar(plantilla, PLANTILLA_PRESTAMO_NUEVO, prestamo, datos, nombreCliente, hoy);
}

/** El comprobante de un pago, con el saldo y lo que le queda por delante. */
export function mensajeComprobante(
  prestamo: Prestamo,
  datos: ResumenPrestamo,
  nombreCliente: string,
  hoy: string,
  pago: Pago,
  plantilla?: string | null
): string {
  return armar(plantilla, PLANTILLA_COMPROBANTE, prestamo, datos, nombreCliente, hoy, pago);
}
