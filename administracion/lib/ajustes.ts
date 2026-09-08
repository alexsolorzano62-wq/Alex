import { redondear } from "@/lib/dinero";
import { sumarMeses, hoyISO } from "@/lib/fechas";
import type { Indice } from "@/lib/types";

// ---------------------------------------------------------------------------
// Motor de ajustes.
//
// Desde el DNU 70/2023 el índice y la frecuencia se pactan libremente, así que
// nada de esto está fijo en el código: sale del contrato. El cálculo es
// siempre el mismo — un coeficiente que multiplica al alquiler vigente — y lo
// que cambia es de dónde sale ese coeficiente.
// ---------------------------------------------------------------------------

// Con un índice publicado (ICL, IPC, UVA, Casa Propia) el coeficiente es el
// cociente entre el valor del día en que arranca el nuevo período y el valor
// del día base del período anterior.
export function coeficientePorIndice(valorBase: number, valorFinal: number): number {
  if (!(valorBase > 0)) {
    throw new Error("El valor base del índice tiene que ser mayor a cero.");
  }
  return valorFinal / valorBase;
}

// Con un porcentaje pactado a mano: 12% pactado da coeficiente 1,12.
export function coeficienteFijo(porcentaje: number): number {
  return 1 + porcentaje / 100;
}

export function aplicarCoeficiente(montoActual: number, coeficiente: number): number {
  return redondear(montoActual * coeficiente);
}

// Cuándo toca el próximo aumento. La base es el último ajuste aplicado o, si
// nunca se ajustó, el inicio del contrato.
export function proximoAjuste(
  fechaBaseISO: string,
  frecuenciaMeses: number
): string {
  return sumarMeses(fechaBaseISO, frecuenciaMeses);
}

// Un contrato entra en la tanda del mes cuando su próximo ajuste ya llegó.
export function tocaAjustar(
  fechaProximoAjuste: string | null,
  hasta: string = hoyISO()
): boolean {
  if (!fechaProximoAjuste) return false;
  return fechaProximoAjuste <= hasta;
}

export type CalculoAjuste = {
  coeficiente: number;
  montoAnterior: number;
  montoNuevo: number;
  variacionPorcentual: number;
};

// El cálculo completo de un aumento, listo para mostrar antes de confirmarlo.
// Siempre se le muestra al operador antes de aplicarse: un ajuste mal aplicado
// a 95 contratos es un día de trabajo para revertir.
export function calcularAjuste(params: {
  montoActual: number;
  indice: Indice;
  valorIndiceBase?: number | null;
  valorIndiceFinal?: number | null;
  porcentajeFijo?: number | null;
}): CalculoAjuste {
  const { montoActual, indice, valorIndiceBase, valorIndiceFinal, porcentajeFijo } = params;

  let coeficiente: number;

  if (indice === "SIN_AJUSTE") {
    coeficiente = 1;
  } else if (indice === "FIJO") {
    if (porcentajeFijo == null) {
      throw new Error("El contrato ajusta por porcentaje fijo pero no tiene el porcentaje cargado.");
    }
    coeficiente = coeficienteFijo(porcentajeFijo);
  } else {
    if (valorIndiceBase == null || valorIndiceFinal == null) {
      throw new Error(`Faltan valores de ${indice} para calcular el ajuste.`);
    }
    coeficiente = coeficientePorIndice(valorIndiceBase, valorIndiceFinal);
  }

  const montoNuevo = aplicarCoeficiente(montoActual, coeficiente);

  return {
    coeficiente,
    montoAnterior: montoActual,
    montoNuevo,
    variacionPorcentual: redondear((coeficiente - 1) * 100),
  };
}
