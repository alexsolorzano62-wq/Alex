import { crearInquilino } from "@/app/acciones";
import { Titulo, Campo, Area } from "@/components/Ui";

export default function NuevoInquilino() {
  return (
    <div className="mx-auto max-w-2xl">
      <Titulo>Nuevo inquilino</Titulo>
      <form action={crearInquilino} className="space-y-6">
        <section className="tarjeta space-y-4">
          <Campo rotulo="Nombre y apellido" nombre="nombre" requerido />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="DNI o CUIT" nombre="documento" />
            <Campo rotulo="Teléfono" nombre="telefono" ayuda="Con característica, para los avisos por WhatsApp." />
          </div>
          <Campo rotulo="Email" nombre="email" tipo="email" />
          <Area rotulo="Notas" nombre="notas" />
        </section>
        <button type="submit" className="boton w-full sm:w-auto">Crear inquilino</button>
      </form>
    </div>
  );
}
