import { crearPropietario } from "@/app/acciones";
import { Titulo } from "@/components/Ui";
import { FormularioPropietario } from "@/components/FormularioPropietario";

export default function NuevoPropietario() {
  return (
    <div className="mx-auto max-w-2xl">
      <Titulo>Nuevo propietario</Titulo>
      <FormularioPropietario accion={crearPropietario} />
    </div>
  );
}
