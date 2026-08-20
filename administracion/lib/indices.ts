import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// El ICL es diario pero no publica sábados, domingos ni feriados. Para una
// fecha sin publicación se toma el último valor publicado antes de esa fecha,
// que es como se calcula en la práctica.
export async function valorDeIndice(
  supabase: SupabaseClient,
  indice: string,
  fechaISO: string
): Promise<number | null> {
  const { data } = await supabase
    .from("indices_valores")
    .select("valor")
    .eq("indice", indice)
    .lte("fecha", fechaISO)
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? Number(data.valor) : null;
}

// Trae de una sola consulta los valores que hacen falta para toda una tanda
// de ajustes, en lugar de una consulta por contrato.
export async function serieDeIndice(
  supabase: SupabaseClient,
  indice: string,
  desdeISO: string
): Promise<{ fecha: string; valor: number }[]> {
  const { data } = await supabase
    .from("indices_valores")
    .select("fecha, valor")
    .eq("indice", indice)
    .gte("fecha", desdeISO)
    .order("fecha");

  return (data ?? []).map((f) => ({ fecha: f.fecha, valor: Number(f.valor) }));
}

// El valor vigente a una fecha dentro de una serie ya traída.
export function valorEnSerie(
  serie: { fecha: string; valor: number }[],
  fechaISO: string
): number | null {
  let ultimo: number | null = null;
  for (const punto of serie) {
    if (punto.fecha > fechaISO) break;
    ultimo = punto.valor;
  }
  return ultimo;
}
