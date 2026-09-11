import { pesos, resumen, type ResumenPrestamo } from "@/lib/calc";
import { mesDe } from "@/lib/fechas";
import { frecuenciaDe, siguienteVencimiento } from "@/lib/periodos";
import type { PagoConDetalle, PrestamoConCliente } from "@/lib/types";

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

export type MesResumen = {
  /** "2026-09" */
  mes: string;
  /** Capital que saliste a prestar ese mes. */
  prestado: number;
  prestamosNuevos: number;
  /** Todo lo que entró ese mes, capital devuelto incluido. */
  cobrado: number;
  /** De eso, lo que fue interés: la ganancia real del mes. */
  ganancia: number;
  /** Cobros de interés, que son los que renuevan un préstamo un mes más. */
  renovaciones: number;
  montoRenovado: number;
};

/** Los últimos `cantidad` meses, del más viejo al más nuevo. */
export function resumenPorMes(
  prestamos: PrestamoConCliente[],
  pagos: PagoConDetalle[],
  hoy: string,
  cantidad = 6
): MesResumen[] {
  const meses: string[] = [];
  const [anio, mes] = hoy.slice(0, 7).split("-").map(Number);
  for (let i = cantidad - 1; i >= 0; i--) {
    const total = anio * 12 + (mes - 1) - i;
    meses.push(
      `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`
    );
  }

  return meses.map((clave) => {
    const nuevos = prestamos.filter((p) => mesDe(p.fecha_inicio) === clave);
    const delMes = pagos.filter((p) => mesDe(p.fecha) === clave);
    const intereses = delMes.filter((p) => p.tipo === "interes");

    return {
      mes: clave,
      prestado: pesos(nuevos.reduce((acc, p) => acc + p.capital_inicial, 0)),
      prestamosNuevos: nuevos.length,
      cobrado: pesos(delMes.reduce((acc, p) => acc + p.monto, 0)),
      ganancia: pesos(intereses.reduce((acc, p) => acc + p.monto, 0)),
      renovaciones: intereses.length,
      montoRenovado: pesos(intereses.reduce((acc, p) => acc + p.monto, 0)),
    };
  });
}

/**
 * Lo que vence en un mes determinado, si todos pagan al día.
 *
 * Recorre los vencimientos de cada préstamo vigente uno por uno. Los que ya
 * quedaron atrás no cuentan como del mes que viene: son deuda de antes.
 */
export function vencimientosDelMes(resueltos: PrestamoResuelto[], mes: string) {
  let cuotas = 0;
  let monto = 0;

  for (const { prestamo, datos } of resueltos) {
    if (prestamo.estado !== "vigente") continue;

    const esPlan = prestamo.modalidad !== "mensual";
    const valor = esPlan ? (prestamo.cuota_monto ?? 0) : datos.interes;
    const restantes = esPlan
      ? Math.max(0, (prestamo.cuotas_total ?? 0) - datos.cuotasPagadas)
      : 12;

    let fecha = prestamo.fecha_vencimiento;
    for (let i = 0; i < restantes && mesDe(fecha) <= mes; i++) {
      if (mesDe(fecha) === mes) {
        cuotas++;
        monto += valor;
      }
      fecha = siguienteVencimiento(fecha, frecuenciaDe(prestamo));
    }
  }

  return { cuotas, monto: pesos(monto) };
}

export type PuntoHistorico = {
  mes: string;
  /** Todo lo que saliste a prestar hasta ese mes, sumado. */
  prestado: number;
  /** Todo el interés que cobraste hasta ese mes, sumado. */
  ganado: number;
};

/**
 * La serie completa, mes a mes, desde el primer movimiento hasta hoy.
 *
 * Son acumulados: cada punto es el total hasta ahí, no lo del mes suelto. Así
 * se ve la curva de cómo va creciendo lo prestado y cómo lo persigue la
 * ganancia, que es la forma del gráfico que se pidió.
 */
export function serieHistorica(
  prestamos: PrestamoConCliente[],
  pagos: PagoConDetalle[],
  hoy: string
): PuntoHistorico[] {
  const fechas = [
    ...prestamos.map((p) => p.fecha_inicio),
    ...pagos.map((p) => p.fecha),
  ].filter(Boolean);
  if (fechas.length === 0) return [];

  const desde = fechas.reduce((a, b) => (a < b ? a : b)).slice(0, 7);
  const hasta = hoy.slice(0, 7);

  const puntos: PuntoHistorico[] = [];
  let prestado = 0;
  let ganado = 0;

  for (let mes = desde; mes <= hasta; ) {
    prestado += prestamos
      .filter((p) => mesDe(p.fecha_inicio) === mes)
      .reduce((acc, p) => acc + p.capital_inicial, 0);
    ganado += pagos
      .filter((p) => p.tipo === "interes" && mesDe(p.fecha) === mes)
      .reduce((acc, p) => acc + p.monto, 0);

    puntos.push({ mes, prestado: pesos(prestado), ganado: pesos(ganado) });

    const [anio, numero] = mes.split("-").map(Number);
    const total = anio * 12 + (numero - 1) + 1;
    mes = `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
  }

  return puntos;
}
