import { Campo, Selector, Area } from "@/components/Ui";
import { TIPOS_PROPIEDAD, etiqueta } from "@/lib/types";

type Propiedad = {
  id: string;
  propietario_id: string;
  titulares_adicionales: string | null;
  direccion: string;
  piso_depto: string | null;
  localidad: string | null;
  provincia: string | null;
  tipo: string;
  ambientes: number | null;
  superficie_m2: number | null;
  partida_inmobiliaria: string | null;
  cuenta_luz: string | null;
  cuenta_gas: string | null;
  cuenta_agua: string | null;
  expensas_unidad: string | null;
  estado: string;
  notas: string | null;
};

export function FormularioPropiedad({
  accion, propiedad, propietarios,
}: {
  accion: (formData: FormData) => Promise<void>;
  propiedad?: Propiedad;
  propietarios: { id: string; nombre: string }[];
}) {
  return (
    <form action={accion} className="space-y-6">
      {propiedad && <input type="hidden" name="id" value={propiedad.id} />}

      <section className="tarjeta space-y-4">
        <h2 className="font-titulo text-lg font-bold">Dónde está y de quién es</h2>
        <Selector
          rotulo="Propietario"
          nombre="propietario_id"
          valor={propiedad?.propietario_id}
          opciones={propietarios.map((p) => ({ valor: p.id, texto: p.nombre }))}
          requerido
        />
        <Campo
          rotulo="Otros titulares"
          nombre="titulares_adicionales"
          valor={propiedad?.titulares_adicionales}
          ayuda="Si la escritura está a nombre de más de uno. La plata se le rinde igual al propietario de arriba."
        />
        <Campo rotulo="Dirección" nombre="direccion" valor={propiedad?.direccion} requerido />
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Piso / Depto" nombre="piso_depto" valor={propiedad?.piso_depto} />
          <Campo rotulo="Localidad" nombre="localidad" valor={propiedad?.localidad} />
          <Campo rotulo="Provincia" nombre="provincia" valor={propiedad?.provincia ?? "Buenos Aires"} />
        </div>
      </section>

      <section className="tarjeta space-y-4">
        <h2 className="font-titulo text-lg font-bold">El inmueble</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Selector
            rotulo="Tipo"
            nombre="tipo"
            valor={propiedad?.tipo}
            opciones={TIPOS_PROPIEDAD.map((t) => ({ valor: t, texto: etiqueta(t) }))}
          />
          <Campo rotulo="Ambientes" nombre="ambientes" tipo="number" valor={propiedad?.ambientes} min={0} />
          <Campo rotulo="Superficie (m²)" nombre="superficie_m2" valor={propiedad?.superficie_m2} />
        </div>
        <Selector
          rotulo="Estado"
          nombre="estado"
          valor={propiedad?.estado}
          opciones={[
            { valor: "alquilado", texto: "Alquilado" },
            { valor: "disponible", texto: "Disponible" },
            { valor: "en_refaccion", texto: "En refacción" },
            { valor: "retirado", texto: "Retirado de la administración" },
          ]}
        />
      </section>

      <section className="tarjeta space-y-4">
        <h2 className="font-titulo text-lg font-bold">Cuentas de impuestos y servicios</h2>
        <p className="-mt-2 text-xs text-stone-500">
          Sirven para pagar y para cargar los gastos sin tener que buscar la boleta.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Partida inmobiliaria" nombre="partida_inmobiliaria" valor={propiedad?.partida_inmobiliaria} />
          <Campo rotulo="Unidad de expensas" nombre="expensas_unidad" valor={propiedad?.expensas_unidad} />
          <Campo rotulo="Cuenta de luz" nombre="cuenta_luz" valor={propiedad?.cuenta_luz} />
          <Campo rotulo="Cuenta de gas" nombre="cuenta_gas" valor={propiedad?.cuenta_gas} />
          <Campo rotulo="Cuenta de agua" nombre="cuenta_agua" valor={propiedad?.cuenta_agua} />
        </div>
      </section>

      <section className="tarjeta">
        <Area rotulo="Notas" nombre="notas" valor={propiedad?.notas} />
      </section>

      <button type="submit" className="boton w-full sm:w-auto">
        {propiedad ? "Guardar cambios" : "Crear propiedad"}
      </button>
    </form>
  );
}
