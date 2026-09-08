import { createClient } from "@/lib/supabase/server";
import { Titulo } from "@/components/Ui";
import { ActualizarIndices } from "@/components/ActualizarIndices";
import { formatearFecha } from "@/lib/fechas";

export const dynamic = "force-dynamic";

const SEGUIDOS = ["ICL", "IPC", "UVA", "CASA_PROPIA"];

export default async function Indices() {
  const supabase = await createClient();

  const estados = await Promise.all(
    SEGUIDOS.map(async (indice) => {
      const [{ data: ultimo }, { count }] = await Promise.all([
        supabase
          .from("indices_valores")
          .select("fecha, valor")
          .eq("indice", indice)
          .order("fecha", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("indices_valores")
          .select("fecha", { count: "exact", head: true })
          .eq("indice", indice),
      ]);
      return { indice, ultimo, total: count ?? 0 };
    })
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Titulo>Índices</Titulo>

      <p className="text-sm text-stone-600">
        Los aumentos se calculan contra esta serie guardada, no contra la web del
        organismo. Así el cierre del mes no depende de que la página del BCRA esté
        arriba justo ese día, y cada ajuste queda auditable con los valores que se usaron.
      </p>

      <section className="tarjeta">
        <h2 className="font-titulo text-lg font-bold">Estado de las series</h2>
        <ul className="mt-3 divide-y divide-stone-100">
          {estados.map((e) => (
            <li key={e.indice} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <div className="font-medium">{e.indice.replace("_", " ")}</div>
                <div className="text-xs text-stone-500">
                  {e.total === 0
                    ? "sin datos cargados"
                    : `${e.total} valores · último el ${formatearFecha(e.ultimo!.fecha)}`}
                </div>
              </div>
              {e.ultimo && (
                <span className="tabular text-sm font-semibold">
                  {Number(e.ultimo.valor).toFixed(4)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="tarjeta">
        <h2 className="font-titulo text-lg font-bold">Bajar valores nuevos</h2>
        <p className="mb-3 mt-1 text-sm text-stone-600">
          El ICL sale de la API del BCRA y el IPC del catálogo de series del Estado.
          UVA y Casa Propia todavía se cargan a mano.
        </p>
        <ActualizarIndices indices={["ICL", "IPC"]} />
      </section>
    </div>
  );
}
