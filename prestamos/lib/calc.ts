import { diasEntre, sumarMeses } from "@/lib/fechas";
import { cuotaSemanal } from "@/lib/planes";
import {
  datosFrecuencia,
  frecuenciaDe,
  siguienteVencimiento,
  vencimientoAnterior,
} from "@/lib/periodos";
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
  /** Cuanto de lo cobrado ya volvio a cubrir lo que pusiste. */
  capitalRecuperado: number;
  /** Cuanto de lo cobrado es ganancia: lo que entro por encima del capital. */
  ganancia: number;
  cuotaMonto: number | null;
  cuotasPagadas: number;
  cuotasTotal: number | null;
  /** Negativo si ya vencio. */
  diasParaVencer: number;
  /** Cuantas cuotas deberia haber pagado y no pago. Solo en los planes. */
  cuotasAtrasadas: number;
  /** Cuanto del plan lleva pagado, de 0 a 100. Null si no tiene cuotas. */
  avance: number | null;
  /** Ya cobraste al menos lo que prestaste: de aca en mas todo es ganancia. */
  /** Ya cobraste al menos lo que prestaste. */
  recuperado: boolean;
  /** Cuanto falta cobrar para recuperar lo prestado. Cero si ya se recupero. */
  faltaRecuperar: number;
  /** Lo que suman esas cuotas: el numero con el que se le reclama. */
  montoAtrasado: number;
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

  // Una sola regla para toda la app: cada peso que entra tapa primero la plata
  // que pusiste, y recien lo que sobra es ganancia. Vale igual para un plan de
  // cuotas que para el interes mensual, asi los numeros de las dos modalidades
  // se pueden sumar sin mezclar criterios.
  const capitalRecuperado = Math.min(cobrado, pesos(prestamo.capital_inicial));
  const ganancia = pesos(cobrado - capitalRecuperado);
  const faltaRecuperar = pesos(pesos(prestamo.capital_inicial) - capitalRecuperado);
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
    // En un plan el capital no queda congelado: baja a medida que cobras, con
    // la misma regla de arriba. Asi "en la calle" refleja lo que de verdad
    // tenes afuera y no el monto original hasta el ultimo dia.
    capital = faltaRecuperar;
    interes = total - pesos(prestamo.capital_inicial);
    aDevolver = Math.max(0, total - cobrado);
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

  // Cuantas cuotas se le pasaron: se cuentan recorriendo las fechas reales del
  // plan, una por una, y no dividiendo los dias por un mes de 30. Con meses de
  // 28 y de 31 esa cuenta redonda se desfasa, y este numero tiene que dar igual
  // que el cronograma que se proyecta en el resumen.
  let cuotasAtrasadas = 0;
  let montoAtrasado = 0;
  if (prestamo.modalidad !== "mensual" && vencido) {
    const frecuencia = frecuenciaDe(prestamo);
    const restantes = Math.max(0, (prestamo.cuotas_total ?? 0) - cuotasPagadas);
    let fecha = prestamo.fecha_vencimiento;
    while (cuotasAtrasadas < restantes && fecha <= hoy) {
      cuotasAtrasadas++;
      fecha = siguienteVencimiento(fecha, frecuencia);
    }
    // Si se le pasaron todas las que le quedaban, debe exactamente el saldo:
    // la ultima cuota carga el resto de la division y no vale lo mismo que el
    // resto. Si todavia le quedan por vencer, son cuotas enteras.
    montoAtrasado =
      cuotasAtrasadas === restantes
        ? aDevolver
        : pesos(cuotasAtrasadas * (prestamo.cuota_monto ?? 0));
  }

  return {
    capital,
    interes,
    aDevolver,
    avance:
      prestamo.cuotas_total && prestamo.cuotas_total > 0
        ? Math.min(100, Math.round((cuotasPagadas / prestamo.cuotas_total) * 100))
        : null,
    capitalRecuperado,
    recuperado: faltaRecuperar === 0,
    faltaRecuperar,
    cuotasAtrasadas,
    montoAtrasado,
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

/**
 * Reparte cada cobro de un préstamo entre recupero de capital y ganancia.
 *
 * Se recorren en orden cronológico aplicando la misma regla que `resumen`:
 * primero tapan la plata que pusiste, después son ganancia. Sirve para saber
 * cuánto ganaste **en un mes**, que no se puede sacar del total.
 */
export function repartirCobros(
  prestamo: Pick<Prestamo, "capital_inicial">,
  pagos: Pago[]
): Map<string, { capital: number; ganancia: number }> {
  const orden = [...pagos].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || a.created_at.localeCompare(b.created_at)
  );

  let falta = pesos(prestamo.capital_inicial);
  const reparto = new Map<string, { capital: number; ganancia: number }>();

  for (const pago of orden) {
    const monto = pesos(pago.monto);
    const capital = Math.min(falta, monto);
    falta = pesos(falta - capital);
    reparto.set(pago.id, { capital, ganancia: pesos(monto - capital) });
  }

  return reparto;
}

/**
 * Lo que un cobro le cambia al préstamo.
 *
 * `pagosPrevios` son los cobros que ya tenía antes de este.
 */
export function aplicarPago(
  prestamo: Prestamo,
  pago: Pick<Pago, "tipo" | "monto">,
  pagosPrevios: Pago[]
): Partial<Prestamo> {
  const cambios: Partial<Prestamo> = {};

  if (pago.tipo === "interes") {
    // Cobró el interés: el capital queda igual y corre otro mes.
    cambios.fecha_vencimiento = sumarMeses(prestamo.fecha_vencimiento, 1);
  } else if (pago.tipo === "capital") {
    const capitalNuevo = Math.max(0, pesos(prestamo.capital_actual - pago.monto));
    cambios.capital_actual = capitalNuevo;
    if (capitalNuevo === 0) cambios.estado = "pagado";
  } else if (pago.tipo === "cuota") {
    const cuotasPagadas =
      pagosPrevios.filter((otro) => otro.tipo === "cuota").length + 1;
    if (cuotasPagadas >= (prestamo.cuotas_total ?? 1)) {
      cambios.estado = "pagado";
      cambios.capital_actual = 0;
    } else {
      cambios.fecha_vencimiento = siguienteVencimiento(
        prestamo.fecha_vencimiento,
        frecuenciaDe(prestamo)
      );
    }
  } else if (pago.tipo === "total") {
    cambios.estado = "pagado";
    cambios.capital_actual = 0;
  }

  return cambios;
}

/**
 * Deshace en el préstamo lo que un cobro le había hecho.
 *
 * Borrar la fila de `pagos` no alcanza: al registrarlo se corrió el
 * vencimiento, o se bajó el capital, o se dio el préstamo por pagado. Si eso no
 * se revierte, el cronograma queda corrido un período y todo lo que se proyecta
 * a partir de ahí sale mal.
 *
 * `pagosRestantes` son los cobros que quedan **después** de borrar este.
 */
export function revertirPago(
  prestamo: Prestamo,
  pago: Pick<Pago, "tipo" | "monto">,
  pagosRestantes: Pago[]
): Partial<Prestamo> {
  const cambios: Partial<Prestamo> = {};
  const estabaCerrado = prestamo.estado === "pagado";

  // El capital que correspondía antes de que este cobro lo pusiera en cero.
  // Las entregas a cuenta que sigan vivas se descuentan igual.
  const capitalSinEsteCobro = () =>
    Math.max(0, pesos(prestamo.capital_inicial - sumar(pagosRestantes, ["capital"])));

  if (pago.tipo === "interes") {
    // Cobró el interés y el vencimiento se había corrido un mes: vuelve atrás.
    cambios.fecha_vencimiento = sumarMeses(prestamo.fecha_vencimiento, -1);
  } else if (pago.tipo === "capital") {
    cambios.capital_actual = pesos(prestamo.capital_actual + pago.monto);
    if (estabaCerrado) cambios.estado = "vigente";
  } else if (pago.tipo === "cuota") {
    if (estabaCerrado) {
      // Esta cuota había cerrado el plan. Al registrarla no se corrió el
      // vencimiento, así que solo hay que volver a abrirlo.
      cambios.estado = "vigente";
      cambios.capital_actual = capitalSinEsteCobro();
    } else {
      cambios.fecha_vencimiento = vencimientoAnterior(
        prestamo.fecha_vencimiento,
        frecuenciaDe(prestamo)
      );
    }
  } else if (pago.tipo === "total") {
    cambios.estado = "vigente";
    cambios.capital_actual = capitalSinEsteCobro();
  }

  return cambios;
}

/**
 * Numera los pagos de cuota de un préstamo: el primero es la cuota 1.
 *
 * Se ordena por fecha y, cuando dos caen el mismo día —pasa cuando se registran
 * dos cuotas juntas— por el momento en que se cargaron. Así el número de cada
 * cuota no cambia según cómo se esté mirando la lista.
 */
export function numerarCuotas(pagos: Pago[]): Map<string, number> {
  const cronologico = pagos
    .filter((pago) => pago.tipo === "cuota")
    .sort(
      (a, b) =>
        a.fecha.localeCompare(b.fecha) || a.created_at.localeCompare(b.created_at)
    );

  return new Map(cronologico.map((pago, indice) => [pago.id, indice + 1]));
}
