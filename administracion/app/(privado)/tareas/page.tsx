import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { crearTarea, cambiarEstadoTarea, archivarTarea } from "@/app/acciones";
import { Titulo, Campo, Selector, Area, Vacio } from "@/components/Ui";
import { formatearFecha, hoyISO } from "@/lib/fechas";
import { PRIORIDADES, etiqueta } from "@/lib/types";

export const dynamic = "force-dynamic";

type Tarea = {
  id: string;
  titulo: string;
  detalle: string | null;
  estado: string;
  prioridad: string;
  vence_el: string | null;
  completada_at: string | null;
  propiedades: { direccion: string; piso_depto: string | null } | null;
  inquilinos: { nombre: string } | null;
};

const TONO_PRIORIDAD: Record<string, string> = {
  alta: "border-l-orange-500",
  normal: "border-l-stone-300",
  baja: "border-l-stone-200",
};

export default async function Tareas({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string }>;
}) {
  const { ver } = await searchParams;
  const verHechas = ver === "hechas";

  const supabase = await createClient();
  const hoy = hoyISO();

  const { data } = await supabase
    .from("tareas")
    .select(
      "id, titulo, detalle, estado, prioridad, vence_el, completada_at, propiedades(direccion, piso_depto), inquilinos(nombre)"
    )
    .is("deleted_at", null)
    .eq("estado", verHechas ? "hecha" : "pendiente")
    .order("vence_el", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(300);

  const tareas = (data ?? []) as unknown as Tarea[];
  const vencidas = tareas.filter((t) => t.vence_el && t.vence_el < hoy).length;

  return (
    <div className="mx-auto max-w-3xl">
      <Titulo>Tareas pendientes</Titulo>

      <div className="mb-5 flex items-center gap-2 text-sm">
        <Link
          href="/tareas"
          className={`rounded-lg px-3 py-1.5 font-medium ${
            !verHechas ? "bg-marca-600 text-white" : "bg-white text-stone-600 hover:bg-stone-100"
          }`}
        >
          Pendientes
        </Link>
        <Link
          href="/tareas?ver=hechas"
          className={`rounded-lg px-3 py-1.5 font-medium ${
            verHechas ? "bg-marca-600 text-white" : "bg-white text-stone-600 hover:bg-stone-100"
          }`}
        >
          Hechas
        </Link>
        {!verHechas && vencidas > 0 && (
          <span className="ml-auto text-xs font-medium text-orange-700">
            {vencidas} {vencidas === 1 ? "atrasada" : "atrasadas"}
          </span>
        )}
      </div>

      {!verHechas && (
        <form action={crearTarea} className="tarjeta mb-6 space-y-4">
          <Campo rotulo="Qué hay que hacer" nombre="titulo" requerido />
          <div className="grid gap-4 sm:grid-cols-2">
            <Selector
              rotulo="Prioridad"
              nombre="prioridad"
              valor="normal"
              opciones={PRIORIDADES.map((p) => ({ valor: p, texto: etiqueta(p) }))}
            />
            <Campo rotulo="Para cuándo" nombre="vence_el" tipo="date"
                   ayuda="Opcional. Vacío es «algún día»." />
          </div>
          <Area rotulo="Detalle" nombre="detalle" filas={2} />
          <button type="submit" className="boton w-full sm:w-auto">Anotar tarea</button>
        </form>
      )}

      {tareas.length === 0 ? (
        <Vacio texto={verHechas ? "Todavía no marcaste ninguna como hecha." : "No hay nada pendiente. Buen momento."} />
      ) : (
        <ul className="space-y-2">
          {tareas.map((t) => {
            const atrasada = !verHechas && t.vence_el && t.vence_el < hoy;
            const unidad = t.propiedades
              ? `${t.propiedades.direccion}${t.propiedades.piso_depto ? " " + t.propiedades.piso_depto : ""}`
              : null;

            return (
              <li
                key={t.id}
                className={`tarjeta border-l-4 ${TONO_PRIORIDAD[t.prioridad] ?? "border-l-stone-300"} ${
                  verHechas ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <form action={cambiarEstadoTarea} className="pt-0.5">
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="estado" value={verHechas ? "pendiente" : "hecha"} />
                    <button
                      type="submit"
                      aria-label={verHechas ? "Volver a pendiente" : "Marcar como hecha"}
                      className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                        verHechas
                          ? "border-marca-600 bg-marca-600 text-white"
                          : "border-stone-300 hover:border-marca-500"
                      }`}
                    >
                      {verHechas && (
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none"
                             stroke="currentColor" strokeWidth="3.5">
                          <path d="M4 12l5 5L20 6" />
                        </svg>
                      )}
                    </button>
                  </form>

                  <div className="min-w-0 flex-1">
                    <p className={`font-medium ${verHechas ? "line-through" : ""}`}>{t.titulo}</p>
                    {t.detalle && <p className="mt-0.5 text-sm text-stone-500">{t.detalle}</p>}

                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500">
                      {unidad && <span>{unidad}</span>}
                      {t.inquilinos && <span>{t.inquilinos.nombre}</span>}
                      {t.vence_el && (
                        <span className={atrasada ? "font-medium text-orange-700" : ""}>
                          {atrasada ? "Venció el " : "Para el "}{formatearFecha(t.vence_el)}
                        </span>
                      )}
                      {t.prioridad === "alta" && !verHechas && (
                        <span className="font-medium text-orange-700">Prioridad alta</span>
                      )}
                      {t.completada_at && <span>Hecha el {formatearFecha(t.completada_at.slice(0, 10))}</span>}
                    </div>
                  </div>

                  <form action={archivarTarea}>
                    <input type="hidden" name="id" value={t.id} />
                    <button type="submit" aria-label="Archivar"
                            className="text-xs text-stone-400 hover:text-stone-700">
                      Archivar
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
