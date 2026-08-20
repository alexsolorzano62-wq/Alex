import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/supabase/perfil";
import { createAdminClient } from "@/lib/supabase/admin";

// Fuentes oficiales. El ICL es la serie diaria del BCRA (variable 40 de la API
// de Estadísticas Monetarias v4.0); el IPC sale del catálogo de series de
// tiempo del Estado, que publica el índice del INDEC.
const FUENTES: Record<string, (desde: string) => Promise<{ fecha: string; valor: number }[]>> = {
  ICL: async (desde) => {
    const url = `https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/40?desde=${desde}&limit=3000`;
    const respuesta = await fetch(url, { cache: "no-store" });
    if (!respuesta.ok) throw new Error(`El BCRA respondió ${respuesta.status}`);

    const json = await respuesta.json();
    const filas = (json?.results ?? []) as { fecha: string; valor: number }[];
    return filas
      .filter((f) => f?.fecha && Number.isFinite(Number(f.valor)))
      .map((f) => ({ fecha: f.fecha, valor: Number(f.valor) }));
  },

  IPC: async (desde) => {
    const url = `https://apis.datos.gob.ar/series/api/series/?ids=148.3_INIVELNAL_DICI_M_26&start_date=${desde}&limit=1000&format=json`;
    const respuesta = await fetch(url, { cache: "no-store" });
    if (!respuesta.ok) throw new Error(`La API de series respondió ${respuesta.status}`);

    const json = await respuesta.json();
    const filas = (json?.data ?? []) as [string, number][];
    return filas
      .filter(([fecha, valor]) => fecha && Number.isFinite(Number(valor)))
      .map(([fecha, valor]) => ({ fecha: fecha.slice(0, 10), valor: Number(valor) }));
  },
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesión vencida." }, { status: 401 });

  const perfil = await getPerfil(supabase, user.id);
  if (!perfil) return NextResponse.json({ error: "Sin acceso." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const indice = (searchParams.get("indice") ?? "ICL").toUpperCase();
  const fuente = FUENTES[indice];

  if (!fuente) {
    return NextResponse.json(
      { error: `No hay descarga automática para ${indice}. Cargalo a mano.` },
      { status: 400 }
    );
  }

  // Solo se pide lo que falta: desde el último día guardado en adelante.
  const { data: ultimo } = await supabase
    .from("indices_valores")
    .select("fecha")
    .eq("indice", indice)
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  const desde = ultimo?.fecha ?? "2020-07-01";

  try {
    const valores = await fuente(desde);
    if (valores.length === 0) {
      return NextResponse.json({ indice, nuevos: 0, mensaje: "Ya estaba al día." });
    }

    // La serie la escribe la clave de servicio: es un dato de referencia, no
    // algo que cargue un usuario.
    const admin = createAdminClient();
    const { error } = await admin
      .from("indices_valores")
      .upsert(
        valores.map((v) => ({ indice, fecha: v.fecha, valor: v.valor })),
        { onConflict: "indice,fecha" }
      );

    if (error) throw new Error(error.message);

    return NextResponse.json({
      indice,
      nuevos: valores.length,
      hasta: valores[valores.length - 1]?.fecha,
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `No se pudo actualizar ${indice}: ${mensaje}` },
      { status: 502 }
    );
  }
}
