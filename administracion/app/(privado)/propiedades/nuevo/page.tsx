import { createClient } from "@/lib/supabase/server";
import { crearPropiedad } from "@/app/acciones";
import { Titulo, Vacio } from "@/components/Ui";
import { FormularioPropiedad } from "@/components/FormularioPropiedad";

export const dynamic = "force-dynamic";

export default async function NuevaPropiedad() {
  const supabase = await createClient();
  const { data: propietarios } = await supabase
    .from("propietarios")
    .select("id, nombre")
    .is("deleted_at", null)
    .order("nombre");

  if (!propietarios || propietarios.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Titulo>Nueva propiedad</Titulo>
        <Vacio
          texto="Antes de cargar una propiedad hace falta el propietario."
          accion={{ href: "/propietarios/nuevo", texto: "Cargar propietario" }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Titulo>Nueva propiedad</Titulo>
      <FormularioPropiedad accion={crearPropiedad} propietarios={propietarios} />
    </div>
  );
}
