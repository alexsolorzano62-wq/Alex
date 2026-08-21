import { redondear } from "@/lib/dinero";
import { honorariosDe } from "@/lib/liquidacion";
import type { Unidad } from "@/lib/unidades";

// ---------------------------------------------------------------------------
// La planilla del mes: una fila por unidad alquilada, con lo que se cobró y lo
// que le queda al propietario. Es la vista con la que la inmobiliaria trabaja
// hoy en Excel, así que sigue esas columnas y esa convención: verde = abonado.
// ---------------------------------------------------------------------------

export type FilaPlanilla = Unidad & {
  cobroId: string | null;
  cobrado: number | null;         // el total del recibo, con expensas y punitorios
  medioPago: string | null;
  fechaPago: string | null;
  observaciones: string | null;
  // Lo que se le descuenta y lo que le queda al dueño, ya calculado.
  honorariosMonto: number;
  netoPropietario: number;
};

export function armarFila(
  unidad: Unidad,
  cobro: { id: string; total: number; medio_pago: string; fecha_pago: string } | null,
  observaciones: string | null
): FilaPlanilla {
  const cobrado = cobro ? Number(cobro.total) : null;
  const porcentaje = unidad.honorarios ?? 0;

  // Los honorarios se calculan sobre lo efectivamente cobrado, igual que en la
  // liquidación. Si todavía no pagó, no hay honorarios devengados.
  const honorariosMonto = cobrado != null ? honorariosDe(cobrado, porcentaje) : 0;

  return {
    ...unidad,
    cobroId: cobro?.id ?? null,
    cobrado,
    medioPago: cobro?.medio_pago ?? null,
    fechaPago: cobro?.fecha_pago ?? null,
    observaciones,
    honorariosMonto,
    netoPropietario: cobrado != null ? redondear(cobrado - honorariosMonto) : 0,
  };
}

export function estaPaga(fila: FilaPlanilla): boolean {
  return fila.cobroId != null;
}

export type TotalesPlanilla = {
  unidades: number;
  pagadas: number;
  pendientes: number;
  alquilerEsperado: number;
  cobrado: number;
  honorarios: number;
  netoPropietarios: number;
  faltaCobrar: number;
};

export function totales(filas: FilaPlanilla[]): TotalesPlanilla {
  // Solo se suman los pesos: mezclar monedas en un total daría un número que
  // no significa nada.
  const enPesos = filas.filter((f) => f.moneda === "ARS");

  const alquilerEsperado = redondear(
    enPesos.reduce((suma, f) => suma + (f.monto ?? 0), 0)
  );
  const cobrado = redondear(enPesos.reduce((suma, f) => suma + (f.cobrado ?? 0), 0));
  const honorarios = redondear(enPesos.reduce((suma, f) => suma + f.honorariosMonto, 0));
  const netoPropietarios = redondear(
    enPesos.reduce((suma, f) => suma + f.netoPropietario, 0)
  );

  const pagadas = filas.filter(estaPaga).length;

  return {
    unidades: filas.length,
    pagadas,
    pendientes: filas.length - pagadas,
    alquilerEsperado,
    cobrado,
    honorarios,
    netoPropietarios,
    // Lo que falta entrar según lo que dice el contrato, sin contar extras.
    faltaCobrar: redondear(
      enPesos
        .filter((f) => !estaPaga(f))
        .reduce((suma, f) => suma + (f.monto ?? 0), 0)
    ),
  };
}
