import Link from "next/link";
import EstadoBadge from "@/components/EstadoBadge";
import { formatFecha } from "@/lib/fechas";
import { plata, textoVencimiento } from "@/lib/format";
import type { PrestamoResuelto } from "@/lib/agregados";

/** Un préstamo listado, pensado para leerse de un vistazo en el celular. */
export default function FilaPrestamo({ prestamo, datos }: PrestamoResuelto) {
  return (
    <Link
      href={`/prestamos/${prestamo.id}`}
      className="flex items-center justify-between gap-3 px-4 py-3 active:bg-slate-50 dark:active:bg-slate-800"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
          {prestamo.cliente?.nombre}
        </p>
        <p className="tabular truncate text-xs text-slate-500 dark:text-slate-400">
          {plata(datos.capital)} · vence {formatFecha(prestamo.fecha_vencimiento)}
        </p>
        <p
          className={`text-xs ${
            datos.vencido ? "font-semibold text-red-600 dark:text-red-400" : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {prestamo.estado !== "vigente"
            ? "cerrado"
            : datos.cuotasAtrasadas > 0
              ? `debe ${datos.cuotasAtrasadas} cuota${datos.cuotasAtrasadas === 1 ? "" : "s"} · ${plata(datos.montoAtrasado)}`
              : textoVencimiento(datos.diasParaVencer)}
        </p>
      </div>
      {datos.avance != null && prestamo.estado === "vigente" && (
        <div className="hidden w-20 shrink-0 sm:block">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${Math.max(datos.avance, 2)}%` }}
            />
          </div>
          <p className="tabular mt-1 text-right text-[11px] text-slate-400 dark:text-slate-500">
            {datos.avance}%
          </p>
        </div>
      )}
      <div className="shrink-0 text-right">
        <p className="tabular text-sm font-bold text-slate-900 dark:text-slate-100">
          {plata(datos.aDevolver)}
        </p>
        <EstadoBadge estado={datos.estadoVisual} className="mt-1" />
      </div>
    </Link>
  );
}
