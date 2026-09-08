import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { generarLiquidacion } from "@/app/acciones";
import { Titulo, Vacio, Estado } from "@/components/Ui";
import { formatearMoneda, formatearCorto } from "@/lib/dinero";
import { primerDiaDelMes, hoyISO, nombreDelPeriodo, sumarMeses } from "@/lib/fechas";

export const dynamic = "force-dynamic";

export default async function Liquidaciones({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo: periodoParam } = await searchParams;
  const supabase = await createClient();
  const periodo = primerDiaDelMes(periodoParam ?? hoyISO());

  const [{ data: propietarios }, { data: liquidaciones }, { data: cobros }] = await Promise.all([
    supabase
      .from("propietarios")
      .select("id, nombre, propiedades(id)")
      .is("deleted_at", null)
      .order("nombre"),
    supabase
      .from("liquidaciones")
      .select("id, propietario_id, numero, moneda, neto_a_pagar, estado")
      .eq("periodo", periodo)
      .is("anulado_at", null),
    // Para saber a quién hay algo para liquidarle, hace falta ver qué contratos
    // cobraron este mes y de qué propiedad son.
    supabase
      .from("cobros")
      .select("id, total, contratos(propiedades(propietario_id))")
      .eq("periodo", periodo)
      .is("anulado_at", null),
  ]);

  const cobradoPorPropietario = new Map<string, number>();
  for (const cobro of cobros ?? []) {
    const contrato = cobro.contratos as unknown as
      { propiedades: { propietario_id: string } | null } | null;
    const id = contrato?.propiedades?.propietario_id;
    if (!id) continue;
    cobradoPorPropietario.set(id, (cobradoPorPropietario.get(id) ?? 0) + Number(cobro.total));
  }

  const porPropietario = new Map<string, typeof liquidaciones>();
  for (const l of liquidaciones ?? []) {
    const lista = porPropietario.get(l.propietario_id) ?? [];
    lista.push(l);
    porPropietario.set(l.propietario_id, lista);
  }

  const conMovimiento = (propietarios ?? []).filter(
    (p) => cobradoPorPropietario.has(p.id) || porPropietario.has(p.id)
  );

  const totalNeto = (liquidaciones ?? []).reduce((s, l) => s + Number(l.neto_a_pagar), 0);
  const pagadas = (liquidaciones ?? []).filter((l) => l.estado === "pagada").length;

  return (
    <div>
      <Titulo>Liquidaciones</Titulo>

      <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3">
        <Link href={`/liquidaciones?periodo=${sumarMeses(periodo, -1)}`} className="boton-secundario px-3 py-1.5">←</Link>
        <div className="text-center">
          <div className="font-titulo text-lg font-bold capitalize">{nombreDelPeriodo(periodo)}</div>
          <div className="tabular text-xs text-stone-500">
            {formatearCorto(totalNeto)} a transferir · {pagadas} de {(liquidaciones ?? []).length} pagadas
          </div>
        </div>
        <Link href={`/liquidaciones?periodo=${sumarMeses(periodo, 1)}`} className="boton-secundario px-3 py-1.5">→</Link>
      </div>

      {conMovimiento.length === 0 ? (
        <Vacio texto={`No hay nada para liquidar en ${nombreDelPeriodo(periodo)}. Registrá los cobros del mes primero.`} />
      ) : (
        <ul className="space-y-2">
          {conMovimiento.map((p) => {
            const suyas = porPropietario.get(p.id) ?? [];

            return (
              <li key={p.id} className="tarjeta">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/propietarios/${p.id}`} className="font-titulo text-base font-bold hover:text-marca-700">
                      {p.nombre}
                    </Link>
                    <div className="text-xs text-stone-500">
                      {formatearCorto(cobradoPorPropietario.get(p.id) ?? 0)} cobrados este mes
                    </div>
                  </div>

                  {suyas.length === 0 ? (
                    <form action={generarLiquidacion}>
                      <input type="hidden" name="propietario_id" value={p.id} />
                      <input type="hidden" name="periodo" value={periodo} />
                      <button type="submit" className="boton">Generar liquidación</button>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {suyas.map((l) => (
                        <Link
                          key={l.id}
                          href={`/liquidaciones/${l.id}`}
                          className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-1.5 hover:border-marca-300"
                        >
                          <span className="tabular text-sm font-semibold">
                            {formatearMoneda(Number(l.neto_a_pagar), l.moneda)}
                          </span>
                          <Estado valor={l.estado} />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
