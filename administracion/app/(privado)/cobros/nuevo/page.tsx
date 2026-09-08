import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registrarCobro } from "@/app/acciones";
import { Titulo } from "@/components/Ui";
import { FormularioCobro } from "@/components/FormularioCobro";
import { hoyISO, primerDiaDelMes, vencimientoHabilDelPeriodo } from "@/lib/fechas";
import { feriadosDelAnio } from "@/lib/feriados";
import type { TipoPunitorio } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NuevoCobro({
  searchParams,
}: {
  searchParams: Promise<{ contrato?: string; periodo?: string }>;
}) {
  const { contrato: contratoId, periodo: periodoParam } = await searchParams;
  if (!contratoId) notFound();

  const supabase = await createClient();
  const hoy = hoyISO();
  const periodo = primerDiaDelMes(periodoParam ?? hoy);

  const { data: contrato } = await supabase
    .from("contratos")
    .select(
      "id, monto_actual, moneda, dia_vencimiento, punitorio_tipo, punitorio_valor, punitorio_dias_gracia, propiedad_id, inquilinos(nombre), propiedades(direccion, piso_depto)"
    )
    .eq("id", contratoId)
    .single();

  if (!contrato) notFound();

  // Gastos que ya se le adelantaron al inquilino y todavía no se le cobraron.
  const { data: gastos } = await supabase
    .from("gastos")
    .select("id, descripcion, monto, tipo, fecha")
    .eq("propiedad_id", contrato.propiedad_id)
    .eq("a_cargo_de", "inquilino")
    .is("cobro_id", null)
    .is("deleted_at", null)
    .order("fecha");

  // Lo que esta unidad paga todos los meses además del alquiler.
  const { data: cargos } = await supabase
    .from("contrato_cargos")
    .select("id, tipo, descripcion, monto")
    .eq("contrato_id", contratoId)
    .eq("activo", true)
    .is("deleted_at", null)
    .order("descripcion");

  // Cómo quedó el mes pasado. Alcanza con el último recibo: el saldo se guarda
  // acumulado, no como movimiento.
  const { data: ultimo } = await supabase
    .from("cobros")
    .select("saldo_resultante")
    .eq("contrato_id", contratoId)
    .is("anulado_at", null)
    .lt("periodo", periodo)
    .order("periodo", { ascending: false })
    .limit(1)
    .maybeSingle();

  const feriados = await feriadosDelAnio(supabase, Number(periodo.slice(0, 4)));

  const propiedad = contrato.propiedades as unknown as
    { direccion: string; piso_depto: string | null } | null;
  const inquilino = contrato.inquilinos as unknown as { nombre: string } | null;

  return (
    <div className="mx-auto max-w-2xl">
      <Titulo>Registrar cobro</Titulo>
      <FormularioCobro
        accion={registrarCobro}
        periodo={periodo}
        hoy={hoy}
        vencimiento={vencimientoHabilDelPeriodo(periodo, contrato.dia_vencimiento, feriados)}
        gastosPendientes={(gastos ?? []).map((g) => ({ ...g, monto: Number(g.monto) }))}
        cargosFijos={(cargos ?? []).map((c) => ({ ...c, monto: Number(c.monto) }))}
        saldoAnterior={Number(ultimo?.saldo_resultante ?? 0)}
        contrato={{
          id: contrato.id,
          monto_actual: Number(contrato.monto_actual),
          moneda: contrato.moneda,
          punitorio_tipo: contrato.punitorio_tipo as TipoPunitorio,
          punitorio_valor: Number(contrato.punitorio_valor),
          punitorio_dias_gracia: Number(contrato.punitorio_dias_gracia),
          inquilino: inquilino?.nombre ?? "",
          direccion: `${propiedad?.direccion ?? ""}${propiedad?.piso_depto ? ` ${propiedad.piso_depto}` : ""}`,
        }}
      />
    </div>
  );
}
