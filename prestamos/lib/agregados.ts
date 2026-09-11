import { pesos, repartirCobros, resumen, type ResumenPrestamo } from "@/lib/calc";
import { mesDe } from "@/lib/fechas";
import { frecuenciaDe, siguienteVencimiento } from "@/lib/periodos";
import type {
  Frecuencia,
  Modalidad,
  PagoConDetalle,
  PrestamoConCliente,
} from "@/lib/types";

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
  /** De eso, lo que fue ganancia: lo que entró por encima del capital. */
  ganancia: number;
  /** Cobros de interés, que son los que renuevan un préstamo un mes más. */
  renovaciones: number;
  montoRenovado: number;
};

/**
 * Los últimos `cantidad` meses, del más viejo al más nuevo.
 *
 * Los cobros salen de los propios préstamos y no de una lista aparte: así lo
 * que entró y lo que se ganó se calculan sobre exactamente las mismas filas y
 * no pueden desfasarse.
 */
export function resumenPorMes(
  prestamos: PrestamoConCliente[],
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

  // La ganancia de cada cobro se calcula préstamo por préstamo, porque depende
  // de cuánto capital quedaba por tapar cuando ese cobro entró.
  const ganancias = gananciaPorCobro(prestamos);
  const cobros = prestamos.flatMap((p) => p.pagos ?? []);

  return meses.map((clave) => {
    const nuevos = prestamos.filter((p) => mesDe(p.fecha_inicio) === clave);
    const delMes = cobros.filter((p) => mesDe(p.fecha) === clave);
    const intereses = delMes.filter((p) => p.tipo === "interes");

    return {
      mes: clave,
      prestado: pesos(nuevos.reduce((acc, p) => acc + p.capital_inicial, 0)),
      prestamosNuevos: nuevos.length,
      cobrado: pesos(delMes.reduce((acc, p) => acc + p.monto, 0)),
      ganancia: pesos(delMes.reduce((acc, p) => acc + (ganancias.get(p.id) ?? 0), 0)),
      renovaciones: intereses.length,
      montoRenovado: pesos(intereses.reduce((acc, p) => acc + p.monto, 0)),
    };
  });
}

/**
 * Cuánta ganancia trajo cada cobro, por id.
 *
 * Un cobro de un plan de cuotas no es «interés» ni «capital»: es las dos cosas
 * a la vez. Cuánto de cada una depende de lo que ya se había cobrado de ese
 * préstamo, así que hay que recorrerlos en orden y préstamo por préstamo.
 */
export function gananciaPorCobro(prestamos: PrestamoConCliente[]): Map<string, number> {
  const ganancias = new Map<string, number>();

  for (const prestamo of prestamos) {
    for (const [id, parte] of repartirCobros(prestamo, prestamo.pagos ?? [])) {
      ganancias.set(id, parte.ganancia);
    }
  }

  return ganancias;
}

/** Una cuota todavía impaga, ubicada en su fecha. */
export type CuotaProgramada = {
  fecha: string;
  monto: number;
  /** De esa cuota, cuánto es plata que todavía no volvió a tu bolsillo. */
  capital: number;
  /** El resto: ganancia limpia. */
  interes: number;
  /** N° de cuota sobre el total del plan. Null en el interés mensual. */
  numero: number | null;
  /** Su fecha ya llegó: es plata que tendría que estar cobrada. */
  vencida: boolean;
};

/** El cronograma que le queda a un préstamo, con el nombre de quien paga. */
export type LineaCronograma = {
  prestamoId: string;
  clienteId: string;
  cliente: string;
  modalidad: Modalidad;
  frecuencia: Frecuencia;
  cuotasTotal: number | null;
  cuotas: CuotaProgramada[];
};

/**
 * El interés mensual no tiene fin: mientras no salden el capital, siguen
 * pagando. Se proyecta un año y ahí se corta, que es hasta donde tiene sentido
 * mirar.
 */
const MESES_PROYECTADOS = 12;

/**
 * Las cuotas que le faltan a un préstamo, cada una en su fecha.
 *
 * El reparto entre capital e interés sigue la misma regla que la ficha de cada
 * préstamo: **todo lo que entra se cuenta contra la plata que pusiste hasta
 * estar a mano, y recién después es ganancia**. Por eso las primeras cuotas
 * salen casi todas como capital y las últimas, casi todas como interés.
 */
export function cronogramaDe(
  { prestamo, datos }: PrestamoResuelto,
  hoy: string
): CuotaProgramada[] {
  if (prestamo.estado !== "vigente") return [];

  const esPlan = prestamo.modalidad !== "mensual";
  const valor = pesos(esPlan ? (prestamo.cuota_monto ?? 0) : datos.interes);
  if (valor <= 0) return [];

  const cantidad = esPlan
    ? Math.max(0, (prestamo.cuotas_total ?? 0) - datos.cuotasPagadas)
    : MESES_PROYECTADOS;

  const frecuencia = frecuenciaDe(prestamo);
  let falta = datos.faltaRecuperar;
  let fecha = prestamo.fecha_vencimiento;
  const cuotas: CuotaProgramada[] = [];

  // En un plan, el cronograma tiene que sumar **exactamente** lo que falta
  // cobrar. La última cuota absorbe el resto: cubre tanto los redondeos de
  // dividir el total (130.000 en 3 no da cuotas enteras) como una cuota que se
  // haya cobrado por un monto distinto al del plan.
  let restante = esPlan ? datos.aDevolver : Infinity;

  for (let i = 0; i < cantidad && restante > 0; i++) {
    // Solo en un plan la última absorbe el resto: el interés mensual no tiene
    // última cuota, se proyecta y se corta.
    const ultima = esPlan && i === cantidad - 1;
    const monto = pesos(ultima ? restante : Math.min(valor, restante));
    restante = pesos(restante - monto);

    const capital = pesos(Math.min(falta, monto));
    falta = pesos(falta - capital);

    cuotas.push({
      fecha,
      monto,
      capital,
      interes: pesos(monto - capital),
      numero: esPlan ? datos.cuotasPagadas + i + 1 : null,
      vencida: fecha <= hoy,
    });

    fecha = siguienteVencimiento(fecha, frecuencia);
  }

  return cuotas;
}

/** Todo lo que queda por cobrar, préstamo por préstamo. */
export function cronogramaPendiente(
  resueltos: PrestamoResuelto[],
  hoy: string
): LineaCronograma[] {
  return resueltos
    .map((resuelto) => ({
      prestamoId: resuelto.prestamo.id,
      clienteId: resuelto.prestamo.cliente_id,
      cliente: resuelto.prestamo.cliente?.nombre ?? "Sin nombre",
      modalidad: resuelto.prestamo.modalidad,
      frecuencia: frecuenciaDe(resuelto.prestamo),
      cuotasTotal: resuelto.prestamo.cuotas_total,
      cuotas: cronogramaDe(resuelto, hoy),
    }))
    .filter((linea) => linea.cuotas.length > 0);
}

export type MesProyectado = {
  mes: string;
  cuotas: number;
  monto: number;
  capital: number;
  interes: number;
  /** De esas cuotas, las que ya deberían estar cobradas. */
  vencidas: number;
  montoVencido: number;
  /** Una línea por préstamo, de mayor a menor monto. */
  lineas: (LineaCronograma & {
    monto: number;
    capital: number;
    interes: number;
  })[];
};

/**
 * Lo que vence en un mes, discriminado.
 *
 * A diferencia de mirar solo el próximo vencimiento de cada préstamo, esto
 * recorre **todas** las cuotas que caen dentro del mes: un plan semanal aporta
 * cuatro o cinco, no una.
 */
export function proyeccionDelMes(
  pendiente: LineaCronograma[],
  mes: string
): MesProyectado {
  const lineas = pendiente
    .map((linea) => {
      const cuotas = linea.cuotas.filter((cuota) => mesDe(cuota.fecha) === mes);
      return {
        ...linea,
        cuotas,
        monto: pesos(cuotas.reduce((acc, c) => acc + c.monto, 0)),
        capital: pesos(cuotas.reduce((acc, c) => acc + c.capital, 0)),
        interes: pesos(cuotas.reduce((acc, c) => acc + c.interes, 0)),
      };
    })
    .filter((linea) => linea.cuotas.length > 0)
    .sort((a, b) => b.monto - a.monto || a.cliente.localeCompare(b.cliente));

  const todas = lineas.flatMap((linea) => linea.cuotas);
  const vencidas = todas.filter((cuota) => cuota.vencida);

  return {
    mes,
    cuotas: todas.length,
    monto: pesos(todas.reduce((acc, c) => acc + c.monto, 0)),
    capital: pesos(todas.reduce((acc, c) => acc + c.capital, 0)),
    interes: pesos(todas.reduce((acc, c) => acc + c.interes, 0)),
    vencidas: vencidas.length,
    montoVencido: pesos(vencidas.reduce((acc, c) => acc + c.monto, 0)),
    lineas,
  };
}

/** Los meses que tienen algo por cobrar, del más viejo al más nuevo. */
export function mesesConVencimientos(pendiente: LineaCronograma[]): string[] {
  const meses = new Set<string>();
  for (const linea of pendiente) {
    for (const cuota of linea.cuotas) meses.add(mesDe(cuota.fecha));
  }
  return [...meses].sort();
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
  hoy: string
): PuntoHistorico[] {
  const cobros = prestamos.flatMap((p) => p.pagos ?? []);
  const fechas = [
    ...prestamos.map((p) => p.fecha_inicio),
    ...cobros.map((p) => p.fecha),
  ].filter(Boolean);
  if (fechas.length === 0) return [];

  const desde = fechas.reduce((a, b) => (a < b ? a : b)).slice(0, 7);
  const hasta = hoy.slice(0, 7);

  const ganancias = gananciaPorCobro(prestamos);

  const puntos: PuntoHistorico[] = [];
  let prestado = 0;
  let ganado = 0;

  for (let mes = desde; mes <= hasta; ) {
    prestado += prestamos
      .filter((p) => mesDe(p.fecha_inicio) === mes)
      .reduce((acc, p) => acc + p.capital_inicial, 0);
    ganado += cobros
      .filter((p) => mesDe(p.fecha) === mes)
      .reduce((acc, p) => acc + (ganancias.get(p.id) ?? 0), 0);

    puntos.push({ mes, prestado: pesos(prestado), ganado: pesos(ganado) });

    const [anio, numero] = mes.split("-").map(Number);
    const total = anio * 12 + (numero - 1) + 1;
    mes = `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
  }

  return puntos;
}
