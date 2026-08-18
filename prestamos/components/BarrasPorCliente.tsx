import Link from "next/link";
import { plata } from "@/lib/format";

export type FilaCliente = { id: string; nombre: string; monto: number };

/**
 * Cuánto tiene cada cliente, de mayor a menor.
 *
 * Una sola serie, así que no hace falta leyenda: cada barra lleva su nombre y
 * su importe al lado, y el color es solo el de la marca.
 */
export default function BarrasPorCliente({ filas }: { filas: FilaCliente[] }) {
  if (filas.length === 0) return null;

  const maximo = Math.max(...filas.map((fila) => fila.monto));

  return (
    <ol className="space-y-2.5">
      {filas.map((fila) => (
        <li key={fila.id}>
          <Link href={`/clientes/${fila.id}`} className="block">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium text-slate-700">{fila.nombre}</span>
              <span className="tabular shrink-0 font-semibold text-slate-900">
                {plata(fila.monto)}
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${Math.max(2, (fila.monto / maximo) * 100)}%` }}
              />
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
