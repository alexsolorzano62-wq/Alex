import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarContrato } from "@/app/acciones";
import { Titulo } from "@/components/Ui";
import { FormularioContrato } from "@/components/FormularioContrato";

export const dynamic = "force-dynamic";

export default async function EditarContrato({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: contrato }, { data: propiedades }, { data: inquilinos }] = await Promise.all([
    supabase.from("contratos").select("*").eq("id", id).single(),
    supabase.from("propiedades").select("id, direccion, piso_depto").is("deleted_at", null).order("direccion"),
    supabase.from("inquilinos").select("id, nombre").is("deleted_at", null).order("nombre"),
  ]);

  if (!contrato) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Titulo>Editar contrato</Titulo>
      <FormularioContrato
        accion={actualizarContrato}
        contrato={contrato}
        propiedades={propiedades ?? []}
        inquilinos={inquilinos ?? []}
      />
    </div>
  );
}
