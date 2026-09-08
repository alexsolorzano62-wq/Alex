import { createClient } from "@/lib/supabase/server";
import { crearTarea } from "@/app/acciones";
import { Titulo, Campo, Selector, Area } from "@/components/Ui";
import { PRIORIDADES, etiqueta } from "@/lib/types";

export const dynamic = "force-dynamic";

// Anotar algo sin perder de vista de dónde salió: se entra desde la fila de la
// planilla y la tarea queda colgada de esa unidad y ese inquilino.
export default async function NuevaTarea({
  searchParams,
}: {
  searchParams: Promise<{ contrato?: string; volver?: string }>;
}) {
  const { contrato: contratoId, volver } = await searchParams;
  const supabase = await createClient();

  let contexto: { direccion: string; inquilino: string; propiedadId: string; inquilinoId: string } | null = null;

  if (contratoId) {
    const { data } = await supabase
      .from("contratos")
      .select("propiedad_id, inquilino_id, inquilinos(nombre), propiedades(direccion, piso_depto)")
      .eq("id", contratoId)
      .single();

    if (data) {
      const p = data.propiedades as unknown as { direccion: string; piso_depto: string | null } | null;
      const i = data.inquilinos as unknown as { nombre: string } | null;
      contexto = {
        direccion: `${p?.direccion ?? ""}${p?.piso_depto ? " " + p.piso_depto : ""}`,
        inquilino: i?.nombre ?? "",
        propiedadId: data.propiedad_id,
        inquilinoId: data.inquilino_id,
      };
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Titulo>Anotar una tarea</Titulo>

      {contexto && (
        <div className="tarjeta mb-5">
          <div className="font-titulo text-base font-bold">{contexto.direccion}</div>
          <div className="text-sm text-stone-500">{contexto.inquilino}</div>
        </div>
      )}

      <form action={crearTarea} className="tarjeta space-y-4">
        {contratoId && <input type="hidden" name="contrato_id" value={contratoId} />}
        {contexto && <input type="hidden" name="propiedad_id" value={contexto.propiedadId} />}
        {contexto && <input type="hidden" name="inquilino_id" value={contexto.inquilinoId} />}
        <input type="hidden" name="volver_a" value={volver ?? "/tareas"} />

        <Campo rotulo="Qué hay que hacer" nombre="titulo" requerido
               ayuda="Por ejemplo: revisar la filtración del baño." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Selector
            rotulo="Prioridad"
            nombre="prioridad"
            valor="normal"
            opciones={PRIORIDADES.map((p) => ({ valor: p, texto: etiqueta(p) }))}
          />
          <Campo rotulo="Para cuándo" nombre="vence_el" tipo="date"
                 ayuda="Opcional." />
        </div>
        <Area rotulo="Detalle" nombre="detalle" filas={3} />

        <button type="submit" className="boton w-full sm:w-auto">Anotar tarea</button>
      </form>
    </div>
  );
}
