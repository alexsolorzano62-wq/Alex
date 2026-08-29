import type { SupabaseClient } from "@supabase/supabase-js";
import type { Rol } from "@/lib/types";

export type Perfil = { id: string; nombre: string; email: string; rol: Rol };

export async function getPerfil(
  supabase: SupabaseClient,
  userId: string
): Promise<Perfil | null> {
  const { data } = await supabase
    .from("perfiles")
    .select("id, nombre, email, rol")
    .eq("id", userId)
    .single();

  return (data as Perfil) ?? null;
}

// Para las pantallas: quién es y si puede anular. Si no tiene perfil, no es
// del equipo y no debería estar viendo nada.
export async function requerirPerfil(supabase: SupabaseClient): Promise<Perfil | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return getPerfil(supabase, user.id);
}
