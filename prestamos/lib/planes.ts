/**
 * La lista de precios de los planes semanales.
 *
 * Son montos pactados, no una fórmula: la tasa baja a medida que el préstamo
 * crece (a 100.000 la cuota es 139 por cada mil prestados; a 500.000, 132,8).
 * Por eso se guardan tal cual y no se calculan.
 */
export const PLANES_SEMANALES: { capital: number; semanas: number; cuota: number }[] = [
  { capital: 100_000, semanas: 16, cuota: 13_900 },
  { capital: 150_000, semanas: 16, cuota: 20_900 },
  { capital: 200_000, semanas: 16, cuota: 27_900 },
  { capital: 250_000, semanas: 16, cuota: 34_900 },
  { capital: 300_000, semanas: 16, cuota: 41_000 },
  { capital: 400_000, semanas: 16, cuota: 53_400 },
  { capital: 500_000, semanas: 16, cuota: 66_400 },

  { capital: 100_000, semanas: 20, cuota: 13_000 },
  { capital: 150_000, semanas: 20, cuota: 18_900 },
  { capital: 200_000, semanas: 20, cuota: 24_800 },
  { capital: 250_000, semanas: 20, cuota: 31_300 },
  { capital: 300_000, semanas: 20, cuota: 33_900 },
  { capital: 400_000, semanas: 20, cuota: 45_000 },
  { capital: 500_000, semanas: 20, cuota: 55_900 },
];

/** Los plazos que tienen lista de precios. */
export const SEMANAS_CON_PLAN = [...new Set(PLANES_SEMANALES.map((p) => p.semanas))].sort(
  (a, b) => a - b
);

/** Las cuotas de la lista son todas múltiplos de cien; las calculadas también. */
function redondearCuota(monto: number): number {
  return Math.round(monto / 100) * 100;
}

export type CuotaCalculada = {
  cuota: number;
  total: number;
  interes: number;
  /** true si el monto está tal cual en la lista de precios. */
  exacto: boolean;
  /** Los dos escalones entre los que se calculó, cuando no es exacto. */
  entre?: [number, number];
};

/**
 * La cuota semanal para un capital y un plazo.
 *
 * Si el monto está en la lista, devuelve ese precio. Si no, lo calcula en
 * proporción entre los dos escalones vecinos; fuera de la lista, estira el
 * escalón del extremo. Devuelve null si ese plazo no tiene lista de precios:
 * inventar una tasa para un plazo que nunca pactaste sería adivinar.
 */
export function cuotaSemanal(capital: number, semanas: number): CuotaCalculada | null {
  const escalones = PLANES_SEMANALES.filter((plan) => plan.semanas === semanas).sort(
    (a, b) => a.capital - b.capital
  );
  if (escalones.length === 0 || capital <= 0) return null;

  const armar = (cuota: number, exacto: boolean, entre?: [number, number]) => {
    const total = Math.round(cuota * semanas);
    return { cuota, total, interes: total - Math.round(capital), exacto, entre };
  };

  const exacto = escalones.find((plan) => plan.capital === capital);
  if (exacto) return armar(exacto.cuota, true);

  const primero = escalones[0];
  const ultimo = escalones[escalones.length - 1];

  // Fuera de la lista se mantiene la proporción del escalón más cercano.
  if (capital < primero.capital) {
    return armar(redondearCuota((primero.cuota * capital) / primero.capital), false);
  }
  if (capital > ultimo.capital) {
    return armar(redondearCuota((ultimo.cuota * capital) / ultimo.capital), false);
  }

  const arriba = escalones.findIndex((plan) => plan.capital > capital);
  const bajo = escalones[arriba - 1];
  const alto = escalones[arriba];
  const avance = (capital - bajo.capital) / (alto.capital - bajo.capital);

  return armar(
    redondearCuota(bajo.cuota + (alto.cuota - bajo.cuota) * avance),
    false,
    [bajo.capital, alto.capital]
  );
}

/** Todos los planes disponibles para un capital, para mostrarlos comparados. */
export function planesPara(capital: number) {
  return SEMANAS_CON_PLAN.map((semanas) => ({
    semanas,
    ...cuotaSemanal(capital, semanas)!,
  })).filter((plan) => plan.cuota > 0);
}
