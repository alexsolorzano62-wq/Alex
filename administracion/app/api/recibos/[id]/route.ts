import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/supabase/perfil";
import { generarRecibo } from "@/lib/pdf/recibo";

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

  const { data: cobro } = await supabase
    .from("cobros")
    .select(
      "*, cobro_conceptos(tipo, descripcion, monto, orden), contratos(inquilinos(nombre, documento), propiedades(direccion, piso_depto, propietarios(nombre)))"
    )
    .eq("id", id)
    .single();

  if (!cobro) return NextResponse.json({ error: "No existe el recibo." }, { status: 404 });

  const contrato = cobro.contratos as unknown as {
    inquilinos: { nombre: string; documento: string | null } | null;
    propiedades: {
      direccion: string;
      piso_depto: string | null;
      propietarios: { nombre: string } | null;
    } | null;
  } | null;

  const conceptos = ((cobro.cobro_conceptos ?? []) as {
    tipo: string; descripcion: string | null; monto: number; orden: number;
  }[])
    .sort((a, b) => a.orden - b.orden)
    .map((c) => ({ tipo: c.tipo, descripcion: c.descripcion, monto: Number(c.monto) }));

  const pdf = await generarRecibo({
    numero: Number(cobro.numero),
    periodo: cobro.periodo,
    fechaPago: cobro.fecha_pago,
    vencimiento: cobro.vencimiento,
    medioPago: cobro.medio_pago,
    moneda: cobro.moneda,
    total: Number(cobro.total),
    inquilino: contrato?.inquilinos?.nombre ?? "",
    documentoInquilino: contrato?.inquilinos?.documento ?? null,
    propiedad: `${contrato?.propiedades?.direccion ?? ""}${
      contrato?.propiedades?.piso_depto ? ` ${contrato.propiedades.piso_depto}` : ""
    }`,
    propietario: contrato?.propiedades?.propietarios?.nombre ?? "",
    conceptos,
    esDuplicado: Number(cobro.emisiones) > 1,
    anulado: cobro.anulado_at != null,
  });

  // Cada descarga cuenta como una emisión: de la segunda en adelante el PDF
  // sale marcado como duplicado.
  await supabase
    .from("cobros")
    .update({ emisiones: Number(cobro.emisiones) + 1 })
    .eq("id", id);

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recibo-${cobro.numero}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
