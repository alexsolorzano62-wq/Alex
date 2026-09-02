import { redondear } from "@/lib/dinero";
import { calcularPunitorios } from "@/lib/punitorios";
import { nombreDelPeriodo } from "@/lib/fechas";
import type { TipoConcepto, TipoPunitorio } from "@/lib/types";

export type Renglon = {
  tipo: TipoConcepto;
  descripcion: string;
  monto: number;
};

export type Cargo = { tipo: TipoConcepto; descripcion: string; monto: number };

export type Recibo = {
  renglones: Renglon[];
  totalDebido: number;
  pagado: number;
  // Positivo: le queda plata a favor para el mes que viene.
  // Negativo: quedó debiendo.
  saldoResultante: number;
  punitorios: { dias: number; monto: number };
};

// Arma el recibo de un mes: alquiler, los cobros fijos del contrato, los
// gastos puntuales que se le imputan, los punitorios si pagó tarde, y el saldo
// que traía de antes.
//
// El saldo entra como un renglón más, con el signo dado vuelta: si el mes
// pasado quedó $5.000 a favor, este mes descuenta $5.000. Así el recibo
// muestra de dónde sale cada peso en vez de traer un total que no cierra.
export function armarRecibo(params: {
  periodo: string;
  alquiler: number;
  cargosFijos?: Cargo[];
  gastos?: Cargo[];
  saldoAnterior?: number;
  vencimiento: string;
  fechaPago: string;
  punitorio: { tipo: TipoPunitorio; valor: number; diasGracia?: number };
  // Lo que efectivamente entregó. Si no se aclara, se asume que pagó todo.
  pagado?: number;
}): Recibo {
  const {
    periodo, alquiler, cargosFijos = [], gastos = [],
    saldoAnterior = 0, vencimiento, fechaPago, punitorio,
  } = params;

  // Los punitorios corren sobre el alquiler solo, no sobre el agua ni la luz.
  const punitorios = calcularPunitorios({
    montoAlquiler: alquiler,
    vencimiento,
    fechaPago,
    tipo: punitorio.tipo,
    valor: punitorio.valor,
    diasGracia: punitorio.diasGracia ?? 0,
  });

  const renglones: Renglon[] = [
    { tipo: "alquiler", descripcion: `Alquiler ${nombreDelPeriodo(periodo)}`, monto: redondear(alquiler) },
    ...cargosFijos.map((c) => ({ ...c, monto: redondear(c.monto) })),
    ...gastos.map((g) => ({ ...g, monto: redondear(g.monto) })),
  ];

  if (punitorios.monto > 0) {
    renglones.push({
      tipo: "punitorios",
      descripcion: `Punitorios por ${punitorios.dias} ${punitorios.dias === 1 ? "día" : "días"} de atraso`,
      monto: punitorios.monto,
    });
  }

  if (saldoAnterior !== 0) {
    renglones.push({
      tipo: "saldo_anterior",
      descripcion: saldoAnterior > 0
        ? "Saldo a favor del mes anterior"
        : "Deuda del mes anterior",
      monto: redondear(-saldoAnterior),
    });
  }

  const totalDebido = redondear(renglones.reduce((s, r) => s + r.monto, 0));
  const pagado = redondear(params.pagado ?? totalDebido);

  return {
    renglones,
    totalDebido,
    pagado,
    saldoResultante: redondear(pagado - totalDebido),
    punitorios,
  };
}
