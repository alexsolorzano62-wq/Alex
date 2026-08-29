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

  return (
    <div className="min-h-dvh bg-stone-50">
      <Encabezado perfil={perfil} />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-10">{children}</main>
      <NavInferior />
    </div>
  );
}
