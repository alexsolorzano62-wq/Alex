import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Titulo, Vacio, Estado } from "@/components/Ui";
import { FiltrosUnidades } from "@/components/FiltrosUnidades";
import { formatearMoneda, formatearCorto } from "@/lib/dinero";
import { formatearFecha, hoyISO } from "@/lib/fechas";
import { TIPOS_PROPIEDAD, etiqueta } from "@/lib/types";
import { coincide, ordenar, type Orden, type Unidad } from "@/lib/unidades";

export const dynamic = "force-dynamic";

type FilaPropiedad = {
  id: string;
  direccion: string;
  piso_depto: string | null;
  localidad: string | null;
  tipo: string;
  estado: string;
  propietarios: { id: string; nombre: string } | null;
  contratos: {
    id: string;
    estado: string;
    monto_actual: number;
    moneda: "ARS" | "USD";
    indice: string;
    honorarios_porcentaje: number;
    fecha_fin: string;
    fecha_proximo_ajuste: string | null;
    inquilinos: { nombre: string } | null;
  }[];
};

export default async function Unidades({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; orden?: string; estado?: string; tipo?: string }>;
}) {
  const { q = "", orden = "direccion", estado = "todos", tipo = "todos" } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("propiedades")
    .select(
      "id, direccion, piso_depto, localidad, tipo, estado, propietarios(id, nombre), contratos(id, estado, monto_actual, moneda, indice, honorarios_porcentaje, fecha_fin, fecha_proximo_ajuste, inquilinos(nombre))"
    )
    .is("deleted_at", null);

  const filas = (data ?? []) as unknown as FilaPropiedad[];

  // Cada propiedad se muestra con el contrato que la tiene ocupada hoy.
  // Con ~100 unidades, buscar y ordenar acá sale más barato y más simple que
  // pelear con la consulta para filtrar por campos de tablas relacionadas.
  const unidades: Unidad[] = filas.map((p) => {
    const activo = (p.contratos ?? []).find((c) => c.estado === "activo") ?? null;
    return {
      id: p.id,
      direccion: p.direccion,
      pisoDepto: p.piso_depto,
      direccionCompleta: `${p.direccion}${p.piso_depto ? ` ${p.piso_depto}` : ""}`,
      localidad: p.localidad,
      tipo: p.tipo,
      estado: p.estado,
      propietarioId: p.propietarios?.id ?? null,
      propietario: p.propietarios?.nombre ?? "",
      contratoId: activo?.id ?? null,
      inquilino: activo?.inquilinos?.nombre ?? null,
      monto: activo ? Number(activo.monto_actual) : null,
      moneda: activo?.moneda ?? "ARS",
      indice: activo?.indice ?? null,
      honorarios: activo ? Number(activo.honorarios_porcentaje) : null,
      fechaFin: activo?.fecha_fin ?? null,
      proximoAjuste: activo?.fecha_proximo_ajuste ?? null,
    };
  });

  const filtradas = unidades
    .filter((u) => (estado === "todos" ? true : u.estado === estado))
    .filter((u) => (tipo === "todos" ? true : u.tipo === tipo))
    .filter((u) => coincide(u, q));

  const listadas = ordenar(filtradas, orden as Orden);

  const hoy = hoyISO();
  const rentaMensual = listadas
    .filter((u) => u.moneda === "ARS" && u.monto != null)
    .reduce((suma, u) => suma + (u.monto ?? 0), 0);
  const alquiladas = listadas.filter((u) => u.estado === "alquilado").length;

  return (
    <div>
      <Titulo accion={{ href: "/propiedades/nuevo", texto: "Nueva unidad" }}>Unidades</Titulo>

      <FiltrosUnidades
        tipos={TIPOS_PROPIEDAD.map((t) => ({ valor: t, texto: etiqueta(t) }))}
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600">
        <span>
          <strong className="tabular">{listadas.length}</strong>
          {listadas.length === unidades.length ? " unidades" : ` de ${unidades.length} unidades`}
        </span>
        <span className="text-stone-300">|</span>
        <span><strong className="tabular">{alquiladas}</strong> alquiladas</span>
        <span className="text-stone-300">|</span>
        <span>
          <strong className="tabular">{formatearCorto(rentaMensual)}</strong> de renta mensual
        </span>
      </div>

      {listadas.length === 0 ? (
        <Vacio
          texto={
            unidades.length === 0
              ? "Todavía no cargaste ninguna unidad."
              : "Ninguna unidad coincide con lo que buscaste."
          }
          accion={
            unidades.length === 0
              ? { href: "/propiedades/nuevo", texto: "Cargar la primera" }
              : undefined
          }
        />
      ) : (
        <ul className="space-y-2">
          {listadas.map((u) => {
            const ajustePendiente =
              u.proximoAjuste != null && u.proximoAjuste <= hoy;

            return (
              <li key={u.id}>
                <Link
                  href={`/propiedades/${u.id}`}
                  className="tarjeta flex items-center justify-between gap-4 hover:border-marca-300"
                >
                  <div className="min-w-0">
                    <div className="truncate font-titulo text-base font-bold">
                      {u.direccionCompleta}
                    </div>
                    <div className="truncate text-xs text-stone-500">
                      {etiqueta(u.tipo)}
                      {u.localidad ? ` · ${u.localidad}` : ""} · {u.propietario}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                      {u.inquilino ? (
                        <span className="text-stone-600">{u.inquilino}</span>
                      ) : (
                        <span className="text-stone-400">sin inquilino</span>
                      )}
                      {u.indice && (
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600">
                          {u.indice}
                        </span>
                      )}
                      {u.honorarios != null && (
                        <span className="text-stone-500">{u.honorarios}% honorarios</span>
                      )}
                      {u.fechaFin && (
                        <span className="text-stone-400">hasta {formatearFecha(u.fechaFin)}</span>
                      )}
                      {ajustePendiente && (
                        <span className="rounded bg-marca-100 px-1.5 py-0.5 font-semibold text-marca-800">
                          ajuste pendiente
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="tabular font-semibold">
                      {u.monto != null ? formatearMoneda(u.monto, u.moneda) : "—"}
                    </span>
                    <Estado valor={u.estado} />
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
