import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Titulo, Vacio, Estado } from "@/components/Ui";
import { Buscador } from "@/components/FiltrosUnidades";
import { coincide, type Unidad } from "@/lib/unidades";
import { formatearMoneda } from "@/lib/dinero";
import { formatearFecha, hoyISO, sumarMeses } from "@/lib/fechas";
import { etiqueta } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Contratos({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string }>;
}) {
  const { estado = "activo", q = "" } = await searchParams;
  const supabase = await createClient();

  let consulta = supabase
    .from("contratos")
    .select(
      "id, monto_actual, moneda, fecha_inicio, fecha_fin, estado, indice, honorarios_porcentaje, fecha_proximo_ajuste, inquilinos(nombre), propiedades(direccion, piso_depto, propietarios(nombre))"
    )
    .is("deleted_at", null)
    .order("fecha_fin");

  if (estado !== "todos") consulta = consulta.eq("estado", estado);

  const { data: todos } = await consulta;

  // Se busca por dirección, propietario o inquilino con la misma lógica que
  // la pantalla de unidades, para que escribir lo mismo dé lo mismo en las dos.
  const contratos = (todos ?? []).filter((c) => {
    const propiedad = c.propiedades as unknown as {
      direccion: string;
      piso_depto: string | null;
      propietarios: { nombre: string } | null;
    } | null;
    const inquilino = c.inquilinos as unknown as { nombre: string } | null;

    return coincide(
      {
        direccionCompleta: `${propiedad?.direccion ?? ""}${propiedad?.piso_depto ? ` ${propiedad.piso_depto}` : ""}`,
        localidad: null,
        propietario: propiedad?.propietarios?.nombre ?? "",
        inquilino: inquilino?.nombre ?? null,
      } as Unidad,
      q
    );
  });

  const hoy = hoyISO();
  const enTresMeses = sumarMeses(hoy, 3);

  const filtros = [
    { valor: "activo", texto: "Activos" },
    { valor: "finalizado", texto: "Finalizados" },
    { valor: "todos", texto: "Todos" },
  ];

  return (
    <div>
      <Titulo accion={{ href: "/contratos/nuevo", texto: "Nuevo contrato" }}>
        Contratos
      </Titulo>

      <Buscador />

      <div className="mb-4 flex gap-2">
        {filtros.map((f) => (
          <Link
            key={f.valor}
            href={`/contratos?estado=${f.valor}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              estado === f.valor
                ? "bg-marca-600 text-white"
                : "border border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
            }`}
          >
            {f.texto}
          </Link>
        ))}
      </div>

      {contratos.length === 0 ? (
        <Vacio
          texto={q ? "Ningún contrato coincide con lo que buscaste." : "No hay contratos con ese filtro."}
          accion={{ href: "/contratos/nuevo", texto: "Cargar un contrato" }}
        />
      ) : (
        <ul className="space-y-2">
          {contratos.map((c) => {
            const propiedad = c.propiedades as unknown as {
              direccion: string;
              piso_depto: string | null;
              propietarios: { nombre: string } | null;
            } | null;
            const inquilino = c.inquilinos as unknown as { nombre: string } | null;
            const venceProntoElContrato = c.estado === "activo" && c.fecha_fin <= enTresMeses;
            const tieneAjustePendiente =
              c.estado === "activo" && c.fecha_proximo_ajuste != null && c.fecha_proximo_ajuste <= hoy;

            return (
              <li key={c.id}>
                <Link href={`/contratos/${c.id}`} className="tarjeta flex items-center justify-between gap-4 hover:border-marca-300">
                  <div className="min-w-0">
                    <div className="truncate font-titulo text-base font-bold">
                      {propiedad?.direccion}
                      {propiedad?.piso_depto ? ` ${propiedad.piso_depto}` : ""}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-stone-500">
                      {inquilino?.nombre} · propietario {propiedad?.propietarios?.nombre}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600">
                        {etiqueta(c.indice) === c.indice ? c.indice : etiqueta(c.indice)}
                      </span>
                      <span className="text-stone-500">{c.honorarios_porcentaje}% honorarios</span>
                      <span className="text-stone-400">hasta {formatearFecha(c.fecha_fin)}</span>
                      {tieneAjustePendiente && (
                        <span className="rounded bg-marca-100 px-1.5 py-0.5 font-semibold text-marca-800">
                          ajuste pendiente
                        </span>
                      )}
                      {venceProntoElContrato && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">
                          vence pronto
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="tabular font-semibold">
                      {formatearMoneda(Number(c.monto_actual), c.moneda)}
                    </span>
                    <Estado valor={c.estado} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
