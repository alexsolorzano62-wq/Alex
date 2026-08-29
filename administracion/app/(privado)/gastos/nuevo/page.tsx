import { createClient } from "@/lib/supabase/server";
import { crearGasto } from "@/app/acciones";
import { Titulo, Campo, Selector, Area, Vacio } from "@/components/Ui";
import { TIPOS_GASTO, etiqueta } from "@/lib/types";
import { hoyISO } from "@/lib/fechas";

export const dynamic = "force-dynamic";

export default async function NuevoGasto({
  searchParams,
}: {
  searchParams: Promise<{ propiedad?: string }>;
}) {
  const { propiedad } = await searchParams;
  const supabase = await createClient();

  const { data: propiedades } = await supabase
    .from("propiedades")
    .select("id, direccion, piso_depto")
    .is("deleted_at", null)
    .order("direccion");

  if (!propiedades || propiedades.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Titulo>Cargar gasto</Titulo>
        <Vacio
          texto="Primero hace falta una propiedad a la que imputarle el gasto."
          accion={{ href: "/propiedades/nuevo", texto: "Cargar propiedad" }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Titulo>Cargar gasto</Titulo>
      <form action={crearGasto} className="space-y-6">
        <section className="tarjeta space-y-4">
          <Selector
            rotulo="Propiedad"
            nombre="propiedad_id"
            valor={propiedad}
            opciones={propiedades.map((p) => ({
              valor: p.id,
              texto: `${p.direccion}${p.piso_depto ? ` ${p.piso_depto}` : ""}`,
            }))}
            requerido
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Selector
              rotulo="Tipo"
              nombre="tipo"
              opciones={TIPOS_GASTO.map((t) => ({ valor: t, texto: etiqueta(t) }))}
            />
            <Campo rotulo="Fecha" nombre="fecha" tipo="date" valor={hoyISO()} requerido />
          </div>
          <Campo rotulo="Descripción" nombre="descripcion" requerido />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Monto" nombre="monto" inputMode="decimal" requerido />
            <Selector
              rotulo="Moneda"
              nombre="moneda"
              opciones={[
                { valor: "ARS", texto: "Pesos" },
                { valor: "USD", texto: "Dólares" },
              ]}
            />
          </div>
        </section>

        <section className="tarjeta space-y-4">
          <Selector
            rotulo="¿Quién lo paga?"
            nombre="a_cargo_de"
            opciones={[
              { valor: "propietario", texto: "El propietario — se descuenta de su liquidación" },
              { valor: "inquilino", texto: "El inquilino — se agrega a su próximo recibo" },
            ]}
            ayuda="Esto define adónde va el gasto y evita que se cobre o se descuente dos veces."
          />
          <Area rotulo="Notas" nombre="notas" filas={2} />
        </section>

        <button type="submit" className="boton w-full sm:w-auto">Guardar gasto</button>
      </form>
    </div>
  );
}
