import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Titulo, Vacio } from "@/components/Ui";
import { formatearMoneda, formatearCorto } from "@/lib/dinero";
import { formatearFecha, hoyISO, primerDiaDelMes, nombreDelPeriodo, sumarMeses, vencimientoDelPeriodo } from "@/lib/fechas";
import { etiqueta } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Cobros({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo: periodoParam } = await searchParams;
  const supabase = await createClient();

  const hoy = hoyISO();
  const periodo = primerDiaDelMes(periodoParam ?? hoy);

  const [{ data: contratos }, { data: cobros }] = await Promise.all([
    supabase
      .from("contratos")
      .select("id, monto_actual, moneda, dia_vencimiento, inquilinos(nombre), propiedades(direccion, piso_depto)")
      .eq("estado", "activo")
      .is("deleted_at", null),
    supabase
      .from("cobros")
      .select("id, numero, contrato_id, total, moneda, fecha_pago, medio_pago")
      .eq("periodo", periodo)
      .is("anulado_at", null),
  ]);

  const cobrados = new Map((cobros ?? []).map((c) => [c.contrato_id, c]));
  const activos = contratos ?? [];
  const pendientes = activos.filter((c) => !cobrados.has(c.id));
  const totalCobrado = (cobros ?? []).reduce((s, c) => s + Number(c.total), 0);

  const mesAnterior = sumarMeses(periodo, -1);
  const mesSiguiente = sumarMeses(periodo, 1);

  return (
    <div>
      <Titulo>Cobros</Titulo>

      <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3">
        <Link href={`/cobros?periodo=${mesAnterior}`} className="boton-secundario px-3 py-1.5">←</Link>
        <div className="text-center">
          <div className="font-titulo text-lg font-bold capitalize">{nombreDelPeriodo(periodo)}</div>
          <div className="tabular text-xs text-stone-500">
            {formatearCorto(totalCobrado)} cobrados · {pendientes.length} pendientes
          </div>
        </div>
        <Link href={`/cobros?periodo=${mesSiguiente}`} className="boton-secundario px-3 py-1.5">→</Link>
      </div>

      {activos.length === 0 ? (
        <Vacio texto="No hay contratos activos." accion={{ href: "/contratos/nuevo", texto: "Cargar contrato" }} />
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 font-titulo text-lg font-bold">
              Sin cobrar ({pendientes.length})
            </h2>
            {pendientes.length === 0 ? (
              <p className="tarjeta text-sm text-stone-500">
                Está todo cobrado en {nombreDelPeriodo(periodo)}.
              </p>
            ) : (
              <ul className="space-y-2">
                {pendientes.map((c) => {
                  const propiedad = c.propiedades as unknown as { direccion: string; piso_depto: string | null } | null;
                  const inquilino = c.inquilinos as unknown as { nombre: string } | null;
                  const vence = vencimientoDelPeriodo(periodo, c.dia_vencimiento);
                  const vencido = vence < hoy;

                  return (
                    <li key={c.id}>
                      <Link
                        href={`/cobros/nuevo?contrato=${c.id}&periodo=${periodo}`}
                        className={`tarjeta flex items-center justify-between gap-4 hover:border-marca-300 ${
                          vencido ? "border-amber-200 bg-amber-50/50" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {propiedad?.direccion}
                            {propiedad?.piso_depto ? ` ${propiedad.piso_depto}` : ""}
                          </div>
                          <div className="truncate text-xs text-stone-500">
                            {inquilino?.nombre} · vencía el {formatearFecha(vence)}
                            {vencido && <span className="font-semibold text-amber-700"> · atrasado</span>}
                          </div>
                        </div>
                        <span className="tabular shrink-0 font-semibold">
                          {formatearMoneda(Number(c.monto_actual), c.moneda)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {cobros && cobros.length > 0 && (
            <section>
              <h2 className="mb-2 font-titulo text-lg font-bold">Cobrados ({cobros.length})</h2>
              <ul className="space-y-2">
                {cobros.map((c) => {
                  const contrato = activos.find((a) => a.id === c.contrato_id);
                  const propiedad = contrato?.propiedades as unknown as { direccion: string; piso_depto: string | null } | null;
                  return (
                    <li key={c.id}>
                      <Link href={`/cobros/${c.id}`} className="tarjeta flex items-center justify-between gap-4 hover:border-marca-300">
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {propiedad?.direccion ?? `Recibo N.º ${c.numero}`}
                            {propiedad?.piso_depto ? ` ${propiedad.piso_depto}` : ""}
                          </div>
                          <div className="text-xs text-stone-500">
                            Recibo N.º {c.numero} · {formatearFecha(c.fecha_pago)} ·{" "}
                            {etiqueta(c.medio_pago).toLowerCase()}
                          </div>
                        </div>
                        <span className="tabular shrink-0 font-semibold text-marca-700">
                          {formatearMoneda(Number(c.total), c.moneda)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
