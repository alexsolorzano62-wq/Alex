import Link from "next/link";
import { corregirVencimiento } from "@/app/acciones";
import BotonConfirmar from "@/components/BotonConfirmar";
import { formatFecha } from "@/lib/fechas";
import { textoCuotas } from "@/lib/periodos";
import type { Desfase } from "@/lib/revision";

/**
 * Los préstamos cuyo vencimiento no cierra con sus cobros.
 *
 * Aparece solo cuando hay alguno. No corrige nada por su cuenta: una fecha
 * cambiada a mano —una prórroga acordada— es perfectamente válida y no habría
 * que tocarla.
 */
export default function RevisionVencimientos({ desfases }: { desfases: Desfase[] }) {
  if (desfases.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
        <span aria-hidden="true">✓</span> Todos los vencimientos cierran con los cobros
        registrados.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      {desfases.map((desfase) => {
        const adelantado = desfase.periodos > 0;
        const cantidad = Math.abs(desfase.periodos);

        return (
          <li key={desfase.prestamoId} className="px-4 py-3">
            <Link
              href={`/prestamos/${desfase.prestamoId}`}
              className="text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              {desfase.cliente}
            </Link>

            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {desfase.modalidad === "mensual"
                ? "Interés mensual"
                : `${desfase.cuotasPagadas} de ${desfase.cuotasTotal ?? "?"} cuotas cobradas`}
              {" · "}
              {desfase.enGrilla
                ? `${adelantado ? "adelantado" : "atrasado"} ${textoCuotas(cantidad, desfase.frecuencia)}`
                : "la fecha no cae en ningún vencimiento del plan"}
            </p>

            <dl className="tabular mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/30 px-3 py-2">
                <dt className="text-amber-900 dark:text-amber-200">Dice que vence</dt>
                <dd className="font-semibold text-amber-900 dark:text-amber-100">
                  {formatFecha(desfase.guardado)}
                </dd>
              </div>
              <div className="rounded-xl bg-brand-50 dark:bg-brand-900/30 px-3 py-2">
                <dt className="text-slate-700 dark:text-slate-300">Le corresponde</dt>
                <dd className="font-semibold text-brand-700 dark:text-brand-300">
                  {formatFecha(desfase.esperado)}
                </dd>
              </div>
            </dl>

            {!desfase.enGrilla ? (
              <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
                Esta fecha se puso a mano: no coincide con ningún vencimiento del plan.
                Si fue una prórroga acordada, dejala como está.
              </p>
            ) : !desfase.seguro ? (
              <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
                En el interés mensual esto supone que el plazo original era de un mes. Si
                se lo diste a dos o tres, la fecha guardada está bien y no hay que tocarla.
              </p>
            ) : null}

            <form action={corregirVencimiento} className="mt-2">
              <input type="hidden" name="id" value={desfase.prestamoId} />
              <BotonConfirmar
                pregunta={`¿Mover el vencimiento de ${desfase.cliente} al ${formatFecha(desfase.esperado)}?`}
                className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Corregir la fecha
              </BotonConfirmar>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
