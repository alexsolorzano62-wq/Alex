import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarPropietario } from "@/app/acciones";
import { Titulo } from "@/components/Ui";
import { FormularioPropietario } from "@/components/FormularioPropietario";

export const dynamic = "force-dynamic";

export default async function EditarPropietario({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("propietarios")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Titulo>Editar propietario</Titulo>
      <FormularioPropietario accion={actualizarPropietario} propietario={data} />
    </div>
  );
}
