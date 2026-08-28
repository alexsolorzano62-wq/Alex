import type { ResumenPrestamo } from "@/lib/calc";
import { tasaImplicita } from "@/lib/calc";
import type { Prestamo } from "@/lib/types";
import { frecuenciaDe, textoCuotas } from "@/lib/periodos";

/** "$200.000", como en la planilla: sin centavos. */
export function plata(monto: number): string {
  return `$${Math.round(monto).toLocaleString("es-AR")}`;
}

/** "30%" o "28,06%" — sin decimales cuando es un numero redondo. */
export function porcentaje(tasa: number): string {
  const redondeado = Math.round(tasa * 100) / 100;
  return `${redondeado.toLocaleString("es-AR")}%`;
}

/** "faltan 19 dias", "vence hoy", "vencido hace 3 dias". */
export function textoVencimiento(dias: number): string {
  if (dias === 0) return "vence hoy";
  if (dias === 1) return "vence mañana";
  if (dias > 1) return `faltan ${dias} días`;
  if (dias === -1) return "vencido hace 1 día";
  return `vencido hace ${Math.abs(dias)} días`;
}

/** Cómo se describe el plan en una línea: «30% mensual», «16 semanas de $13.900». */
export function descripcionPlan(
  prestamo: Prestamo,
  datos: ResumenPrestamo
): string {
  if (prestamo.modalidad === "mensual") {
    return `${porcentaje(prestamo.tasa_mensual)} mensual`;
  }

  // Los planes de la lista de precios se nombran por semanas, como el plan.
  if (prestamo.modalidad === "semanal") {
    return `${datos.cuotasTotal} semanas de ${plata(datos.cuotaMonto ?? 0)}`;
  }

  return `${textoCuotas(datos.cuotasTotal ?? 0, frecuenciaDe(prestamo))} de ${plata(datos.cuotaMonto ?? 0)}`;
}

/** La tasa que corresponde mostrar: la pactada, o la que quedó implícita. */
export function tasaMostrada(prestamo: Prestamo): number {
  if (prestamo.modalidad !== "mensual" && prestamo.total_a_devolver) {
    return tasaImplicita(prestamo.capital_inicial, prestamo.total_a_devolver);
  }
  return prestamo.tasa_mensual;
}
