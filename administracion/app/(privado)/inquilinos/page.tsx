import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Titulo, Vacio } from "@/components/Ui";

export const dynamic = "force-dynamic";

export default async function Inquilinos() {
  const supabase = await createClient();

  const { data: inquilinos } = await supabase
    .from("inquilinos")
    .select("id, nombre, documento, telefono, contratos(id, estado)")
    .is("deleted_at", null)
    .order("nombre");

  return (
    <div>
      <Titulo accion={{ href: "/inquilinos/nuevo", texto: "Nuevo inquilino" }}>
        Inquilinos
      </Titulo>

      {!inquilinos || inquilinos.length === 0 ? (
        <Vacio
          texto="Todavía no cargaste ningún inquilino."
          accion={{ href: "/inquilinos/nuevo", texto: "Cargar el primero" }}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {inquilinos.map((i) => {
            const activos = (i.contratos ?? []).filter(
              (c: { estado: string }) => c.estado === "activo"
            ).length;
            return (
              <li key={i.id}>
                <Link href={`/inquilinos/${i.id}`} className="tarjeta block hover:border-marca-300">
                  <div className="font-titulo text-base font-bold">{i.nombre}</div>
                  <div className="mt-1 text-xs text-stone-500">
                    {i.documento ?? "sin documento"} · {i.telefono ?? "sin teléfono"}
                  </div>
                  <div className="mt-2 text-xs text-stone-600">
                    {activos === 0
                      ? "Sin contrato activo"
                      : `${activos} contrato${activos > 1 ? "s" : ""} activo${activos > 1 ? "s" : ""}`}
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
