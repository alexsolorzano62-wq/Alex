import { createClient } from "@/lib/supabase/server";
import { crearContrato } from "@/app/acciones";
import { Titulo, Vacio } from "@/components/Ui";
import { NuevoContrato as FormularioNuevoContrato } from "@/components/NuevoContrato";

export const dynamic = "force-dynamic";

export default async function NuevoContrato({
  searchParams,
}: {
  searchParams: Promise<{ propiedad?: string }>;
}) {
  const { propiedad } = await searchParams;
  const supabase = await createClient();

  const [{ data: propiedades }, { data: inquilinos }] = await Promise.all([
    supabase
      .from("propiedades")
      .select("id, direccion, piso_depto")
      .is("deleted_at", null)
      .order("direccion"),
    supabase.from("inquilinos").select("id, nombre").is("deleted_at", null).order("nombre"),
  ]);

  if (!propiedades?.length || !inquilinos?.length) {
    return (
      <div className="mx-auto max-w-2xl">
        <Titulo>Nuevo contrato</Titulo>
        <Vacio
          texto={
            !propiedades?.length
              ? "Antes del contrato hace falta cargar la propiedad."
              : "Antes del contrato hace falta cargar el inquilino."
          }
          accion={
            !propiedades?.length
              ? { href: "/propiedades/nuevo", texto: "Cargar propiedad" }
              : { href: "/inquilinos/nuevo", texto: "Cargar inquilino" }
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Titulo>Nuevo contrato</Titulo>
      <FormularioNuevoContrato
        accion={crearContrato}
        propiedades={propiedades}
        inquilinos={inquilinos}
        propiedadInicial={propiedad}
        // La lectura del PDF con IA se ofrece solo si hay clave configurada.
        // Sin clave, la carga es manual y la app no muestra algo que no anda.
        conLecturaIA={Boolean(process.env.ANTHROPIC_API_KEY)}
      />
    </div>
  );
}
