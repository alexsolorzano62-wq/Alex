import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Titulo, Vacio, Estado } from "@/components/Ui";
import { FiltrosUnidades } from "@/components/FiltrosUnidades";
import { formatearMoneda, formatearCorto } from "@/lib/dinero";
import { formatearFecha, hoyISO } from "@/lib/fechas";
import { TIPOS_PROPIEDAD, etiqueta } from "@/lib/types";
import {
  agrupar, coincide, mapearUnidad, ordenar,
  type Agrupado, type ContratoConsultado, type Grupo, type Orden,
  type PropiedadConsultada, type Unidad,
} from "@/lib/unidades";

export const dynamic = "force-dynamic";

type FilaPropiedad = PropiedadConsultada & {
  contratos: (ContratoConsultado & { estado: string })[];
};

function FilaUnidad({ unidad, hoy }: { unidad: Unidad; hoy: string }) {
  const ajustePendiente = unidad.proximoAjuste != null && unidad.proximoAjuste <= hoy;

  return (
    <Link
      href={`/propiedades/${unidad.id}`}
      className="tarjeta flex items-center justify-between gap-4 hover:border-marca-300"
    >
      <div className="min-w-0">
        <div className="truncate font-titulo text-base font-bold">
          {unidad.direccionCompleta}
        </div>
        <div className="truncate text-xs text-stone-500">
          {etiqueta(unidad.tipo)}
          {unidad.localidad ? ` · ${unidad.localidad}` : ""} · {unidad.propietario}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
          {unidad.inquilino ? (
            <span className="text-stone-600">{unidad.inquilino}</span>
          ) : (
            <span className="text-stone-400">sin inquilino</span>
          )}
          {unidad.indice && (
            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600">{unidad.indice}</span>
          )}
          {unidad.honorarios != null && (
            <span className="text-stone-500">{unidad.honorarios}% honorarios</span>
          )}
          {unidad.fechaFin && (
            <span className="text-stone-400">hasta {formatearFecha(unidad.fechaFin)}</span>
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
          {unidad.monto != null ? formatearMoneda(unidad.monto, unidad.moneda) : "—"}
        </span>
        <Estado valor={unidad.estado} />
      </div>
    </Link>
  );
}

function CabeceraGrupo({ grupo }: { grupo: Grupo }) {
  const titulo = (
    <span className="font-titulo text-lg font-bold text-stone-900">{grupo.titulo}</span>
  );

  return (
    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-stone-200 pb-2">
      <div className="min-w-0">
        {grupo.href ? (
          <Link href={grupo.href} className="hover:text-marca-700">{titulo}</Link>
        ) : (
          titulo
        )}
        {grupo.subtitulo && (
          <span className="ml-2 text-xs text-stone-500">{grupo.subtitulo}</span>
        )}
      </div>
      <div className="tabular flex items-center gap-3 text-xs text-stone-600">
        <span>
          {grupo.unidades.length} {grupo.unidades.length === 1 ? "unidad" : "unidades"}
        </span>
        {grupo.vacantes > 0 && (
          <span className="text-amber-700">{grupo.vacantes} sin alquilar</span>
        )}
        <span className="font-semibold text-stone-800">{formatearCorto(grupo.renta)}</span>
      </div>
    </div>
  );
}

export default async function Unidades({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string; orden?: string; estado?: string; tipo?: string; agrupar?: string;
  }>;
}) {
  const {
    q = "", orden = "direccion", estado = "todos", tipo = "todos",
    agrupar: criterio = "ninguno",
  } = await searchParams;

  const supabase = await createClient();

  const { data } = await supabase
    .from("propiedades")
    .select(
      "id, direccion, piso_depto, localidad, tipo, estado, edificio, propietarios(id, nombre), contratos(id, estado, monto_actual, moneda, indice, honorarios_porcentaje, fecha_fin, fecha_proximo_ajuste, inquilinos(nombre))"
    )
    .is("deleted_at", null);

  const filas = (data ?? []) as unknown as FilaPropiedad[];

  const unidades: Unidad[] = filas.map((p) =>
    mapearUnidad(p, (p.contratos ?? []).find((c) => c.estado === "activo") ?? null)
  );

  const filtradas = unidades
    .filter((u) => (estado === "todos" ? true : u.estado === estado))
    .filter((u) => (tipo === "todos" ? true : u.tipo === tipo))
    .filter((u) => coincide(u, q));

  const comoLista = ordenar(filtradas, orden as Orden);
  const grupos = agrupar(filtradas, criterio as Agrupado, orden as Orden);

  const hoy = hoyISO();
  const rentaMensual = comoLista
    .filter((u) => u.moneda === "ARS" && u.monto != null)
    .reduce((suma, u) => suma + (u.monto ?? 0), 0);
  const alquiladas = comoLista.filter((u) => u.estado === "alquilado").length;

  return (
    <div>
      <Titulo accion={{ href: "/propiedades/nuevo", texto: "Nueva unidad" }}>Unidades</Titulo>

      <FiltrosUnidades tipos={TIPOS_PROPIEDAD.map((t) => ({ valor: t, texto: etiqueta(t) }))} />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600">
        <span>
          <strong className="tabular">{comoLista.length}</strong>
          {comoLista.length === unidades.length ? " unidades" : ` de ${unidades.length} unidades`}
        </span>
        <span className="text-stone-300">|</span>
        <span><strong className="tabular">{alquiladas}</strong> alquiladas</span>
        <span className="text-stone-300">|</span>
        <span>
          <strong className="tabular">{formatearCorto(rentaMensual)}</strong> de renta mensual
        </span>
        {grupos.length > 0 && (
          <>
            <span className="text-stone-300">|</span>
            <span>
              en <strong className="tabular">{grupos.length}</strong>{" "}
              {criterio === "propietario" ? "propietarios" : "edificios"}
            </span>
          </>
        )}
      </div>

      {comoLista.length === 0 ? (
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
      ) : grupos.length > 0 ? (
        <div className="space-y-7">
          {grupos.map((grupo) => (
            <section key={grupo.clave}>
              <CabeceraGrupo grupo={grupo} />
              <ul className="space-y-2">
                {grupo.unidades.map((u) => (
                  <li key={u.id}><FilaUnidad unidad={u} hoy={hoy} /></li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {comoLista.map((u) => (
            <li key={u.id}><FilaUnidad unidad={u} hoy={hoy} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}
