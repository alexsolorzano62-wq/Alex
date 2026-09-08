import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Estado, Dato } from "@/components/Ui";
import { formatearMoneda } from "@/lib/dinero";
import { formatearFecha } from "@/lib/fechas";
import { etiqueta } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DetallePropiedad({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: propiedad }, { data: contratos }, { data: gastos }] = await Promise.all([
    supabase
      .from("propiedades")
      .select("*, propietarios(id, nombre)")
      .eq("id", id)
      .single(),
    supabase
      .from("contratos")
      .select("id, monto_actual, moneda, fecha_inicio, fecha_fin, estado, honorarios_porcentaje, inquilinos(nombre)")
      .eq("propiedad_id", id)
      .is("deleted_at", null)
      .order("fecha_inicio", { ascending: false }),
    supabase
      .from("gastos")
      .select("id, fecha, tipo, descripcion, monto, moneda, a_cargo_de, cobro_id, liquidacion_id")
      .eq("propiedad_id", id)
      .is("deleted_at", null)
      .order("fecha", { ascending: false })
      .limit(10),
  ]);

  if (!propiedad) notFound();
  const propietario = propiedad.propietarios as unknown as { id: string; nombre: string } | null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="titulo">
            {propiedad.direccion}
            {propiedad.piso_depto ? ` ${propiedad.piso_depto}` : ""}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {etiqueta(propiedad.tipo)}
            {propiedad.localidad ? ` · ${propiedad.localidad}` : ""} ·{" "}
            {propietario && (
              <Link href={`/propietarios/${propietario.id}`} className="hover:text-marca-700">
                {propietario.nombre}
              </Link>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Estado valor={propiedad.estado} />
          <Link href={`/propiedades/${id}/editar`} className="boton-secundario">Editar</Link>
        </div>
      </div>

      <section className="tarjeta">
        <dl className="grid gap-4 sm:grid-cols-3">
          <Dato rotulo="Ambientes">{propiedad.ambientes}</Dato>
          <Dato rotulo="Superficie">
            {propiedad.superficie_m2 ? `${propiedad.superficie_m2} m²` : null}
          </Dato>
          <Dato rotulo="Otros titulares">{propiedad.titulares_adicionales}</Dato>
          <Dato rotulo="Partida">{propiedad.partida_inmobiliaria}</Dato>
          <Dato rotulo="Unidad de expensas">{propiedad.expensas_unidad}</Dato>
          <Dato rotulo="Luz">{propiedad.cuenta_luz}</Dato>
          <Dato rotulo="Gas">{propiedad.cuenta_gas}</Dato>
          <Dato rotulo="Agua">{propiedad.cuenta_agua}</Dato>
        </dl>
      </section>

      <section className="tarjeta">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-titulo text-lg font-bold">Contratos</h2>
          <Link href={`/contratos/nuevo?propiedad=${id}`} className="text-sm font-semibold text-marca-700">
            Nuevo contrato →
          </Link>
        </div>
        {!contratos || contratos.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Esta propiedad no tuvo contratos todavía.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {contratos.map((c) => {
              const inquilino = c.inquilinos as unknown as { nombre: string } | null;
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/contratos/${c.id}`} className="min-w-0 text-sm hover:text-marca-700">
                    <span className="block truncate font-medium">{inquilino?.nombre}</span>
                    <span className="text-xs text-stone-500">
                      {formatearFecha(c.fecha_inicio)} a {formatearFecha(c.fecha_fin)} ·{" "}
                      {c.honorarios_porcentaje}% de honorarios
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

      <section className="tarjeta">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-titulo text-lg font-bold">Últimos gastos</h2>
          <Link href={`/gastos/nuevo?propiedad=${id}`} className="text-sm font-semibold text-marca-700">
            Cargar gasto →
          </Link>
        </div>
        {!gastos || gastos.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No hay gastos cargados.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {gastos.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm">{g.descripcion}</div>
                  <div className="text-xs text-stone-500">
                    {formatearFecha(g.fecha)} · {etiqueta(g.tipo)} · a cargo del{" "}
                    {etiqueta(g.a_cargo_de).toLowerCase()}
                    {!g.cobro_id && !g.liquidacion_id && (
                      <span className="ml-1 font-semibold text-amber-700">· pendiente</span>
                    )}
                  </div>
                </div>
                <span className="tabular shrink-0 text-sm">
                  {formatearMoneda(Number(g.monto), g.moneda)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
