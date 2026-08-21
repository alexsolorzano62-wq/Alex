import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Titulo, Vacio } from "@/components/Ui";
import { FiltrosUnidades } from "@/components/FiltrosUnidades";
import { formatearMoneda, formatearCorto } from "@/lib/dinero";
import {
  formatearFecha, hoyISO, nombreDelPeriodo, primerDiaDelMes, sumarMeses,
  vencimientoDelPeriodo,
} from "@/lib/fechas";
import { TIPOS_PROPIEDAD, etiqueta } from "@/lib/types";
import { agrupar, coincide, ordenar, type Agrupado, type Orden, type Unidad } from "@/lib/unidades";
import {
  armarFila, contarMesesAdeudados, estadoDeFila, totales,
  ETIQUETA_ESTADO, type EstadoFila, type FilaPlanilla,
} from "@/lib/planilla";

export const dynamic = "force-dynamic";

type FilaContrato = {
  id: string;
  monto_actual: number;
  moneda: "ARS" | "USD";
  dia_vencimiento: number;
  indice: string;
  honorarios_porcentaje: number;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_proximo_ajuste: string | null;
  observaciones: string | null;
  inquilinos: { nombre: string } | null;
  propiedades: {
    id: string;
    direccion: string;
    piso_depto: string | null;
    localidad: string | null;
    tipo: string;
    estado: string;
    edificio: string | null;
    propietarios: { id: string; nombre: string } | null;
  } | null;
};

// Los colores de la planilla de Excel: verde abonado, amarillo con saldo,
// naranja impago. El borde de la izquierda lleva el peso, para que también se
// distingan impresas en blanco y negro.
const TONOS: Record<EstadoFila, string> = {
  abonado: "border-marca-500 bg-marca-50/70",
  con_saldo: "border-amber-400 bg-amber-50",
  impago: "border-orange-500 bg-orange-50",
};

const TONOS_CHIP: Record<EstadoFila, string> = {
  abonado: "bg-marca-100 text-marca-800",
  con_saldo: "bg-amber-200 text-amber-900",
  impago: "bg-orange-200 text-orange-900",
};

function Fila({ fila, periodo }: { fila: FilaPlanilla; periodo: string }) {
  const estado = estadoDeFila(fila);
  const paga = fila.cobroId != null;
  const vence = vencimientoDelPeriodo(periodo, 10);

  return (
    <tr className={`border-l-4 ${TONOS[estado]}`}>
      <td className="px-3 py-2 align-top">
        <Link
          href={fila.contratoId ? `/contratos/${fila.contratoId}` : `/propiedades/${fila.id}`}
          className="font-medium text-stone-900 hover:text-marca-700"
        >
          {fila.direccionCompleta}
        </Link>
        <div className="text-[11px] text-stone-500">{fila.propietario}</div>
      </td>

      <td className="px-3 py-2 align-top text-stone-700">
        {fila.inquilino ?? "—"}
        {fila.observaciones && (
          <div className="text-[11px] italic text-stone-500">{fila.observaciones}</div>
        )}
        {fila.saldoDelMes > 1 && (
          <div className="tabular text-[11px] font-semibold text-amber-800">
            Queda debiendo {formatearMoneda(fila.saldoDelMes, fila.moneda)}
          </div>
        )}
        {fila.mesesAdeudados > 0 && (
          <div className="text-[11px] font-semibold text-amber-800">
            Debe {fila.mesesAdeudados}{" "}
            {fila.mesesAdeudados === 1 ? "mes anterior" : "meses anteriores"}
          </div>
        )}
      </td>

      <td className="tabular px-3 py-2 text-right align-top">
        {fila.monto != null ? formatearMoneda(fila.monto, fila.moneda) : "—"}
      </td>

      <td className="tabular px-3 py-2 text-right align-top font-semibold">
        {fila.cobrado != null ? formatearMoneda(fila.cobrado, fila.moneda) : "—"}
      </td>

      <td className="tabular px-3 py-2 text-right align-top text-stone-600">
        {fila.honorarios != null && (
          <span className="text-[11px] text-stone-400">{fila.honorarios}% </span>
        )}
        {paga ? formatearMoneda(fila.honorariosMonto, fila.moneda) : "—"}
      </td>

      <td className="tabular px-3 py-2 text-right align-top">
        {paga ? formatearMoneda(fila.netoPropietario, fila.moneda) : "—"}
      </td>

      <td className="px-3 py-2 align-top text-stone-600">
        {fila.medioPago ? etiqueta(fila.medioPago) : "—"}
      </td>

      <td className="whitespace-nowrap px-3 py-2 align-top">
        <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${TONOS_CHIP[estado]}`}>
          {ETIQUETA_ESTADO[estado]}
        </span>
        {paga ? (
          <Link
            href={`/cobros/${fila.cobroId}`}
            className="mt-1 block text-[11px] text-stone-600 hover:text-marca-700 hover:underline"
          >
            Recibo {fila.fechaPago ? `del ${formatearFecha(fila.fechaPago)}` : ""}
          </Link>
        ) : (
          <Link
            href={`/cobros/nuevo?contrato=${fila.contratoId}&periodo=${periodo}`}
            className="mt-1 block rounded-lg bg-marca-600 px-2.5 py-1 text-center text-xs font-semibold text-white hover:bg-marca-700"
          >
            {vence < hoyISO() ? "Cobrar · atrasado" : "Cobrar"}
          </Link>
        )}
      </td>
    </tr>
  );
}

function Encabezados() {
  const columnas = [
    "Unidad", "Inquilino", "Alquiler", "Cobrado", "Honorarios", "Neto al dueño", "Pago", "",
  ];
  return (
    <thead>
      <tr className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wide text-stone-500">
        {columnas.map((c, i) => (
          <th
            key={c || i}
            scope="col"
            className={`px-3 py-2 font-medium ${i >= 2 && i <= 5 ? "text-right" : "text-left"}`}
          >
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export default async function Planilla({
  searchParams,
}: {
  searchParams: Promise<{
    periodo?: string; q?: string; orden?: string; tipo?: string; agrupar?: string; estado?: string;
  }>;
}) {
  const {
    periodo: periodoParam, q = "", orden = "direccion", tipo = "todos",
    agrupar: criterio = "ninguno", estado = "todos",
  } = await searchParams;

  const supabase = await createClient();
  const periodo = primerDiaDelMes(periodoParam ?? hoyISO());

  // Se mira un año para atrás para saber quién arrastra meses sin pagar.
  const desde = sumarMeses(periodo, -12);

  const [{ data: contratos }, { data: cobros }, { data: historicos }] = await Promise.all([
    supabase
      .from("contratos")
      .select(
        "id, monto_actual, moneda, dia_vencimiento, indice, honorarios_porcentaje, fecha_inicio, fecha_fin, fecha_proximo_ajuste, observaciones, inquilinos(nombre), propiedades(id, direccion, piso_depto, localidad, tipo, estado, edificio, propietarios(id, nombre))"
      )
      .eq("estado", "activo")
      .is("deleted_at", null),
    // El detalle hace falta para separar el alquiler de las expensas y los
    // punitorios: el saldo se mide contra el alquiler, no contra el total.
    supabase
      .from("cobros")
      .select("id, contrato_id, total, medio_pago, fecha_pago, cobro_conceptos(tipo, monto)")
      .eq("periodo", periodo)
      .is("anulado_at", null),
    supabase
      .from("cobros")
      .select("contrato_id, periodo")
      .gte("periodo", desde)
      .lt("periodo", periodo)
      .is("anulado_at", null),
  ]);

  type CobroDelMes = {
    id: string; contrato_id: string; total: number; medio_pago: string;
    fecha_pago: string; cobro_conceptos: { tipo: string; monto: number }[];
  };

  const cobroPorContrato = new Map(
    ((cobros ?? []) as unknown as CobroDelMes[]).map((c) => [c.contrato_id, c])
  );

  // Qué períodos ya tiene cobrados cada contrato.
  const periodosPorContrato = new Map<string, Set<string>>();
  for (const h of historicos ?? []) {
    const suyos = periodosPorContrato.get(h.contrato_id) ?? new Set<string>();
    suyos.add(h.periodo);
    periodosPorContrato.set(h.contrato_id, suyos);
  }

  const filas: FilaPlanilla[] = ((contratos ?? []) as unknown as FilaContrato[]).map((c) => {
    const p = c.propiedades;
    const unidad: Unidad = {
      id: p?.id ?? c.id,
      direccion: p?.direccion ?? "",
      pisoDepto: p?.piso_depto ?? null,
      direccionCompleta: `${p?.direccion ?? ""}${p?.piso_depto ? ` ${p.piso_depto}` : ""}`,
      localidad: p?.localidad ?? null,
      tipo: p?.tipo ?? "otro",
      estado: p?.estado ?? "alquilado",
      edificio: p?.edificio ?? null,
      propietarioId: p?.propietarios?.id ?? null,
      propietario: p?.propietarios?.nombre ?? "",
      contratoId: c.id,
      inquilino: c.inquilinos?.nombre ?? null,
      monto: Number(c.monto_actual),
      moneda: c.moneda,
      indice: c.indice,
      honorarios: Number(c.honorarios_porcentaje),
      fechaFin: c.fecha_fin,
      proximoAjuste: c.fecha_proximo_ajuste,
    };

    const cobro = cobroPorContrato.get(c.id);
    const alquilerCobrado = (cobro?.cobro_conceptos ?? [])
      .filter((x) => x.tipo === "alquiler")
      .reduce((suma, x) => suma + Number(x.monto), 0);

    const mesesAdeudados = contarMesesAdeudados({
      fechaInicio: c.fecha_inicio,
      periodoActual: periodo,
      periodosCobrados: periodosPorContrato.get(c.id) ?? new Set(),
    });

    return armarFila(
      unidad,
      cobro ? { ...cobro, alquilerCobrado } : null,
      c.observaciones,
      mesesAdeudados
    );
  });

  const filtradas = filas
    .filter((f) => (tipo === "todos" ? true : f.tipo === tipo))
    .filter((f) => (estado === "todos" ? true : estadoDeFila(f) === estado))
    .filter((f) => coincide(f, q));

  const listadas = ordenar(filtradas, orden as Orden);
  const grupos = agrupar(filtradas, criterio as Agrupado, orden as Orden);
  const t = totales(listadas);

  return (
    <div>
      <Titulo>Planilla del mes</Titulo>

      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3">
        <Link href={`/cobros?periodo=${sumarMeses(periodo, -1)}`} className="boton-secundario px-3 py-1.5">←</Link>
        <div className="text-center">
          <div className="font-titulo text-lg font-bold capitalize">{nombreDelPeriodo(periodo)}</div>
          <div className="tabular text-xs text-stone-500">
            {t.abonadas} abonadas · {t.conSaldo} con saldo · {t.impagas} impagas
          </div>
        </div>
        <Link href={`/cobros?periodo=${sumarMeses(periodo, 1)}`} className="boton-secundario px-3 py-1.5">→</Link>
      </div>

      <FiltrosUnidades
        tipos={TIPOS_PROPIEDAD.map((x) => ({ valor: x, texto: etiqueta(x) }))}
        estados={[
          { valor: "todos", texto: "Todas" },
          { valor: "abonado", texto: "Solo abonadas" },
          { valor: "con_saldo", texto: "Solo con saldo" },
          { valor: "impago", texto: "Solo impagas" },
        ]}
      />

      {listadas.length === 0 ? (
        <Vacio
          texto={
            filas.length === 0
              ? "No hay contratos activos para armar la planilla."
              : "Ninguna unidad coincide con lo que buscaste."
          }
          accion={
            filas.length === 0
              ? { href: "/contratos/nuevo", texto: "Cargar contrato" }
              : undefined
          }
        />
      ) : (
        <div className="space-y-7">
          {(grupos.length > 0
            ? grupos
            : [{ clave: "todo", titulo: "", subtitulo: null, href: null, unidades: listadas, renta: 0, alquiladas: 0, vacantes: 0 }]
          ).map((grupo) => {
            const delGrupo = totales(grupo.unidades);
            return (
              <section key={grupo.clave}>
                {grupo.titulo && (
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-stone-200 pb-2">
                    <div>
                      {grupo.href ? (
                        <Link href={grupo.href} className="font-titulo text-lg font-bold hover:text-marca-700">
                          {grupo.titulo}
                        </Link>
                      ) : (
                        <span className="font-titulo text-lg font-bold">{grupo.titulo}</span>
                      )}
                      {grupo.subtitulo && (
                        <span className="ml-2 text-xs text-stone-500">{grupo.subtitulo}</span>
                      )}
                    </div>
                    <div className="tabular text-xs text-stone-600">
                      {delGrupo.abonadas}/{delGrupo.unidades} abonadas
                      {delGrupo.conSaldo + delGrupo.impagas > 0 && (
                        <span className="text-amber-800">
                          {" "}· {formatearCorto(delGrupo.faltaCobrar + delGrupo.saldos)} sin entrar
                        </span>
                      )}{" "}
                      · <span className="font-semibold">{formatearCorto(delGrupo.netoPropietarios)}</span>{" "}
                      al dueño
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
                  <table className="w-full min-w-[52rem] text-sm">
                    <Encabezados />
                    <tbody className="divide-y divide-stone-100">
                      {grupo.unidades.map((f) => (
                        <Fila key={f.contratoId ?? f.id} fila={f} periodo={periodo} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}

          <div className="overflow-x-auto rounded-xl border-2 border-stone-300 bg-stone-50">
            <table className="w-full min-w-[52rem] text-sm">
              <tbody>
                <tr className="font-semibold">
                  <td className="px-3 py-3">Total de {t.unidades} unidades</td>
                  <td className="px-3 py-3 text-stone-600">
                    {t.abonadas} abonadas · {t.conSaldo} con saldo · {t.impagas} impagas
                    {t.faltaCobrar + t.saldos > 0 && (
                      <span className="tabular block text-[11px] font-semibold text-amber-800">
                        Sin entrar: {formatearMoneda(t.faltaCobrar + t.saldos)}
                      </span>
                    )}
                  </td>
                  <td className="tabular px-3 py-3 text-right">{formatearMoneda(t.alquilerEsperado)}</td>
                  <td className="tabular px-3 py-3 text-right text-marca-800">{formatearMoneda(t.cobrado)}</td>
                  <td className="tabular px-3 py-3 text-right">{formatearMoneda(t.honorarios)}</td>
                  <td className="tabular px-3 py-3 text-right">{formatearMoneda(t.netoPropietarios)}</td>
                  <td colSpan={2} className="px-3 py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm border-l-4 border-marca-500 bg-marca-50"></span>
              Abonado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm border-l-4 border-amber-400 bg-amber-50"></span>
              Con saldo o deuda de meses anteriores
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm border-l-4 border-orange-500 bg-orange-50"></span>
              Impago
            </span>
            <span>
              Los totales suman solo los contratos en pesos: mezclar monedas daría
              un número que no significa nada.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
