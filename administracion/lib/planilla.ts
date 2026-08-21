import { redondear } from "@/lib/dinero";
import { honorariosDe } from "@/lib/liquidacion";
import { primerDiaDelMes, sumarMeses } from "@/lib/fechas";
import type { Unidad } from "@/lib/unidades";

// ---------------------------------------------------------------------------
// La planilla del mes: una fila por unidad alquilada, con lo que se cobró y lo
// que le queda al propietario. Sigue las columnas y los colores de la planilla
// de Excel que la inmobiliaria usa hoy:
//
//   verde    = abonado, no debe nada
//   amarillo = pagó pero quedó saldo, o arrastra meses anteriores
//   naranja  = no pagó este mes
// ---------------------------------------------------------------------------

export type EstadoFila = "abonado" | "con_saldo" | "impago";

// Diferencias de menos de un peso son redondeo, no deuda.
const TOLERANCIA = 1;

export type FilaPlanilla = Unidad & {
  cobroId: string | null;
  cobrado: number | null;          // total del recibo, con expensas y punitorios
  alquilerCobrado: number;         // solo lo imputado al alquiler
  medioPago: string | null;
  fechaPago: string | null;
  observaciones: string | null;
  honorariosMonto: number;
  netoPropietario: number;
  // Lo que falta del alquiler de este mes.
  saldoDelMes: number;
  // Meses anteriores del contrato que quedaron sin recibo.
  mesesAdeudados: number;
};

// Cuántos períodos del contrato, anteriores a este mes, quedaron sin cobrar.
// Se mira desde el inicio del contrato y se corta a los 12 meses: más atrás
// que eso ya no es un saldo, es un juicio.
export function contarMesesAdeudados(params: {
  fechaInicio: string;
  periodoActual: string;
  periodosCobrados: Set<string>;
  tope?: number;
}): number {
  const { fechaInicio, periodoActual, periodosCobrados, tope = 12 } = params;

  const desde = primerDiaDelMes(fechaInicio);
  let adeudados = 0;

  for (let atras = 1; atras <= tope; atras++) {
    const periodo = sumarMeses(periodoActual, -atras);
    if (periodo < desde) break;
    if (!periodosCobrados.has(periodo)) adeudados++;
  }

  return adeudados;
}

export function armarFila(
  unidad: Unidad,
  cobro: {
    id: string; total: number; medio_pago: string; fecha_pago: string;
    alquilerCobrado: number;
  } | null,
  observaciones: string | null,
  mesesAdeudados = 0
): FilaPlanilla {
  const cobrado = cobro ? Number(cobro.total) : null;
  const alquilerCobrado = cobro ? Number(cobro.alquilerCobrado) : 0;
  const porcentaje = unidad.honorarios ?? 0;

  // Los honorarios se calculan sobre lo efectivamente cobrado, igual que en la
  // liquidación. Si todavía no pagó, no hay honorarios devengados.
  const honorariosMonto = cobrado != null ? honorariosDe(cobrado, porcentaje) : 0;

  // Un pago de más queda en cero, no en negativo: tener saldo a favor no es
  // deber plata, y mezclarlos daría un total de deuda que miente.
  const saldoDelMes = cobro
    ? Math.max(0, redondear((unidad.monto ?? 0) - alquilerCobrado))
    : 0;

  return {
    ...unidad,
    cobroId: cobro?.id ?? null,
    cobrado,
    alquilerCobrado,
    medioPago: cobro?.medio_pago ?? null,
    fechaPago: cobro?.fecha_pago ?? null,
    observaciones,
    honorariosMonto,
    netoPropietario: cobrado != null ? redondear(cobrado - honorariosMonto) : 0,
    saldoDelMes,
    mesesAdeudados,
  };
}

export function estadoDeFila(fila: FilaPlanilla): EstadoFila {
  if (fila.cobroId == null) return "impago";
  if (fila.saldoDelMes > TOLERANCIA || fila.mesesAdeudados > 0) return "con_saldo";
  return "abonado";
}

export function estaPaga(fila: FilaPlanilla): boolean {
  return fila.cobroId != null;
}

export const ETIQUETA_ESTADO: Record<EstadoFila, string> = {
  abonado: "Abonado",
  con_saldo: "Con saldo",
  impago: "Impago",
};

export type TotalesPlanilla = {
  unidades: number;
  abonadas: number;
  conSaldo: number;
  impagas: number;
  alquilerEsperado: number;
  cobrado: number;
  honorarios: number;
  netoPropietarios: number;
  faltaCobrar: number;
  saldos: number;
};

export function totales(filas: FilaPlanilla[]): TotalesPlanilla {
  // Solo se suman los pesos: mezclar monedas en un total daría un número que
  // no significa nada.
  const enPesos = filas.filter((f) => f.moneda === "ARS");
  const estados = filas.map(estadoDeFila);

  const sumar = (fn: (f: FilaPlanilla) => number) =>
    redondear(enPesos.reduce((suma, f) => suma + fn(f), 0));

  return {
    unidades: filas.length,
    abonadas: estados.filter((e) => e === "abonado").length,
    conSaldo: estados.filter((e) => e === "con_saldo").length,
    impagas: estados.filter((e) => e === "impago").length,
    alquilerEsperado: sumar((f) => f.monto ?? 0),
    cobrado: sumar((f) => f.cobrado ?? 0),
    honorarios: sumar((f) => f.honorariosMonto),
    netoPropietarios: sumar((f) => f.netoPropietario),
    // Lo que no entró de las que no pagaron nada.
    faltaCobrar: sumar((f) => (estadoDeFila(f) === "impago" ? f.monto ?? 0 : 0)),
    // Lo que quedó a medias en las que sí pagaron.
    saldos: sumar((f) => f.saldoDelMes),
  };
}
