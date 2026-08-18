import { plata } from "@/lib/format";

/**
 * Un número grande con su etiqueta. El número va en tinta, no en color de
 * estado: el color acá no codifica nada y distraería.
 */
export default function Metrica({
  etiqueta,
  monto,
  detalle,
}: {
  etiqueta: string;
  monto: number;
  detalle?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {etiqueta}
      </p>
      <p className="tabular mt-1 text-xl font-bold leading-tight text-slate-900">
        {plata(monto)}
      </p>
      {detalle && <p className="mt-0.5 text-xs text-slate-400">{detalle}</p>}
    </div>
  );
}
