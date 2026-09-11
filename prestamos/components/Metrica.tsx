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
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
        {etiqueta}
      </p>
      <p className="tabular mt-1 text-xl font-bold leading-tight text-slate-900 dark:text-slate-100">
        {plata(monto)}
      </p>
      {detalle && <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{detalle}</p>}
    </div>
  );
}
