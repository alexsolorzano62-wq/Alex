import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Estado, Dato } from "@/components/Ui";
import { formatearMoneda } from "@/lib/dinero";
import { nombreDelPeriodo, formatearFecha } from "@/lib/fechas";
import { etiqueta } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DetallePropietario({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: propietario }, { data: propiedades }, { data: liquidaciones }] =
    await Promise.all([
      supabase.from("propietarios").select("*").eq("id", id).single(),
      supabase
        .from("propiedades")
        .select("id, direccion, piso_depto, tipo, estado")
        .eq("propietario_id", id)
        .is("deleted_at", null)
        .order("direccion"),
      supabase
        .from("liquidaciones")
        .select("id, numero, periodo, moneda, neto_a_pagar, estado, fecha_pago")
        .eq("propietario_id", id)
        .order("periodo", { ascending: false })
        .limit(12),
    ]);

  if (!propietario) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="titulo">{propietario.nombre}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {(propiedades ?? []).length} propiedades · cobra por{" "}
            {etiqueta(propietario.forma_cobro).toLowerCase()}
          </p>
        </div>
        <Link href={`/propietarios/${id}/editar`} className="boton-secundario shrink-0">
          Editar
        </Link>
      </div>

      <section className="tarjeta">
        <dl className="grid gap-4 sm:grid-cols-3">
          <Dato rotulo="Documento">{propietario.documento}</Dato>
          <Dato rotulo="Teléfono">{propietario.telefono}</Dato>
          <Dato rotulo="Email">{propietario.email}</Dato>
          <Dato rotulo="CBU">{propietario.cbu}</Dato>
          <Dato rotulo="Alias">{propietario.alias_cbu}</Dato>
          <Dato rotulo="Titular">{propietario.titular_cuenta}</Dato>
        </dl>
        {propietario.notas && (
          <p className="mt-4 whitespace-pre-wrap border-t border-stone-100 pt-4 text-sm text-stone-600">
            {propietario.notas}
          </p>
        )}
      </section>

      <section className="tarjeta">
        <h2 className="font-titulo text-lg font-bold">Propiedades</h2>
        {!propiedades || propiedades.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Todavía no tiene propiedades cargadas.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {propiedades.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/propiedades/${p.id}`} className="min-w-0 truncate text-sm font-medium hover:text-marca-700">
                  {p.direccion}
                  {p.piso_depto ? ` ${p.piso_depto}` : ""}
                  <span className="ml-2 text-xs font-normal text-stone-500">
                    {etiqueta(p.tipo)}
                  </span>
                </Link>
                <Estado valor={p.estado} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="tarjeta">
        <h2 className="font-titulo text-lg font-bold">Liquidaciones</h2>
        {!liquidaciones || liquidaciones.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Todavía no se le liquidó ningún mes.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {liquidaciones.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/liquidaciones/${l.id}`} className="min-w-0 text-sm hover:text-marca-700">
                  <span className="font-medium capitalize">{nombreDelPeriodo(l.periodo)}</span>
                  <span className="ml-2 text-xs text-stone-500">
                    N.º {l.numero}
                    {l.fecha_pago ? ` · pagada el ${formatearFecha(l.fecha_pago)}` : ""}
                  </span>
                </Link>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="tabular text-sm font-semibold">
                    {formatearMoneda(Number(l.neto_a_pagar), l.moneda)}
                  </span>
                  <Estado valor={l.estado} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
