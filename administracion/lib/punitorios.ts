import { redondear } from "@/lib/dinero";
import { diasEntre } from "@/lib/fechas";
import type { TipoPunitorio } from "@/lib/types";

// Días que el inquilino pagó fuera de término, descontando los de gracia
// pactados. Pagar el mismo día del vencimiento no genera punitorios.
export function diasDeAtraso(
  vencimientoISO: string,
  fechaPagoISO: string,
  diasGracia = 0
): number {
  const atraso = diasEntre(vencimientoISO, fechaPagoISO) - diasGracia;
  return Math.max(0, atraso);
}

export function calcularPunitorios(params: {
  montoAlquiler: number;
  vencimiento: string;
  fechaPago: string;
  tipo: TipoPunitorio;
  valor: number;
  diasGracia?: number;
}): { dias: number; monto: number } {
  const { montoAlquiler, vencimiento, fechaPago, tipo, valor, diasGracia = 0 } = params;

  const dias = diasDeAtraso(vencimiento, fechaPago, diasGracia);
  if (tipo === "ninguno" || dias === 0 || valor <= 0) {
    return { dias, monto: 0 };
  }

  // Interés simple sobre el alquiler del mes, que es como se pacta acá.
  const monto =
    tipo === "porcentaje_diario"
      ? montoAlquiler * (valor / 100) * dias
      : valor * dias;

  return { dias, monto: redondear(monto) };
}
