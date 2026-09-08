import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/supabase/perfil";
import { generarLiquidacion } from "@/lib/pdf/liquidacion";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesión vencida." }, { status: 401 });

  const perfil = await getPerfil(supabase, user.id);
  if (!perfil) return NextResponse.json({ error: "Sin acceso." }, { status: 403 });

  const { data: liquidacion } = await supabase
    .from("liquidaciones")
    .select("*, propietarios(nombre, documento), liquidacion_detalle(descripcion, monto_bruto, honorarios_porcentaje, honorarios_monto, neto, orden)")
    .eq("id", id)
    .single();

  if (!liquidacion) {
    return NextResponse.json({ error: "No existe la liquidación." }, { status: 404 });
  }
  if (liquidacion.estado === "borrador") {
    return NextResponse.json(
      { error: "La liquidación todavía es un borrador: emitila antes de imprimirla." },
      { status: 409 }
    );
  }

  const propietario = liquidacion.propietarios as unknown as
    { nombre: string; documento: string | null } | null;

  const detalle = ((liquidacion.liquidacion_detalle ?? []) as {
    descripcion: string; monto_bruto: number; honorarios_porcentaje: number | null;
    honorarios_monto: number; neto: number; orden: number;
  }[])
    .sort((a, b) => a.orden - b.orden)
    .map((r) => ({
      descripcion: r.descripcion,
      montoBruto: Number(r.monto_bruto),
      honorariosPorcentaje: r.honorarios_porcentaje != null ? Number(r.honorarios_porcentaje) : null,
      honorariosMonto: Number(r.honorarios_monto),
      neto: Number(r.neto),
    }));

  const pdf = await generarLiquidacion({
    numero: Number(liquidacion.numero),
    periodo: liquidacion.periodo,
    moneda: liquidacion.moneda,
    propietario: propietario?.nombre ?? "",
    documento: propietario?.documento ?? null,
    totalCobrado: Number(liquidacion.total_cobrado),
    totalHonorarios: Number(liquidacion.total_honorarios),
    totalGastos: Number(liquidacion.total_gastos),
    totalAjustes: Number(liquidacion.total_ajustes),
    netoAPagar: Number(liquidacion.neto_a_pagar),
    detalle,
    metodoPago: liquidacion.metodo_pago,
    fechaPago: liquidacion.fecha_pago,
    conformidad: liquidacion.conformidad,
    anulada: liquidacion.anulado_at != null,
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="liquidacion-${liquidacion.numero}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
