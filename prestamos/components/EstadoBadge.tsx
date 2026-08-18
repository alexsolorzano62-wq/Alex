import type { EstadoVisual } from "@/lib/calc";

/**
 * El color nunca va solo: cada estado lleva ícono y texto, así se entiende
 * igual en blanco y negro o con daltonismo.
 */
const ESTILOS: Record<EstadoVisual, { texto: string; icono: string; clase: string }> = {
  vencido: {
    texto: "Vencido",
    icono: "●",
    clase: "bg-red-50 text-red-700 ring-red-200",
  },
  por_vencer: {
    texto: "Por vencer",
    icono: "◐",
    clase: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  al_dia: {
    texto: "Al día",
    icono: "○",
    clase: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  pagado: {
    texto: "Pagado",
    icono: "✓",
    clase: "bg-slate-100 text-slate-600 ring-slate-200",
  },
  cancelado: {
    texto: "Cancelado",
    icono: "—",
    clase: "bg-slate-100 text-slate-500 ring-slate-200",
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
