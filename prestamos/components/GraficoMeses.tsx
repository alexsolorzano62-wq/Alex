import { nombreMes } from "@/lib/fechas";
import { plata } from "@/lib/format";
import type { MesResumen } from "@/lib/agregados";

/**
 * Los importes exactos de cada mes.
 *
 * La forma de la curva ya la cuenta el gráfico de arriba; acá van los números,
 * que es lo que se mira cuando se quiere el dato y no la tendencia.
 */
export default function GraficoMeses({ meses }: { meses: MesResumen[] }) {
  return (
    <figure className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
      <figcaption className="sr-only">Prestado y ganado por mes</figcaption>

      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 dark:text-slate-400">
            <th className="py-1 font-medium">Mes</th>
            <th className="py-1 text-right font-medium">Prestado</th>
            <th className="py-1 text-right font-medium">Ganado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {[...meses].reverse().map((mes) => (
            <tr key={mes.mes}>
              <td className="py-1.5 text-slate-600 dark:text-slate-400">{nombreMes(mes.mes)}</td>
              <td className="tabular py-1.5 text-right font-medium">
                {plata(mes.prestado)}
              </td>
              <td className="tabular py-1.5 text-right font-medium text-emerald-700 dark:text-emerald-400">
                {plata(mes.ganancia)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
