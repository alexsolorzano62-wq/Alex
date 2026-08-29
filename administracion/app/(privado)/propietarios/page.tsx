import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Titulo, Vacio } from "@/components/Ui";
import { etiqueta } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Propietarios() {
  const supabase = await createClient();

  const { data: propietarios } = await supabase
    .from("propietarios")
    .select("id, nombre, documento, telefono, forma_cobro, propiedades(id)")
    .is("deleted_at", null)
    .order("nombre");

  return (
    <div>
      <Titulo accion={{ href: "/propietarios/nuevo", texto: "Nuevo propietario" }}>
        Propietarios
      </Titulo>

      {!propietarios || propietarios.length === 0 ? (
        <Vacio
          texto="Todavía no cargaste ningún propietario."
          accion={{ href: "/propietarios/nuevo", texto: "Cargar el primero" }}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {propietarios.map((p) => (
            <li key={p.id}>
              <Link href={`/propietarios/${p.id}`} className="tarjeta block hover:border-marca-300">
                <div className="font-titulo text-base font-bold">{p.nombre}</div>
                <div className="mt-1 text-xs text-stone-500">
                  {p.documento ?? "sin documento"} · {p.telefono ?? "sin teléfono"}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-stone-600">
                  <span>{(p.propiedades ?? []).length} propiedades</span>
                  <span className="text-stone-300">|</span>
                  <span>Cobra por {etiqueta(p.forma_cobro).toLowerCase()}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
