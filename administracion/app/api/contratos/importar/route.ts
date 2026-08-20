import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/supabase/perfil";

// Migrar 95 contratos a mano son días de tipeo. Acá se sube el PDF y se
// devuelven los campos ya cargados, para revisar y confirmar — nunca para
// guardar a ciegas.
const DatosContrato = z.object({
  inquilino_nombre: z.string().describe("Nombre completo del locatario/inquilino"),
  inquilino_documento: z.string().describe("DNI o CUIT del inquilino; vacío si no figura"),
  propietario_nombre: z.string().describe("Nombre completo del locador/propietario"),
  direccion: z.string().describe("Dirección del inmueble sin piso ni departamento"),
  piso_depto: z.string().describe("Piso y departamento; vacío si no corresponde"),
  localidad: z.string().describe("Localidad del inmueble"),
  fecha_inicio: z.string().describe("Inicio de la locación en formato YYYY-MM-DD"),
  fecha_fin: z.string().describe("Fin de la locación en formato YYYY-MM-DD"),
  destino: z.enum(["vivienda", "comercial", "mixto", "otro"]),
  moneda: z.enum(["ARS", "USD"]),
  monto_inicial: z.number().describe("Alquiler mensual pactado, solo el número"),
  deposito_monto: z.number().describe("Depósito en garantía; 0 si no hay"),
  dia_vencimiento: z.number().describe("Día del mes en que vence el alquiler; 10 si no figura"),
  indice: z.enum(["ICL", "IPC", "UVA", "CASA_PROPIA", "FIJO", "SIN_AJUSTE"]),
  ajuste_frecuencia_meses: z.number().describe("Cada cuántos meses se actualiza"),
  ajuste_porcentaje_fijo: z.number().describe("Porcentaje pactado si el ajuste es fijo; 0 si no"),
  punitorio_tipo: z.enum(["porcentaje_diario", "monto_fijo_diario", "ninguno"]),
  punitorio_valor: z.number().describe("Valor del punitorio diario; 0 si no hay"),
  garantes: z.string().describe("Nombres de los garantes o fiadores, separados por coma"),
  observaciones: z.string().describe("Cláusulas particulares que convenga tener a la vista"),
});

const INSTRUCCIONES = `Sos un asistente de una inmobiliaria argentina que administra alquileres.
Te paso un contrato de locación y tenés que extraer los datos para cargarlo en el sistema.

Reglas:
- Las fechas siempre en formato YYYY-MM-DD.
- Los montos, solo el número, sin símbolo ni separadores de miles.
- El índice de actualización: si el contrato menciona el ICL o el Índice para
  Contratos de Locación del BCRA, es ICL. Si menciona el IPC o el INDEC, es IPC.
  Si pacta un porcentaje fijo de aumento, es FIJO y cargá el porcentaje.
  Si no menciona actualización, es SIN_AJUSTE.
- Si un dato no figura en el contrato, devolvé cadena vacía o 0 según el tipo.
  No inventes ni completes con valores probables: quien carga va a revisar.`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sesión vencida." }, { status: 401 });
  }
  const perfil = await getPerfil(supabase, user.id);
  if (!perfil) {
    return NextResponse.json({ error: "Tu usuario no forma parte del equipo." }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Falta configurar ANTHROPIC_API_KEY. Sin eso, la carga es manual." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const archivo = formData.get("contrato");

  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: "No llegó ningún archivo." }, { status: 400 });
  }
  if (archivo.type !== "application/pdf") {
    return NextResponse.json({ error: "El contrato tiene que ser un PDF." }, { status: 400 });
  }
  // La API acepta hasta 32 MB por pedido; frenamos antes para no gastar al pedo.
  if (archivo.size > 25 * 1024 * 1024) {
    return NextResponse.json(
      { error: "El PDF pesa más de 25 MB. Escaneálo en menor calidad." },
      { status: 400 }
    );
  }

  const base64 = Buffer.from(await archivo.arrayBuffer()).toString("base64");
  const client = new Anthropic();

  try {
    const respuesta = await client.messages.parse({
      model: process.env.ANTHROPIC_MODEL ?? "claude-opus-5",
      max_tokens: 16000,
      system: INSTRUCCIONES,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            },
            { type: "text", text: "Extraé los datos de este contrato." },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(DatosContrato) },
    });

    if (!respuesta.parsed_output) {
      return NextResponse.json(
        { error: "No se pudieron leer los datos del contrato. Cargalo a mano." },
        { status: 422 }
      );
    }

    return NextResponse.json({ datos: respuesta.parsed_output });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `No se pudo leer el contrato: ${mensaje}` },
      { status: 502 }
    );
  }
}
