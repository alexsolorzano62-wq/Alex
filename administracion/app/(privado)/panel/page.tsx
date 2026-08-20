import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatearCorto, formatearMoneda } from "@/lib/dinero";
import { hoyISO, primerDiaDelMes, nombreDelPeriodo, sumarMeses, formatearFecha, vencimientoDelPeriodo } from "@/lib/fechas";

export const dynamic = "force-dynamic";

type ContratoPanel = {
  id: string;
  monto_actual: number;
  moneda: "ARS" | "USD";
  dia_vencimiento: number;
  fecha_fin: string;
  fecha_proximo_ajuste: string | null;
  honorarios_porcentaje: number;
  inquilinos: { nombre: string } | null;
  propiedades: { direccion: string; piso_depto: string | null } | null;
};

function Metrica({
  titulo, valor, detalle, href, tono = "normal",
}: {
  titulo: string;
  valor: string;
  detalle?: string;
  href?: string;
  tono?: "normal" | "alerta" | "marca";
}) {
  const colores =
    tono === "alerta"
      ? "border-amber-200 bg-amber-50"
      : tono === "marca"
      ? "border-marca-200 bg-marca-50"
      : "border-stone-200 bg-white";

  const contenido = (
    <div className={`rounded-xl border p-4 shadow-sm ${colores}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {titulo}
      </div>
      <div className="tabular mt-1.5 font-titulo text-2xl font-bold text-stone-900">
        {valor}
      </div>
      {detalle && <div className="mt-1 text-xs text-stone-500">{detalle}</div>}
    </div>
  );

  return href ? <Link href={href} className="block">{contenido}</Link> : contenido;
}

export default async function Panel() {
  const supabase = await createClient();

  const hoy = hoyISO();
  const periodo = primerDiaDelMes(hoy);
  const finDePeriodo = sumarMeses(periodo, 1);

  const [
    { data: contratos },
    { data: cobrosDelMes },
    { count: propiedadesTotal },
    { data: gastosPendientes },
    { data: liquidacionesDelMes },
  ] = await Promise.all([
    supabase
      .from("contratos")
      .select(
        "id, monto_actual, moneda, dia_vencimiento, fecha_fin, fecha_proximo_ajuste, honorarios_porcentaje, inquilinos(nombre), propiedades(direccion, piso_depto)"
      )
      .eq("estado", "activo")
      .is("deleted_at", null),
    supabase
      .from("cobros")
      .select("id, total, moneda, contrato_id")
      .eq("periodo", periodo)
      .is("anulado_at", null),
    supabase
      .from("propiedades")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("gastos")
      .select("id, monto, a_cargo_de")
      .is("cobro_id", null)
      .is("liquidacion_id", null)
      .is("deleted_at", null),
    supabase
      .from("liquidaciones")
      .select("id, estado, neto_a_pagar")
      .eq("periodo", periodo)
      .is("anulado_at", null),
  ]);

  const activos = (contratos ?? []) as unknown as ContratoPanel[];
  const cobros = cobrosDelMes ?? [];

  // Lo que debería entrar este mes, según lo que dice cada contrato hoy.
  const esperadoARS = activos
    .filter((c) => c.moneda === "ARS")
    .reduce((suma, c) => suma + Number(c.monto_actual), 0);

  const cobradoARS = cobros
    .filter((c) => c.moneda === "ARS")
    .reduce((suma, c) => suma + Number(c.total), 0);

  const contratosCobrados = new Set(cobros.map((c) => c.contrato_id));
  const pendientes = activos.filter((c) => !contratosCobrados.has(c.id));

  // Honorarios devengados: se calculan sobre lo efectivamente cobrado, contrato
  // por contrato, igual que en la liquidación.
  const porcentajePorContrato = new Map(
    activos.map((c) => [c.id, Number(c.honorarios_porcentaje)])
  );
  const honorarios = cobros
    .filter((c) => c.moneda === "ARS")
    .reduce(
      (suma, c) =>
        suma + Number(c.total) * ((porcentajePorContrato.get(c.contrato_id) ?? 0) / 100),
      0
    );

  const tocanAjuste = activos.filter(
    (c) => c.fecha_proximo_ajuste && c.fecha_proximo_ajuste < finDePeriodo
  );

  const enTresMeses = sumarMeses(hoy, 3);
  const porVencer = activos
    .filter((c) => c.fecha_fin <= enTresMeses)
    .sort((a, b) => a.fecha_fin.localeCompare(b.fecha_fin));

  const gastosACobrar = (gastosPendientes ?? []).filter((g) => g.a_cargo_de === "inquilino");
  const gastosADescontar = (gastosPendientes ?? []).filter((g) => g.a_cargo_de === "propietario");

  const liquidaciones = liquidacionesDelMes ?? [];
  const liquidacionesPagadas = liquidaciones.filter((l) => l.estado === "pagada").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo">Resumen de {nombreDelPeriodo(periodo)}</h1>
        <p className="mt-1 text-sm text-stone-500">
          {activos.length} contratos activos sobre {propiedadesTotal ?? 0} propiedades.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metrica
          titulo="Cobrado"
          valor={formatearCorto(cobradoARS)}
          detalle={`${cobros.length} de ${activos.length} contratos`}
          tono="marca"
          href="/cobros"
        />
        <Metrica
          titulo="Falta cobrar"
          valor={formatearCorto(Math.max(0, esperadoARS - cobradoARS))}
          detalle={`${pendientes.length} contratos sin recibo`}
          tono={pendientes.length > 0 ? "alerta" : "normal"}
          href="/cobros"
        />
        <Metrica
          titulo="Honorarios"
          valor={formatearCorto(honorarios)}
          detalle="sobre lo cobrado hasta hoy"
        />
        <Metrica
          titulo="Liquidaciones"
          valor={`${liquidacionesPagadas}/${liquidaciones.length}`}
          detalle="pagadas este mes"
          href="/liquidaciones"
        />
      </div>

      {tocanAjuste.length > 0 && (
        <section className="tarjeta border-marca-200 bg-marca-50/40">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-titulo text-lg font-bold">
                {tocanAjuste.length} contratos con aumento pendiente
              </h2>
              <p className="mt-0.5 text-sm text-stone-600">
                Cumplieron el período de ajuste. Revisalos antes de emitir los recibos del mes.
              </p>
            </div>
            <Link href="/ajustes" className="boton shrink-0">Ver aumentos</Link>
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="tarjeta">
          <h2 className="font-titulo text-lg font-bold">Sin cobrar este mes</h2>
          {pendientes.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">
              Está todo cobrado. No queda ningún contrato sin recibo.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-stone-100">
              {pendientes.slice(0, 8).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/contratos/${c.id}`} className="block truncate text-sm font-medium hover:text-marca-700">
                      {c.propiedades?.direccion}
                      {c.propiedades?.piso_depto ? ` ${c.propiedades.piso_depto}` : ""}
                    </Link>
                    <div className="truncate text-xs text-stone-500">
                      {c.inquilinos?.nombre} · vence el{" "}
                      {formatearFecha(vencimientoDelPeriodo(periodo, c.dia_vencimiento))}
                    </div>
                  </div>
                  <span className="tabular shrink-0 text-sm font-semibold">
                    {formatearMoneda(Number(c.monto_actual), c.moneda)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {pendientes.length > 8 && (
            <Link href="/cobros" className="mt-3 block text-sm font-semibold text-marca-700">
              Ver los {pendientes.length} pendientes →
            </Link>
          )}
        </section>

        <div className="space-y-4">
          <section className="tarjeta">
            <h2 className="font-titulo text-lg font-bold">Gastos sin imputar</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-stone-50 p-3">
                <div className="text-xs text-stone-500">A cobrar al inquilino</div>
                <div className="tabular mt-1 font-semibold">
                  {formatearCorto(gastosACobrar.reduce((s, g) => s + Number(g.monto), 0))}
                </div>
                <div className="text-xs text-stone-400">{gastosACobrar.length} gastos</div>
              </div>
              <div className="rounded-lg bg-stone-50 p-3">
                <div className="text-xs text-stone-500">A descontar al propietario</div>
                <div className="tabular mt-1 font-semibold">
                  {formatearCorto(gastosADescontar.reduce((s, g) => s + Number(g.monto), 0))}
                </div>
                <div className="text-xs text-stone-400">{gastosADescontar.length} gastos</div>
              </div>
            </div>
            <Link href="/gastos" className="mt-3 block text-sm font-semibold text-marca-700">
              Ver gastos →
            </Link>
          </section>

          <section className="tarjeta">
            <h2 className="font-titulo text-lg font-bold">Contratos por vencer</h2>
            {porVencer.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">
                Ninguno vence en los próximos tres meses.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-stone-100">
                {porVencer.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                    <Link href={`/contratos/${c.id}`} className="min-w-0 truncate text-sm hover:text-marca-700">
                      {c.propiedades?.direccion} · {c.inquilinos?.nombre}
                    </Link>
                    <span className="tabular shrink-0 text-xs text-stone-500">
                      {formatearFecha(c.fecha_fin)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
