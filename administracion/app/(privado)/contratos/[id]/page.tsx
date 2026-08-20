import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Estado, Dato } from "@/components/Ui";
import { formatearMoneda } from "@/lib/dinero";
import { formatearFecha, nombreDelPeriodo, primerDiaDelMes, hoyISO } from "@/lib/fechas";
import { etiqueta, INDICES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DetalleContrato({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: contrato }, { data: cobros }, { data: ajustes }] = await Promise.all([
    supabase
      .from("contratos")
      .select(
        "*, inquilinos(id, nombre, telefono), propiedades(id, direccion, piso_depto, localidad, propietarios(id, nombre))"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("cobros")
      .select("id, numero, periodo, fecha_pago, total, moneda, medio_pago, anulado_at")
      .eq("contrato_id", id)
      .order("periodo", { ascending: false })
      .limit(12),
    supabase
      .from("ajustes")
      .select("id, fecha_aplicacion, indice, monto_anterior, monto_nuevo, coeficiente")
      .eq("contrato_id", id)
      .order("fecha_aplicacion", { ascending: false }),
  ]);

  if (!contrato) notFound();

  const inquilino = contrato.inquilinos as unknown as
    { id: string; nombre: string; telefono: string | null } | null;
  const propiedad = contrato.propiedades as unknown as
    { id: string; direccion: string; piso_depto: string | null; localidad: string | null;
      propietarios: { id: string; nombre: string } | null } | null;

  const periodoActual = primerDiaDelMes(hoyISO());
  const cobradoEsteMes = (cobros ?? []).some(
    (c) => c.periodo === periodoActual && !c.anulado_at
  );
  const ajustePendiente =
    contrato.estado === "activo" &&
    contrato.fecha_proximo_ajuste != null &&
    contrato.fecha_proximo_ajuste <= hoyISO();

  const indiceTexto = INDICES.find((i) => i.valor === contrato.indice)?.etiqueta ?? contrato.indice;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="titulo truncate">
            {propiedad?.direccion}
            {propiedad?.piso_depto ? ` ${propiedad.piso_depto}` : ""}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {inquilino && (
              <Link href={`/inquilinos/${inquilino.id}`} className="hover:text-marca-700">
                {inquilino.nombre}
              </Link>
            )}
            {propiedad?.propietarios && (
              <>
                {" · propietario "}
                <Link href={`/propietarios/${propiedad.propietarios.id}`} className="hover:text-marca-700">
                  {propiedad.propietarios.nombre}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Estado valor={contrato.estado} />
          <Link href={`/contratos/${id}/editar`} className="boton-secundario">Editar</Link>
        </div>
      </div>

      {(ajustePendiente || (!cobradoEsteMes && contrato.estado === "activo")) && (
        <div className="flex flex-wrap gap-3">
          {ajustePendiente && (
            <Link href="/ajustes" className="boton bg-marca-700">
              Tiene aumento pendiente
            </Link>
          )}
          {!cobradoEsteMes && contrato.estado === "activo" && (
            <Link href={`/cobros/nuevo?contrato=${id}`} className="boton">
              Cobrar {nombreDelPeriodo(periodoActual)}
            </Link>
          )}
        </div>
      )}

      <section className="tarjeta">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <div className="text-xs uppercase tracking-wide text-stone-500">Alquiler vigente</div>
            <div className="tabular mt-1 font-titulo text-3xl font-bold text-marca-700">
              {formatearMoneda(Number(contrato.monto_actual), contrato.moneda)}
            </div>
            {Number(contrato.monto_inicial) !== Number(contrato.monto_actual) && (
              <div className="mt-1 text-xs text-stone-500">
                Empezó en {formatearMoneda(Number(contrato.monto_inicial), contrato.moneda)}
              </div>
            )}
          </div>
          <Dato rotulo="Vence cada mes el">día {contrato.dia_vencimiento}</Dato>
          <Dato rotulo="Honorarios">{contrato.honorarios_porcentaje}%</Dato>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="tarjeta">
          <h2 className="font-titulo text-lg font-bold">El contrato</h2>
          <dl className="mt-3 grid gap-4 sm:grid-cols-2">
            <Dato rotulo="Desde">{formatearFecha(contrato.fecha_inicio)}</Dato>
            <Dato rotulo="Hasta">{formatearFecha(contrato.fecha_fin)}</Dato>
            <Dato rotulo="Destino">{etiqueta(contrato.destino)}</Dato>
            <Dato rotulo="Depósito">
              {contrato.deposito_monto
                ? `${formatearMoneda(Number(contrato.deposito_monto), contrato.moneda)} (${etiqueta(contrato.deposito_estado)})`
                : null}
            </Dato>
            <Dato rotulo="Garantes">{contrato.garantes}</Dato>
          </dl>
          {contrato.observaciones && (
            <p className="mt-4 whitespace-pre-wrap border-t border-stone-100 pt-4 text-sm text-stone-600">
              {contrato.observaciones}
            </p>
          )}
        </section>

        <section className="tarjeta">
          <h2 className="font-titulo text-lg font-bold">Ajustes y punitorios</h2>
          <dl className="mt-3 grid gap-4 sm:grid-cols-2">
            <Dato rotulo="Índice">{indiceTexto}</Dato>
            <Dato rotulo="Frecuencia">cada {contrato.ajuste_frecuencia_meses} meses</Dato>
            <Dato rotulo="Último ajuste">
              {contrato.fecha_ultimo_ajuste ? formatearFecha(contrato.fecha_ultimo_ajuste) : "todavía ninguno"}
            </Dato>
            <Dato rotulo="Próximo ajuste">
              {contrato.fecha_proximo_ajuste ? formatearFecha(contrato.fecha_proximo_ajuste) : "no ajusta"}
            </Dato>
            <Dato rotulo="Punitorios">
              {contrato.punitorio_tipo === "ninguno"
                ? "sin punitorios"
                : contrato.punitorio_tipo === "porcentaje_diario"
                ? `${contrato.punitorio_valor}% por día`
                : `${formatearMoneda(Number(contrato.punitorio_valor), contrato.moneda)} por día`}
            </Dato>
            <Dato rotulo="Días de gracia">{contrato.punitorio_dias_gracia}</Dato>
          </dl>
        </section>
      </div>

      <section className="tarjeta">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-titulo text-lg font-bold">Cobros</h2>
          <Link href={`/cobros/nuevo?contrato=${id}`} className="text-sm font-semibold text-marca-700">
            Registrar cobro →
          </Link>
        </div>
        {!cobros || cobros.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Todavía no se cobró ningún mes.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {cobros.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/cobros/${c.id}`} className="min-w-0 text-sm hover:text-marca-700">
                  <span className={`block font-medium capitalize ${c.anulado_at ? "text-stone-400 line-through" : ""}`}>
                    {nombreDelPeriodo(c.periodo)}
                  </span>
                  <span className="text-xs text-stone-500">
                    Recibo N.º {c.numero} · pagado el {formatearFecha(c.fecha_pago)} en{" "}
                    {etiqueta(c.medio_pago).toLowerCase()}
                  </span>
                </Link>
                <span className={`tabular shrink-0 text-sm font-semibold ${c.anulado_at ? "text-stone-400 line-through" : ""}`}>
                  {formatearMoneda(Number(c.total), c.moneda)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {ajustes && ajustes.length > 0 && (
        <section className="tarjeta">
          <h2 className="font-titulo text-lg font-bold">Historial de aumentos</h2>
          <ul className="mt-3 divide-y divide-stone-100">
            {ajustes.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-stone-600">
                  {formatearFecha(a.fecha_aplicacion)} · {a.indice}
                </span>
                <span className="tabular">
                  {formatearMoneda(Number(a.monto_anterior), contrato.moneda)}
                  <span className="mx-2 text-stone-400">→</span>
                  <strong>{formatearMoneda(Number(a.monto_nuevo), contrato.moneda)}</strong>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
