import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types";

// Sugerencias pendientes que este usuario puede resolver:
// las de sus propios alquileres, o todas si es admin.
export async function getPendingSuggestionsCount(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole
): Promise<number> {
  if (role === "admin") {
    const { data } = await supabase
      .from("suggestions")
      .select("id")
      .eq("status", "pendiente");
    return data?.length ?? 0;
  }

  const { data } = await supabase
    .from("suggestions")
    .select("id, listings!inner(created_by)")
    .eq("status", "pendiente")
    .eq("listings.created_by", userId);
  return data?.length ?? 0;
}
