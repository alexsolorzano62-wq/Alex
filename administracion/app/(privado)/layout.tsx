import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requerirPerfil } from "@/lib/supabase/perfil";
import { Encabezado } from "@/components/Encabezado";
import { NavInferior } from "@/components/NavInferior";

export default async function LayoutPrivado({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const perfil = await requerirPerfil(supabase);

  // El proxy ya frenó a los que no tienen sesión. Acá cae quien tiene sesión
  // pero todavía no tiene perfil cargado en el equipo.
  if (!perfil) redirect("/login");

  // El contador del menú. Se pide acá, una sola vez por pantalla, con `head`
  // para que la base devuelva el número y no las filas.
  const { count } = await supabase
    .from("tareas")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("estado", "pendiente");

  const pendientes = count ?? 0;

  return (
    <div className="min-h-dvh bg-stone-50">
      <Encabezado perfil={perfil} tareasPendientes={pendientes} />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-10">{children}</main>
      <NavInferior tareasPendientes={pendientes} />
    </div>
  );
}
