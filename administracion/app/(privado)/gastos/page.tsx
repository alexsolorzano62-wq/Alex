import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { archivarGasto } from "@/app/acciones";
import { Titulo, Vacio } from "@/components/Ui";
import { formatearMoneda, formatearCorto } from "@/lib/dinero";
import { formatearFecha } from "@/lib/fechas";
import { etiqueta } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Gastos({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado = "pendientes" } = await searchParams;
  const supabase = await createClient();

  let consulta = supabase
    .from("gastos")
    .select("id, fecha, tipo, descripcion, monto, moneda, a_cargo_de, cobro_id, liquidacion_id, propiedades(id, direccion, piso_depto)")
    .is("deleted_at", null)
    .order("fecha", { ascending: false });

  if (estado === "pendientes") {
    consulta = consulta.is("cobro_id", null).is("liquidacion_id", null);
  }

  const { data: gastos } = await consulta.limit(200);

  const aInquilino = (gastos ?? []).filter((g) => g.a_cargo_de === "inquilino");
  const aPropietario = (gastos ?? []).filter((g) => g.a_cargo_de === "propietario");

  return (
    <div>
      <Titulo accion={{ href: "/gastos/nuevo", texto: "Cargar gasto" }}>Gastos</Titulo>

      <div className="mb-4 flex gap-2">
        {[
          { valor: "pendientes", texto: "Sin imputar" },
          { valor: "todos", texto: "Todos" },
        ].map((f) => (
          <Link
            key={f.valor}
            href={`/gastos?estado=${f.valor}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              estado === f.valor
                ? "bg-marca-600 text-white"
                : "border border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
            }`}
          >
            {f.texto}
          </Link>
        ))}
      </div>

      {!gastos || gastos.length === 0 ? (
        <Vacio
          texto={
            estado === "pendientes"
              ? "No quedan gastos sin imputar. Todo entró en un recibo o en una liquidación."
              : "Todavía no cargaste gastos."
          }
          accion={{ href: "/gastos/nuevo", texto: "Cargar gasto" }}
        />
      ) : (
        <div className="space-y-6">
          {[
            { titulo: "A cobrar al inquilino", lista: aInquilino },
            { titulo: "A descontar al propietario", lista: aPropietario },
          ].map((grupo) =>
            grupo.lista.length === 0 ? null : (
              <section key={grupo.titulo}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h2 className="font-titulo text-lg font-bold">{grupo.titulo}</h2>
                  <span className="tabular text-sm text-stone-500">
                    {formatearCorto(grupo.lista.reduce((s, g) => s + Number(g.monto), 0))}
                  </span>
                </div>
                <ul className="space-y-2">
                  {grupo.lista.map((g) => {
                    const propiedad = g.propiedades as unknown as
                      { id: string; direccion: string; piso_depto: string | null } | null;
                    const imputado = g.cobro_id != null || g.liquidacion_id != null;

                    return (
                      <li key={g.id} className="tarjeta flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{g.descripcion}</div>
                          <div className="truncate text-xs text-stone-500">
                            {propiedad && (
                              <Link href={`/propiedades/${propiedad.id}`} className="hover:text-marca-700">
                                {propiedad.direccion}
                                {propiedad.piso_depto ? ` ${propiedad.piso_depto}` : ""}
                              </Link>
                            )}
                            {" · "}
                            {etiqueta(g.tipo)} · {formatearFecha(g.fecha)}
                            {imputado && (
                              <span className="ml-1 text-marca-700">
                                · {g.cobro_id ? "cobrado" : "liquidado"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="tabular text-sm font-semibold">
                            {formatearMoneda(Number(g.monto), g.moneda)}
                          </span>
                          {!imputado && (
                            <form action={archivarGasto}>
                              <input type="hidden" name="id" value={g.id} />
                              <button
                                type="submit"
                                className="rounded px-2 py-1 text-xs text-stone-400 hover:bg-stone-100 hover:text-red-700"
                                title="Archivar"
                              >
                                Archivar
                              </button>
                            </form>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )
          )}
        </div>
      )}
    </div>
  );
}
