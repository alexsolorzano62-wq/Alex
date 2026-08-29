import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requerirPerfil } from "@/lib/supabase/perfil";
import { anularCobro } from "@/app/acciones";
import { Dato } from "@/components/Ui";
import { formatearMoneda } from "@/lib/dinero";
import { formatearFecha, nombreDelPeriodo } from "@/lib/fechas";
import { etiqueta } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DetalleCobro({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const perfil = await requerirPerfil(supabase);

  const { data: cobro } = await supabase
    .from("cobros")
    .select(
      "*, cobro_conceptos(id, tipo, descripcion, monto, orden), contratos(id, inquilinos(nombre), propiedades(direccion, piso_depto))"
    )
    .eq("id", id)
    .single();

  if (!cobro) notFound();

  const contrato = cobro.contratos as unknown as {
    id: string;
    inquilinos: { nombre: string } | null;
    propiedades: { direccion: string; piso_depto: string | null } | null;
  } | null;

  const conceptos = ((cobro.cobro_conceptos ?? []) as {
    id: string; tipo: string; descripcion: string | null; monto: number; orden: number;
  }[]).sort((a, b) => a.orden - b.orden);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="titulo">Recibo N.º {cobro.numero}</h1>
          <p className="mt-1 text-sm text-stone-500 capitalize">
            {nombreDelPeriodo(cobro.periodo)}
          </p>
        </div>
        <a href={`/api/recibos/${id}`} target="_blank" rel="noopener" className="boton shrink-0">
          Descargar PDF
        </a>
      </div>

      {cobro.anulado_at && (
        <div className="tarjeta border-red-200 bg-red-50">
          <div className="font-semibold text-red-800">Recibo anulado</div>
          <p className="mt-1 text-sm text-red-700">{cobro.anulado_motivo}</p>
        </div>
      )}

      <section className="tarjeta">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Dato rotulo="Propiedad">
            {contrato && (
              <Link href={`/contratos/${contrato.id}`} className="hover:text-marca-700">
                {contrato.propiedades?.direccion}
                {contrato.propiedades?.piso_depto ? ` ${contrato.propiedades.piso_depto}` : ""}
              </Link>
            )}
          </Dato>
          <Dato rotulo="Inquilino">{contrato?.inquilinos?.nombre}</Dato>
          <Dato rotulo="Fecha de pago">{formatearFecha(cobro.fecha_pago)}</Dato>
          <Dato rotulo="Medio">{etiqueta(cobro.medio_pago)}</Dato>
          <Dato rotulo="Vencía">{formatearFecha(cobro.vencimiento)}</Dato>
          <Dato rotulo="Emisiones">{cobro.emisiones}</Dato>
        </dl>
      </section>

      <section className="tarjeta">
        <h2 className="font-titulo text-lg font-bold">Detalle</h2>
        <ul className="mt-3 divide-y divide-stone-100">
          {conceptos.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span>
                <span className="font-medium">{etiqueta(c.tipo)}</span>
                {c.descripcion && (
                  <span className="block text-xs text-stone-500">{c.descripcion}</span>
                )}
              </span>
              <span className="tabular shrink-0">
                {formatearMoneda(Number(c.monto), cobro.moneda)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t-2 border-stone-200 pt-3">
          <span className="font-titulo text-lg font-bold">Total</span>
          <span className="tabular font-titulo text-xl font-bold text-marca-700">
            {formatearMoneda(Number(cobro.total), cobro.moneda)}
          </span>
        </div>
      </section>

      {cobro.notas && (
        <section className="tarjeta">
          <h2 className="text-xs uppercase tracking-wide text-stone-500">Notas internas</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-stone-600">{cobro.notas}</p>
        </section>
      )}

      {perfil?.rol === "admin" && !cobro.anulado_at && (
        <section className="tarjeta border-red-200">
          <h2 className="font-titulo text-lg font-bold text-red-800">Anular</h2>
          <p className="mt-1 text-sm text-stone-600">
            Un recibo emitido no se edita. Anularlo lo deja en el historial marcado
            como anulado y libera el período para emitir otro.
          </p>
          <form action={anularCobro} className="mt-3 flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={id} />
            <div className="min-w-0 flex-1">
              <label className="etiqueta" htmlFor="motivo">Motivo</label>
              <input id="motivo" name="motivo" className="campo" required />
            </div>
            <button type="submit" className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800">
              Anular recibo
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
