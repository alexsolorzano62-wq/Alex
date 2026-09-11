import { plata } from "@/lib/format";
import type { ResumenPrestamo } from "@/lib/calc";

/**
 * Cuánto lleva pagado del plan y si la plata que pusiste ya volvió.
 *
 * Son dos preguntas distintas: se puede ir por la mitad de las cuotas y tener
 * el capital recuperado, o al revés. Por eso van separadas y no en una sola barra.
 */
export default function AvancePrestamo({
  datos,
  cuotasTotal,
}: {
  datos: ResumenPrestamo;
  cuotasTotal: number | null;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
      {datos.avance != null && (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">
              {datos.cuotasPagadas} de {cuotasTotal} cuotas
            </p>
            <p className="tabular text-lg font-bold text-brand-700">{datos.avance}%</p>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${Math.max(datos.avance, 1.5)}%` }}
            />
          </div>
        </>
      )}

      <div
        className={`${datos.avance != null ? "mt-3 border-t border-slate-100 pt-3" : ""}`}
      >
        {datos.capitalRecuperado ? (
          <p className="text-sm font-semibold text-emerald-700">
            <span aria-hidden="true">✓</span> Ya recuperaste lo que prestaste
            <span className="block text-xs font-normal text-slate-500">
              Todo lo que cobres de acá en más es ganancia
              {datos.capital > 0 && `, y te quedan ${plata(datos.capital)} en la calle`}
              .
            </span>
          </p>
        ) : (
          <p className="text-sm font-semibold text-slate-700">
            <span aria-hidden="true">○</span> Faltan {plata(datos.faltaRecuperar)} para
            recuperar lo prestado
            <span className="block text-xs font-normal text-slate-500">
              Llevás cobrado {plata(datos.cobrado)} de los{" "}
              {plata(datos.cobrado + datos.faltaRecuperar)} que pusiste.
            </span>
          </p>
        )}
      </div>
    </section>
  );
}
