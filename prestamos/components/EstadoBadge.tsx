import type { EstadoVisual } from "@/lib/calc";

/**
 * El color nunca va solo: cada estado lleva ícono y texto, así se entiende
 * igual en blanco y negro o con daltonismo.
 */
const ESTILOS: Record<EstadoVisual, { texto: string; icono: string; clase: string }> = {
  vencido: {
    texto: "Vencido",
    icono: "●",
    clase: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-red-200 dark:ring-red-800",
  },
  por_vencer: {
    texto: "Por vencer",
    icono: "◐",
    clase: "bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 ring-amber-200 dark:ring-amber-800",
  },
  al_dia: {
    texto: "Al día",
    icono: "○",
    clase: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-800",
  },
  pagado: {
    texto: "Pagado",
    icono: "✓",
    clase: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-slate-200 dark:ring-slate-700",
  },
  cancelado: {
    texto: "Cancelado",
    icono: "—",
    clase: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-slate-200 dark:ring-slate-700",
  },
};

export default function EstadoBadge({
  estado,
  className = "",
}: {
  estado: EstadoVisual;
  className?: string;
}) {
  const estilo = ESTILOS[estado];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${estilo.clase} ${className}`}
    >
      <span aria-hidden="true">{estilo.icono}</span>
      {estilo.texto}
    </span>
  );
}
