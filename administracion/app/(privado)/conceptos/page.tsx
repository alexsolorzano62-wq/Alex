import { createClient } from "@/lib/supabase/server";
import { crearConcepto, cambiarConcepto } from "@/app/acciones";
import { Titulo, Campo, Selector, Vacio } from "@/components/Ui";
import { TIPOS_CARGO, etiqueta } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Conceptos() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("conceptos")
    .select("id, nombre, tipo, detalle, activo")
    .is("deleted_at", null)
    .order("activo", { ascending: false })
    .order("nombre");

  const conceptos = data ?? [];
  const enUso = conceptos.filter((c) => c.activo);

  return (
    <div className="mx-auto max-w-2xl">
      <Titulo>Servicios e impuestos</Titulo>

      <p className="mb-5 text-sm text-stone-500">
        Lo que se le cobra al inquilino además del alquiler. Se define una vez
        acá y después se elige de la lista en cada contrato, con el monto que
        paga esa unidad.
      </p>

      <form action={crearConcepto} className="tarjeta mb-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <Campo rotulo="Nombre" nombre="nombre" requerido
                 ayuda="Como lo nombrás vos: SAT, EDET, CISI." />
          <Selector
            rotulo="Tipo"
            nombre="tipo"
            valor="agua"
            opciones={TIPOS_CARGO.map((t) => ({ valor: t, texto: etiqueta(t) }))}
          />
        </div>
        <Campo rotulo="Qué es" nombre="detalle"
               ayuda="Opcional. Para que otro del equipo lo reconozca." />
        <button type="submit" className="boton w-full sm:w-auto">Agregar</button>
      </form>

      {conceptos.length === 0 ? (
        <Vacio texto="Todavía no hay ninguno cargado." />
      ) : (
        <ul className="space-y-2">
          {conceptos.map((c) => (
            <li
              key={c.id}
              className={`tarjeta flex items-center gap-3 py-3 ${
                c.activo ? "" : "opacity-60"
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-bold">
                  {c.nombre}
                  <span className="ml-2 text-xs font-normal text-stone-500">
                    {etiqueta(c.tipo)}
                  </span>
                </span>
                {c.detalle && (
                  <span className="block text-xs text-stone-500">{c.detalle}</span>
                )}
                {!c.activo && (
                  <span className="block text-xs text-stone-500">Apagado</span>
                )}
              </span>

              <form action={cambiarConcepto}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="activo" value={c.activo ? "false" : "true"} />
                <button type="submit" className="text-xs text-stone-400 hover:text-stone-700">
                  {c.activo ? "Apagar" : "Encender"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {enUso.length > 0 && (
        <p className="mt-5 text-xs text-stone-500">
          Apagar uno no toca los contratos que ya lo cobran: deja de ofrecerse
          para los nuevos. Los recibos viejos siguen diciendo lo que decían.
        </p>
      )}
    </div>
  );
}
