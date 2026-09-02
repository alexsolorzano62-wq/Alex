import { createClient } from "@/lib/supabase/server";
import { agregarFeriado, quitarFeriado } from "@/app/acciones";
import { Titulo, Campo } from "@/components/Ui";
import { formatearFecha, hoyISO, diaDeLaSemana } from "@/lib/fechas";

export const dynamic = "force-dynamic";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export default async function Feriados() {
  const supabase = await createClient();
  const desde = hoyISO().slice(0, 4) + "-01-01";

  const { data } = await supabase
    .from("feriados")
    .select("fecha, nombre, origen")
    .gte("fecha", desde)
    .order("fecha")
    .limit(200);

  const feriados = data ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <Titulo>Feriados</Titulo>

      <p className="mb-5 text-sm text-stone-500">
        Cuando el vencimiento del alquiler cae domingo o feriado, se corre al
        día siguiente hábil y los punitorios recién empiezan a contar desde ahí.
        El sábado no corre el vencimiento.
      </p>

      <div className="tarjeta mb-6 border-l-4 border-l-amber-400 bg-amber-50/50">
        <p className="text-sm text-stone-700">
          Los feriados de fecha fija ya están cargados hasta 2030. Los que se
          mueven cada año por decreto —Carnaval, Güemes, San Martín, Diversidad
          Cultural, Soberanía— y los puentes turísticos <strong>no se pueden
          calcular</strong>: se publican cada año y hay que cargarlos acá.
        </p>
      </div>

      <form action={agregarFeriado} className="tarjeta mb-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Fecha" nombre="fecha" tipo="date" requerido />
          <Campo rotulo="Qué se conmemora" nombre="nombre" requerido />
        </div>
        <button type="submit" className="boton w-full sm:w-auto">Agregar feriado</button>
      </form>

      <ul className="space-y-1.5">
        {feriados.map((f) => (
          <li key={f.fecha} className="tarjeta flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{f.nombre}</p>
              <p className="text-xs text-stone-500">
                {DIAS[diaDeLaSemana(String(f.fecha))]} {formatearFecha(String(f.fecha))}
                {f.origen === "movible" && " · cargado a mano"}
              </p>
            </div>
            <form action={quitarFeriado}>
              <input type="hidden" name="fecha" value={String(f.fecha)} />
              <button type="submit" className="text-xs text-stone-400 hover:text-orange-700">
                Quitar
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
