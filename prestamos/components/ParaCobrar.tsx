import Link from "next/link";
import { cobrarRapido } from "@/app/acciones";
import BotonConfirmar from "@/components/BotonConfirmar";
import { plata, textoVencimiento } from "@/lib/format";
import type { PrestamoResuelto } from "@/lib/agregados";

export type FilaCobranza = PrestamoResuelto & {
  /** Lo que corresponde cobrarle hoy. */
  aCobrar: number;
  /** "cuota" en los planes, "interes" en los de interés mensual. */
  tipo: "cuota" | "interes";
  linkWhatsApp: string;
};

/** La lista de trabajo del día: a quién cobrarle y cuánto. */
export default function ParaCobrar({ filas }: { filas: FilaCobranza[] }) {
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      {filas.map(({ prestamo, datos, aCobrar, tipo, linkWhatsApp }) => (
        <li key={prestamo.id} className="px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <Link href={`/prestamos/${prestamo.id}`} className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {prestamo.cliente?.nombre}
              </p>
              <p
                className={`text-xs ${
                  datos.vencido ? "font-semibold text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {datos.cuotasAtrasadas > 0
                  ? `debe ${datos.cuotasAtrasadas} cuota${datos.cuotasAtrasadas === 1 ? "" : "s"} · ${plata(datos.montoAtrasado)}`
                  : textoVencimiento(datos.diasParaVencer)}
              </p>
            </Link>
            <p className="tabular shrink-0 text-base font-bold text-slate-900 dark:text-slate-100">
              {plata(aCobrar)}
            </p>
          </div>

          <div className="mt-2 flex gap-2">
            <a
              href={linkWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white active:bg-emerald-700"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.9 9.9 0 0 0 4.74 1.2c5.46 0 9.9-4.43 9.9-9.9 0-5.45-4.44-9.9-9.9-9.9zm5.8 14.03c-.24.68-1.2 1.25-1.96 1.4-.52.1-1.2.18-3.5-.74-2.94-1.18-4.83-4.1-4.98-4.3-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.25-.28.55-.35.73-.35l.53.01c.17 0 .4-.06.62.48l.85 2.05c.07.14.12.31.02.5l-.29.46-.42.46c-.14.14-.29.3-.12.58.16.29.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.15.44.12.6-.07l.86-1c.2-.24.36-.19.6-.11l1.98.94c.24.11.4.17.46.27.06.1.06.57-.18 1.25z" />
              </svg>
              Recordarle
            </a>

            <form action={cobrarRapido} className="flex-1">
              <input type="hidden" name="prestamo_id" value={prestamo.id} />
              <input type="hidden" name="tipo" value={tipo} />
              <BotonConfirmar
                pregunta={`¿Registrar que ${prestamo.cliente?.nombre} pagó ${plata(aCobrar)}?`}
                className="w-full rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white active:bg-brand-700"
              >
                Cobré {plata(aCobrar)}
              </BotonConfirmar>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
