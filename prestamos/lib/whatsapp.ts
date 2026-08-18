import { plata, porcentaje, textoVencimiento } from "@/lib/format";
import { formatFecha } from "@/lib/fechas";
import type { ResumenPrestamo } from "@/lib/calc";
import type { Prestamo } from "@/lib/types";

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

export function mensajeEstadoDeCuenta(
  prestamo: Prestamo,
  datos: ResumenPrestamo,
  nombreCliente: string,
  hoy: string
): string {
  const lineas = [
    `Hola ${nombreCliente} 👋`,
    `Tu estado de cuenta al ${formatFecha(hoy)}:`,
    "",
  ];

  if (prestamo.modalidad === "mensual") {
    lineas.push(
      `Capital prestado: ${plata(datos.capital)}`,
      `Interés (${porcentaje(prestamo.tasa_mensual)} mensual): ${plata(datos.interes)}`,
      `*Total a devolver: ${plata(datos.aDevolver)}*`,
      `Vencimiento: ${formatFecha(prestamo.fecha_vencimiento)} (${textoVencimiento(datos.diasParaVencer)})`,
      "",
      `Si abonás solo el interés (${plata(datos.interes)}), el préstamo se renueva un mes más.`
    );
  } else {
    lineas.push(
      `Capital prestado: ${plata(prestamo.capital_inicial)}`,
      `Plan: ${datos.cuotasTotal} cuotas de ${plata(datos.cuotaMonto ?? 0)}`,
      `Cuotas abonadas: ${datos.cuotasPagadas} de ${datos.cuotasTotal}`,
      `*Saldo pendiente: ${plata(datos.aDevolver)}*`,
      `Próximo vencimiento: ${formatFecha(prestamo.fecha_vencimiento)} (${textoVencimiento(datos.diasParaVencer)})`
    );
  }

  return lineas.join("\n");
}

export function mensajePrestamoNuevo(
  prestamo: Prestamo,
  datos: ResumenPrestamo,
  nombreCliente: string
): string {
  const lineas = [`Hola ${nombreCliente} 👋`, "Te confirmo el préstamo:", ""];

  if (prestamo.modalidad === "mensual") {
    lineas.push(
      `Importe: ${plata(prestamo.capital_inicial)}`,
      `Interés: ${porcentaje(prestamo.tasa_mensual)} mensual (${plata(datos.interes)})`,
      `Monto a devolver: ${plata(datos.aDevolver)}`,
      `Fecha de vencimiento: ${formatFecha(prestamo.fecha_vencimiento)}`
    );
  } else {
    lineas.push(
      `Importe: ${plata(prestamo.capital_inicial)}`,
      `Monto a devolver: ${plata(prestamo.total_a_devolver ?? 0)}`,
      `Plan: ${datos.cuotasTotal} cuotas de ${plata(datos.cuotaMonto ?? 0)}`,
      `Primer vencimiento: ${formatFecha(prestamo.fecha_vencimiento)}`
    );
  }

  if (prestamo.observacion) {
    lineas.push("", prestamo.observacion);
  }

  return lineas.join("\n");
}
