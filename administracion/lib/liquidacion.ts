import { redondear } from "@/lib/dinero";

// ---------------------------------------------------------------------------
// Liquidación al propietario.
//
//   cobrado − honorarios − gastos ± ajustes = neto a transferir
//
// El porcentaje de honorarios viene por renglón, no global: va del 7 al 10
// según el propietario, y puede diferir entre dos propiedades del mismo dueño.
// Cada renglón se guarda con el porcentaje que se usó, para que renegociarlo
// mañana no reescriba las liquidaciones ya emitidas.
// ---------------------------------------------------------------------------

export type RenglonCobro = {
  descripcion: string;
  contratoId: string;
  cobroId: string;
  // Lo que efectivamente entró por ese contrato en el mes.
  montoCobrado: number;
  honorariosPorcentaje: number;
};

export type RenglonGasto = {
  descripcion: string;
  contratoId?: string | null;
  gastoId: string;
  monto: number;             // siempre positivo: la resta la hace el cálculo
};

export type RenglonAjuste = {
  descripcion: string;
  // Positivo suma al propietario, negativo le descuenta.
  monto: number;
};

export function honorariosDe(montoCobrado: number, porcentaje: number): number {
  return redondear(montoCobrado * (porcentaje / 100));
}

export type TotalesLiquidacion = {
  totalCobrado: number;
  totalHonorarios: number;
  totalGastos: number;
  totalAjustes: number;
  netoAPagar: number;
};

export function calcularTotales(params: {
  cobros: RenglonCobro[];
  gastos: RenglonGasto[];
  ajustes: RenglonAjuste[];
}): TotalesLiquidacion {
  const { cobros, gastos, ajustes } = params;

  const totalCobrado = redondear(
    cobros.reduce((suma, r) => suma + r.montoCobrado, 0)
  );

  // Los honorarios se calculan renglón por renglón y recién ahí se suman:
  // aplicar un porcentaje promedio al total daría otro número.
  const totalHonorarios = redondear(
    cobros.reduce((suma, r) => suma + honorariosDe(r.montoCobrado, r.honorariosPorcentaje), 0)
  );

  const totalGastos = redondear(gastos.reduce((suma, g) => suma + g.monto, 0));
  const totalAjustes = redondear(ajustes.reduce((suma, a) => suma + a.monto, 0));

  const netoAPagar = redondear(
    totalCobrado - totalHonorarios - totalGastos + totalAjustes
  );

  return { totalCobrado, totalHonorarios, totalGastos, totalAjustes, netoAPagar };
}

// El detalle que ve el propietario, en el orden en que lo lee: primero lo que
// entró, después lo que se descontó.
export type RenglonDetalle = {
  tipo: "cobro" | "gasto" | "ajuste";
  contratoId: string | null;
  cobroId: string | null;
  gastoId: string | null;
  descripcion: string;
  montoBruto: number;
  honorariosPorcentaje: number | null;
  honorariosMonto: number;
  neto: number;
  orden: number;
};

export function armarDetalle(params: {
  cobros: RenglonCobro[];
  gastos: RenglonGasto[];
  ajustes: RenglonAjuste[];
}): RenglonDetalle[] {
  const { cobros, gastos, ajustes } = params;
  const renglones: RenglonDetalle[] = [];
  let orden = 0;

  for (const c of cobros) {
    const honorariosMonto = honorariosDe(c.montoCobrado, c.honorariosPorcentaje);
    renglones.push({
      tipo: "cobro",
      contratoId: c.contratoId,
      cobroId: c.cobroId,
      gastoId: null,
      descripcion: c.descripcion,
      montoBruto: c.montoCobrado,
      honorariosPorcentaje: c.honorariosPorcentaje,
      honorariosMonto,
      neto: redondear(c.montoCobrado - honorariosMonto),
      orden: orden++,
    });
  }

  for (const g of gastos) {
    renglones.push({
      tipo: "gasto",
      contratoId: g.contratoId ?? null,
      cobroId: null,
      gastoId: g.gastoId,
      descripcion: g.descripcion,
      montoBruto: -g.monto,
      honorariosPorcentaje: null,
      honorariosMonto: 0,
      neto: -g.monto,
      orden: orden++,
    });
  }

  for (const a of ajustes) {
    renglones.push({
      tipo: "ajuste",
      contratoId: null,
      cobroId: null,
      gastoId: null,
      descripcion: a.descripcion,
      montoBruto: a.monto,
      honorariosPorcentaje: null,
      honorariosMonto: 0,
      neto: a.monto,
      orden: orden++,
    });
  }

  return renglones;
}
