import type { SupabaseClient } from "@supabase/supabase-js";

// Los feriados se consultan seguido y cambian poco. Se piden por año para no
// traer la tabla entera cada vez que alguien registra un cobro.
export async function feriadosDelAnio(
  supabase: SupabaseClient,
  anio: number
): Promise<Set<string>> {
  const { data } = await supabase
    .from("feriados")
    .select("fecha")
    .gte("fecha", `${anio}-01-01`)
    .lte("fecha", `${anio + 1}-01-31`)   // un mes de margen por si el vencimiento cruza el año
    .limit(400);

  return new Set((data ?? []).map((f) => String(f.fecha)));
}
