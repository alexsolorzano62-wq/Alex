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
      className="flex items-center justify-between gap-3 px-4 py-3 active:bg-slate-50"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {prestamo.cliente?.nombre}
        </p>
        <p className="tabular truncate text-xs text-slate-500">
          {plata(datos.capital)} · vence {formatFecha(prestamo.fecha_vencimiento)}
        </p>
        <p
          className={`text-xs ${
            datos.vencido ? "font-semibold text-red-600" : "text-slate-400"
          }`}
        >
          {prestamo.estado === "vigente"
            ? textoVencimiento(datos.diasParaVencer)
            : "cerrado"}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="tabular text-sm font-bold text-slate-900">
          {plata(datos.aDevolver)}
        </p>
        <EstadoBadge estado={datos.estadoVisual} className="mt-1" />
      </div>
    </Link>
  );
}
