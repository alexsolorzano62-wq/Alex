import { sumarDias, sumarMeses } from "@/lib/fechas";
import type { Frecuencia, Modalidad } from "@/lib/types";

export const FRECUENCIAS: {
  valor: Frecuencia;
  titulo: string;
  adjetivo: string;
  singular: string;
  /** Cuántas cuotas entran en un mes. */
  porMes: number;
}[] = [
  { valor: "semanal", titulo: "Semanal", adjetivo: "semanales", singular: "semanal", porMes: 4 },
  { valor: "quincenal", titulo: "Quincenal", adjetivo: "quincenales", singular: "quincenal", porMes: 2 },
  { valor: "mensual", titulo: "Mensual", adjetivo: "mensuales", singular: "mensual", porMes: 1 },
];

export function datosFrecuencia(frecuencia: Frecuencia) {
  return FRECUENCIAS.find((f) => f.valor === frecuencia) ?? FRECUENCIAS[2];
}

/**
 * La frecuencia de un préstamo.
 *
 * Los planes viejos no la tienen guardada, así que se deduce de la modalidad:
 * los semanales pagan por semana y los de cuotas, por mes.
 */
export function frecuenciaDe(prestamo: {
  modalidad: Modalidad;
  frecuencia?: Frecuencia | null;
}): Frecuencia {
  if (prestamo.frecuencia) return prestamo.frecuencia;
  return prestamo.modalidad === "semanal" ? "semanal" : "mensual";
}

/** Corre una fecha al vencimiento siguiente. */
export function siguienteVencimiento(iso: string, frecuencia: Frecuencia): string {
  if (frecuencia === "semanal") return sumarDias(iso, 7);
  if (frecuencia === "quincenal") return sumarDias(iso, 15);
  return sumarMeses(iso, 1);
}

/** «4 cuotas semanales», «1 cuota mensual». */
export function textoCuotas(cantidad: number, frecuencia: Frecuencia): string {
  const { adjetivo, singular } = datosFrecuencia(frecuencia);
  return cantidad === 1 ? `1 cuota ${singular}` : `${cantidad} cuotas ${adjetivo}`;
}
