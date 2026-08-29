import { Campo, Selector, Area } from "@/components/Ui";

type Propietario = {
  id: string;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  email: string | null;
  forma_cobro: string;
  cbu: string | null;
  alias_cbu: string | null;
  titular_cuenta: string | null;
  notas: string | null;
};

export function FormularioPropietario({
  accion, propietario,
}: {
  accion: (formData: FormData) => Promise<void>;
  propietario?: Propietario;
}) {
  return (
    <form action={accion} className="space-y-6">
      {propietario && <input type="hidden" name="id" value={propietario.id} />}

      <section className="tarjeta space-y-4">
        <h2 className="font-titulo text-lg font-bold">Datos</h2>
        <Campo rotulo="Nombre y apellido" nombre="nombre" valor={propietario?.nombre} requerido />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="DNI o CUIT" nombre="documento" valor={propietario?.documento} />
          <Campo rotulo="Teléfono" nombre="telefono" valor={propietario?.telefono} />
        </div>
        <Campo rotulo="Email" nombre="email" tipo="email" valor={propietario?.email} />
      </section>

      <section className="tarjeta space-y-4">
        <h2 className="font-titulo text-lg font-bold">Cómo se le rinde</h2>
        <Selector
          rotulo="Forma de cobro habitual"
          nombre="forma_cobro"
          valor={propietario?.forma_cobro}
          opciones={[
            { valor: "transferencia", texto: "Transferencia" },
            { valor: "efectivo", texto: "Efectivo" },
          ]}
          ayuda="Es lo que viene propuesto al liquidar; se puede cambiar mes a mes."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="CBU" nombre="cbu" valor={propietario?.cbu} />
          <Campo rotulo="Alias" nombre="alias_cbu" valor={propietario?.alias_cbu} />
        </div>
        <Campo
          rotulo="Titular de la cuenta"
          nombre="titular_cuenta"
          valor={propietario?.titular_cuenta}
          ayuda="Solo si la cuenta no está a nombre del propietario."
        />
      </section>

      <section className="tarjeta space-y-4">
        <Area rotulo="Notas" nombre="notas" valor={propietario?.notas} />
      </section>

      <button type="submit" className="boton w-full sm:w-auto">
        {propietario ? "Guardar cambios" : "Crear propietario"}
      </button>
    </form>
  );
}
