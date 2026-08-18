import { resumen, type ResumenPrestamo } from "@/lib/calc";
import type { PrestamoConCliente } from "@/lib/types";

export type PrestamoResuelto = {
  prestamo: PrestamoConCliente;
  datos: ResumenPrestamo;
};

/** Cada préstamo con sus números ya calculados al día de hoy. */
export function resolver(
  prestamos: PrestamoConCliente[],
  hoy: string
): PrestamoResuelto[] {
  return prestamos.map((prestamo) => ({
    prestamo,
    datos: resumen(prestamo, prestamo.pagos ?? [], hoy),
  }));
}

export type Totales = {
  /** Capital que hoy está en la calle. */
  enLaCalle: number;
  /** Lo que tenés que cobrar si todos saldan al vencimiento. */
  aCobrar: number;
  /** Diferencia entre lo anterior: la ganancia todavía no cobrada. */
  interesPendiente: number;
  /** Intereses que ya te pagaron: ganancia real hasta hoy. */
  gananciaCobrada: number;
  vigentes: number;
  vencidos: number;
  porVencer: number;
};

export function totales(resueltos: PrestamoResuelto[]): Totales {
  const vigentes = resueltos.filter(({ prestamo }) => prestamo.estado === "vigente");

  const enLaCalle = vigentes.reduce((acc, { datos }) => acc + datos.capital, 0);
  const aCobrar = vigentes.reduce((acc, { datos }) => acc + datos.aDevolver, 0);

  return {
    enLaCalle,
    aCobrar,
    interesPendiente: aCobrar - enLaCalle,
    // La ganancia cobrada incluye préstamos ya cerrados: es plata en el bolsillo.
    gananciaCobrada: resueltos.reduce((acc, { datos }) => acc + datos.ganancia, 0),
    vigentes: vigentes.length,
    vencidos: vigentes.filter(({ datos }) => datos.estadoVisual === "vencido").length,
    porVencer: vigentes.filter(({ datos }) => datos.estadoVisual === "por_vencer").length,
  };
}

/** Capital en la calle agrupado por cliente, de mayor a menor. */
export function capitalPorCliente(resueltos: PrestamoResuelto[]) {
  const porCliente = new Map<string, { id: string; nombre: string; monto: number }>();

  for (const { prestamo, datos } of resueltos) {
    if (prestamo.estado !== "vigente") continue;
    const actual = porCliente.get(prestamo.cliente_id);
    if (actual) {
      actual.monto += datos.capital;
    } else {
      porCliente.set(prestamo.cliente_id, {
        id: prestamo.cliente_id,
        nombre: prestamo.cliente?.nombre ?? "Sin nombre",
        monto: datos.capital,
      });
    }
  }

  return [...porCliente.values()].sort((a, b) => b.monto - a.monto);
}

/** Los préstamos vigentes ordenados por cuál vence antes. */
export function proximosVencimientos(resueltos: PrestamoResuelto[]) {
  return resueltos
    .filter(({ prestamo }) => prestamo.estado === "vigente")
    .sort((a, b) => a.datos.diasParaVencer - b.datos.diasParaVencer);
}
