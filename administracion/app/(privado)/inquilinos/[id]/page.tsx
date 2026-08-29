import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Estado, Dato } from "@/components/Ui";
import { formatearMoneda } from "@/lib/dinero";
import { formatearFecha } from "@/lib/fechas";

export const dynamic = "force-dynamic";

export default async function DetalleInquilino({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: inquilino }, { data: contratos }] = await Promise.all([
    supabase.from("inquilinos").select("*").eq("id", id).single(),
    supabase
      .from("contratos")
      .select("id, monto_actual, moneda, fecha_inicio, fecha_fin, estado, propiedades(direccion, piso_depto)")
      .eq("inquilino_id", id)
      .is("deleted_at", null)
      .order("fecha_inicio", { ascending: false }),
  ]);

  if (!inquilino) notFound();

  return (
    <div className="space-y-6">
      <h1 className="titulo">{inquilino.nombre}</h1>

      <section className="tarjeta">
        <dl className="grid gap-4 sm:grid-cols-3">
          <Dato rotulo="Documento">{inquilino.documento}</Dato>
          <Dato rotulo="Teléfono">{inquilino.telefono}</Dato>
          <Dato rotulo="Email">{inquilino.email}</Dato>
        </dl>
        {inquilino.notas && (
          <p className="mt-4 whitespace-pre-wrap border-t border-stone-100 pt-4 text-sm text-stone-600">
            {inquilino.notas}
          </p>
        )}
      </section>

      <section className="tarjeta">
        <h2 className="font-titulo text-lg font-bold">Contratos</h2>
        {!contratos || contratos.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No tiene contratos cargados.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {contratos.map((c) => {
              const propiedad = c.propiedades as unknown as
                | { direccion: string; piso_depto: string | null }
                | null;
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/contratos/${c.id}`} className="min-w-0 text-sm hover:text-marca-700">
                    <span className="block truncate font-medium">
                      {propiedad?.direccion}
                      {propiedad?.piso_depto ? ` ${propiedad.piso_depto}` : ""}
                    </span>
                    <span className="text-xs text-stone-500">
                      {formatearFecha(c.fecha_inicio)} a {formatearFecha(c.fecha_fin)}
                    </span>
                  </Link>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="tabular text-sm font-semibold">
                      {formatearMoneda(Number(c.monto_actual), c.moneda)}
                    </span>
                    <Estado valor={c.estado} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
