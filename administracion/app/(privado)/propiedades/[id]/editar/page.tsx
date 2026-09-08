import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarPropiedad } from "@/app/acciones";
import { Titulo } from "@/components/Ui";
import { FormularioPropiedad } from "@/components/FormularioPropiedad";

export const dynamic = "force-dynamic";

export default async function EditarPropiedad({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: propiedad }, { data: propietarios }] = await Promise.all([
    supabase.from("propiedades").select("*").eq("id", id).single(),
    supabase.from("propietarios").select("id, nombre").is("deleted_at", null).order("nombre"),
  ]);

  if (!propiedad) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Titulo>Editar propiedad</Titulo>
      <FormularioPropiedad
        accion={actualizarPropiedad}
        propiedad={propiedad}
        propietarios={propietarios ?? []}
      />
    </div>
  );
}
