import { diasEntre, sumarMeses } from "@/lib/fechas";
import { cuotaSemanal } from "@/lib/planes";
import { datosFrecuencia } from "@/lib/periodos";
import type { Frecuencia } from "@/lib/types";
import type { Modalidad, Pago, Prestamo } from "@/lib/types";

/** Dias antes del vencimiento en los que un prestamo empieza a avisar. */
export const DIAS_AVISO = 7;

/** La plata se redondea al peso: no se manejan centavos. */
export function pesos(monto: number): number {
  return Math.round(monto);
}

export type EstadoVisual =
  | "pagado"
  | "cancelado"
  | "vencido"
  | "por_vencer"
  | "al_dia";

export type ResumenPrestamo = {
  /** Capital que sigue en la calle. */
  capital: number;
  /** Interes del periodo actual (mensual) o interes total del plan (cuotas). */
  interes: number;
  /** Lo que tiene que pagar hoy para saldar todo. */
  aDevolver: number;
  /** Cuanto cobraste de este prestamo hasta ahora. */
  cobrado: number;
  /** Cuanto de lo cobrado fue ganancia (interes), no devolucion de capital. */
  ganancia: number;
  cuotaMonto: number | null;
  cuotasPagadas: number;
  cuotasTotal: number | null;
  /** Negativo si ya vencio. */
  diasParaVencer: number;
  vencido: boolean;
  estadoVisual: EstadoVisual;
};

/**
 * Calcula el plan al momento de crear el prestamo.
 *
 * En "mensual" el interes es por mes y se paga o se renueva cada mes, asi que
 * `total` es lo que debe si salda al primer vencimiento.
 * En "cuotas" la tasa es del plan completo y `total` queda fijo desde el dia uno.
 */
export function calcularPlan(datos: {
  modalidad: Modalidad;
  capital: number;
  tasa: number;
  cuotas?: number | null;
  /** Total pactado a mano, cuando se negocio un numero redondo. */
  totalManual?: number | null;
  /** Cuota escrita a mano, para plazos semanales fuera de la lista. */
  cuotaManual?: number | null;
  /** Solo en "personalizado": cada cuánto paga y por cuántos meses. */
  frecuencia?: Frecuencia | null;
  plazoMeses?: number | null;
}): { interes: number; total: number; cuotaMonto: number | null } {
  const capital = pesos(datos.capital);

  if (datos.modalidad === "mensual") {
    const interes = pesos((capital * datos.tasa) / 100);
    return { interes, total: capital + interes, cuotaMonto: null };
  }

  if (datos.modalidad === "personalizado") {
    const meses = Math.max(1, datos.plazoMeses ?? 1);
    const { porMes } = datosFrecuencia(datos.frecuencia ?? "mensual");
    const cantidad = Math.max(1, Math.round(meses * porMes));

    // Interés simple sobre el plazo: la tasa es por mes y no se capitaliza.
    const total = pesos(capital * (1 + (datos.tasa / 100) * meses));

    // La cuota se redondea al cien y el total sale de ella, así el número que
    // se le dice al cliente es exactamente el que va a pagar.
    const cuota =
      datos.cuotaManual && datos.cuotaManual > 0
        ? pesos(datos.cuotaManual)
        : Math.round(total / cantidad / 100) * 100;
    const totalReal = pesos(cuota * cantidad);

    return { interes: totalReal - capital, total: totalReal, cuotaMonto: cuota };
  }

  if (datos.modalidad === "semanal") {
    const semanas = Math.max(1, datos.cuotas ?? 1);
    const deLista = cuotaSemanal(capital, semanas);
    const cuota = pesos(
      datos.cuotaManual && datos.cuotaManual > 0 ? datos.cuotaManual : (deLista?.cuota ?? 0)
    );
    const total = pesos(cuota * semanas);
    return { interes: total - capital, total, cuotaMonto: cuota };
  }

  const cuotas = Math.max(1, datos.cuotas ?? 1);
  const total =
    datos.totalManual != null && datos.totalManual > 0
      ? pesos(datos.totalManual)
      : pesos(capital * (1 + datos.tasa / 100));

  return {
    interes: total - capital,
    total,
    cuotaMonto: pesos(total / cuotas),
  };
}

/**
 * Tasa que quedo implicita cuando el total se pacto a mano.
 *
 * En la planilla, Luciana lleva 200.000 y devuelve 256.110: la tasa nunca se
 * escribio, se pacto el total. Esto la recupera para poder mostrarla.
 */
export function tasaImplicita(capital: number, total: number): number {
  if (capital <= 0) return 0;
  return ((total - capital) / capital) * 100;
}

function sumar(pagos: Pago[], tipos: Pago["tipo"][]): number {
  return pagos
    .filter((pago) => tipos.includes(pago.tipo))
    .reduce((acc, pago) => acc + pago.monto, 0);
}

/** Estado real de un prestamo hoy, ya con sus pagos aplicados. */
export function resumen(
  prestamo: Prestamo,
  pagos: Pago[],
  hoy: string
): ResumenPrestamo {
  const cobrado = pesos(sumar(pagos, ["interes", "capital", "cuota", "total"]));
  const ganancia = pesos(sumar(pagos, ["interes"]));
  const diasParaVencer = diasEntre(hoy, prestamo.fecha_vencimiento);
  const cerrado = prestamo.estado !== "vigente";
  const vencido = !cerrado && diasParaVencer < 0;

  let capital: number;
  let interes: number;
  let aDevolver: number;
  let cuotasPagadas = 0;

  if (prestamo.modalidad === "mensual") {
    capital = pesos(prestamo.capital_actual);
    interes = pesos((capital * prestamo.tasa_mensual) / 100);
    aDevolver = capital + interes;
  } else {
    const total = pesos(prestamo.total_a_devolver ?? 0);
    const pagadoDelPlan = pesos(sumar(pagos, ["cuota", "total"]));
    capital = pesos(prestamo.capital_actual);
    interes = total - pesos(prestamo.capital_inicial);
    aDevolver = Math.max(0, total - pagadoDelPlan);
    cuotasPagadas = pagos.filter((pago) => pago.tipo === "cuota").length;
  }

  if (cerrado) {
    aDevolver = 0;
  }

  const estadoVisual: EstadoVisual =
    prestamo.estado === "pagado"
      ? "pagado"
      : prestamo.estado === "cancelado"
        ? "cancelado"
        : vencido
          ? "vencido"
          : diasParaVencer <= DIAS_AVISO
            ? "por_vencer"
            : "al_dia";

  return {
    capital,
    interes,
    aDevolver,
    cobrado,
    ganancia,
    cuotaMonto: prestamo.cuota_monto,
    cuotasPagadas,
    cuotasTotal: prestamo.cuotas_total,
    diasParaVencer,
    vencido,
    estadoVisual,
  };
}

/**
 * Cobraste el interes del mes: el capital queda intacto y el vencimiento se
 * corre un mes. Es la renovacion clasica de la planilla.
 */
export function renovar(prestamo: Prestamo): { fecha_vencimiento: string } {
  return { fecha_vencimiento: sumarMeses(prestamo.fecha_vencimiento, 1) };
}

/**
 * No pago el interes: ese interes se suma al capital y arranca otro mes.
 * Desde el mes que viene el interes se calcula sobre el capital mas grande.
 */
export function capitalizar(prestamo: Prestamo): {
  capital_actual: number;
  fecha_vencimiento: string;
} {
  const interes = pesos((prestamo.capital_actual * prestamo.tasa_mensual) / 100);
  return {
    capital_actual: pesos(prestamo.capital_actual + interes),
    fecha_vencimiento: sumarMeses(prestamo.fecha_vencimiento, 1),
  };
}
