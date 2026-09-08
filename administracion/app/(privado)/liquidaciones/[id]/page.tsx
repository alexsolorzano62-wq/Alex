import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requerirPerfil } from "@/lib/supabase/perfil";
import { emitirLiquidacion, registrarPagoLiquidacion, anularLiquidacion } from "@/app/acciones";
import { Estado, Dato } from "@/components/Ui";
import { FormularioPagoLiquidacion } from "@/components/FormularioPagoLiquidacion";
import { formatearMoneda } from "@/lib/dinero";
import { formatearFecha, nombreDelPeriodo, hoyISO } from "@/lib/fechas";
import { etiqueta } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DetalleLiquidacion({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const perfil = await requerirPerfil(supabase);

  const { data: liquidacion } = await supabase
    .from("liquidaciones")
    .select(
      "*, propietarios(id, nombre, forma_cobro, cbu, alias_cbu), liquidacion_detalle(id, tipo, descripcion, monto_bruto, honorarios_porcentaje, honorarios_monto, neto, orden)"
    )
    .eq("id", id)
    .single();

  if (!liquidacion) notFound();

  const propietario = liquidacion.propietarios as unknown as {
    id: string; nombre: string; forma_cobro: string; cbu: string | null; alias_cbu: string | null;
  } | null;

  const detalle = ((liquidacion.liquidacion_detalle ?? []) as {
    id: string; tipo: string; descripcion: string; monto_bruto: number;
    honorarios_porcentaje: number | null; honorarios_monto: number; neto: number; orden: number;
  }[]).sort((a, b) => a.orden - b.orden);

  const moneda = liquidacion.moneda as "ARS" | "USD";
  const esBorrador = liquidacion.estado === "borrador";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="titulo">Liquidación N.º {liquidacion.numero}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {propietario && (
              <Link href={`/propietarios/${propietario.id}`} className="hover:text-marca-700">
                {propietario.nombre}
              </Link>
            )}
            {" · "}
            <span className="capitalize">{nombreDelPeriodo(liquidacion.periodo)}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Estado valor={liquidacion.estado} />
          {!esBorrador && (
            <a href={`/api/liquidaciones/${id}`} target="_blank" rel="noopener" className="boton">
              PDF
            </a>
          )}
        </div>
      </div>

      {liquidacion.anulado_at && (
        <div className="tarjeta border-red-200 bg-red-50">
          <div className="font-semibold text-red-800">Liquidación anulada</div>
          <p className="mt-1 text-sm text-red-700">{liquidacion.anulado_motivo}</p>
        </div>
      )}

      <section className="tarjeta">
        <h2 className="font-titulo text-lg font-bold">Detalle</h2>
        <ul className="mt-3 divide-y divide-stone-100">
          {detalle.map((r) => (
            <li key={r.id} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 text-sm">
                  <span className="block">{r.descripcion}</span>
                  {r.honorarios_porcentaje != null && (
                    <span className="text-xs text-stone-500">
                      Honorarios {r.honorarios_porcentaje}% ·{" "}
                      −{formatearMoneda(Number(r.honorarios_monto), moneda)}
                    </span>
                  )}
                </span>
                <span className="tabular shrink-0 text-right text-sm">
                  <span className={`block ${Number(r.monto_bruto) < 0 ? "text-red-700" : ""}`}>
                    {formatearMoneda(Number(r.monto_bruto), moneda)}
                  </span>
                  {r.honorarios_porcentaje != null && (
                    <span className="block text-xs font-semibold text-stone-700">
                      neto {formatearMoneda(Number(r.neto), moneda)}
                    </span>
                  )}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1.5 border-t-2 border-stone-200 pt-4 text-sm">
          {[
            ["Cobrado", Number(liquidacion.total_cobrado), false],
            ["Honorarios de administración", -Number(liquidacion.total_honorarios), true],
            ["Gastos", -Number(liquidacion.total_gastos), true],
            ["Ajustes", Number(liquidacion.total_ajustes), false],
          ].map(([rotulo, monto, resta]) =>
            monto === 0 && resta ? null : (
              <div key={rotulo as string} className="flex justify-between gap-3">
                <dt className="text-stone-600">{rotulo as string}</dt>
                <dd className="tabular">{formatearMoneda(monto as number, moneda)}</dd>
              </div>
            )
          )}
          <div className="flex justify-between gap-3 border-t border-stone-200 pt-2">
            <dt className="font-titulo text-lg font-bold">Neto a transferir</dt>
            <dd className="tabular font-titulo text-xl font-bold text-marca-700">
              {formatearMoneda(Number(liquidacion.neto_a_pagar), moneda)}
            </dd>
          </div>
        </dl>
      </section>

      {esBorrador ? (
        <section className="tarjeta border-marca-200 bg-marca-50/50">
          <h2 className="font-titulo text-lg font-bold">Emitir</h2>
          <p className="mt-1 text-sm text-stone-600">
            Al emitirla, los números quedan congelados y el PDF pasa a ser el
            documento que ve el propietario. Después solo se puede anular, no editar.
          </p>
          <form action={emitirLiquidacion} className="mt-3">
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="boton">Emitir liquidación</button>
          </form>
        </section>
      ) : liquidacion.estado === "emitida" ? (
        <section className="tarjeta">
          <h2 className="font-titulo text-lg font-bold">Registrar el pago</h2>
          <p className="mt-1 text-sm text-stone-600">
            {propietario?.forma_cobro === "efectivo"
              ? "Este propietario cobra en efectivo: dejá registrada su conformidad."
              : `Transferir a ${propietario?.alias_cbu ?? propietario?.cbu ?? "la cuenta del propietario"}.`}
          </p>
          <FormularioPagoLiquidacion
            accion={registrarPagoLiquidacion}
            id={id}
            formaCobro={propietario?.forma_cobro ?? "transferencia"}
            hoy={hoyISO()}
          />
        </section>
      ) : liquidacion.estado === "pagada" ? (
        <section className="tarjeta border-marca-200">
          <h2 className="font-titulo text-lg font-bold">Pagada</h2>
          <dl className="mt-3 grid gap-4 sm:grid-cols-2">
            <Dato rotulo="Método">{etiqueta(liquidacion.metodo_pago)}</Dato>
            <Dato rotulo="Fecha">
              {liquidacion.fecha_pago ? formatearFecha(liquidacion.fecha_pago) : null}
            </Dato>
            <Dato rotulo="Comprobante">{liquidacion.comprobante_url}</Dato>
            <Dato rotulo="Recibido por">{liquidacion.recibido_por}</Dato>
          </dl>
          {liquidacion.conformidad && (
            <p className="mt-3 border-t border-stone-100 pt-3 text-sm text-stone-600">
              <span className="text-xs uppercase tracking-wide text-stone-500">Conformidad</span>
              <br />
              {liquidacion.conformidad}
            </p>
          )}
        </section>
      ) : null}

      {perfil?.rol === "admin" && !liquidacion.anulado_at && (
        <section className="tarjeta border-red-200">
          <h2 className="font-titulo text-lg font-bold text-red-800">Anular</h2>
          <form action={anularLiquidacion} className="mt-3 flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={id} />
            <div className="min-w-0 flex-1">
              <label className="etiqueta" htmlFor="motivo">Motivo</label>
              <input id="motivo" name="motivo" className="campo" required />
            </div>
            <button type="submit" className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800">
              Anular
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
