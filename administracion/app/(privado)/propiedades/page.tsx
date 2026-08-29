import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Titulo, Vacio, Estado } from "@/components/Ui";
import { etiqueta } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Propiedades() {
  const supabase = await createClient();

  const { data: propiedades } = await supabase
    .from("propiedades")
    .select("id, direccion, piso_depto, localidad, tipo, estado, propietarios(nombre)")
    .is("deleted_at", null)
    .order("direccion");

  return (
    <div>
      <Titulo accion={{ href: "/propiedades/nuevo", texto: "Nueva propiedad" }}>
        Propiedades
      </Titulo>

      {!propiedades || propiedades.length === 0 ? (
        <Vacio
          texto="Todavía no cargaste ninguna propiedad. Primero necesitás un propietario."
          accion={{ href: "/propiedades/nuevo", texto: "Cargar la primera" }}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {propiedades.map((p) => {
            const propietario = p.propietarios as unknown as { nombre: string } | null;
            return (
              <li key={p.id}>
                <Link href={`/propiedades/${p.id}`} className="tarjeta block hover:border-marca-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-titulo text-base font-bold">
                        {p.direccion}
                        {p.piso_depto ? ` ${p.piso_depto}` : ""}
                      </div>
                      <div className="mt-1 text-xs text-stone-500">
                        {etiqueta(p.tipo)}
                        {p.localidad ? ` · ${p.localidad}` : ""}
                      </div>
                    </div>
                    <Estado valor={p.estado} />
                  </div>
                  <div className="mt-2 truncate text-xs text-stone-600">
                    {propietario?.nombre}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
