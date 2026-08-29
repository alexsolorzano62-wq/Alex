import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { registrarAviso } from "@/app/acciones";
import { Titulo, Vacio } from "@/components/Ui";
import { BotonAviso } from "@/components/BotonAviso";
import { formatearMoneda } from "@/lib/dinero";
import {
  diasEntre, formatearFecha, hoyISO, nombreDelPeriodo, primerDiaDelMes,
  vencimientoDelPeriodo,
} from "@/lib/fechas";
import {
  avisoDeAumento, avisoDeLiquidacion, avisoDeVencimiento,
  ETIQUETA_AVISO, type TipoAviso,
} from "@/lib/avisos";
import type { Moneda } from "@/lib/types";

export const dynamic = "force-dynamic";

type Pendiente = {
  clave: string;
  tipo: TipoAviso;
  titulo: string;
  detalle: string;
  mensaje: string;
  telefono: string | null;
  contratoId: string | null;
  liquidacionId: string | null;
  periodo: string | null;
  href: string;
  urgente: boolean;
  enviadoEl: string | null;
};

function Seccion({
  titulo, ayuda, pendientes,
}: {
  titulo: string;
  ayuda: string;
  pendientes: Pendiente[];
}) {
  if (pendientes.length === 0) return null;

  return (
    <section>
      <div className="mb-2 border-b border-stone-200 pb-2">
        <h2 className="font-titulo text-lg font-bold">
          {titulo} <span className="text-stone-400">({pendientes.length})</span>
        </h2>
        <p className="text-xs text-stone-500">{ayuda}</p>
      </div>

      <ul className="space-y-2">
        {pendientes.map((p) => (
          <li
            key={p.clave}
            className={`tarjeta flex flex-wrap items-start justify-between gap-4 ${
              p.urgente ? "border-amber-300 bg-amber-50/60" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <Link href={p.href} className="font-titulo text-base font-bold hover:text-marca-700">
                {p.titulo}
              </Link>
              <div className="mt-0.5 text-xs text-stone-500">{p.detalle}</div>
              {p.enviadoEl && (
                <div className="mt-1 text-[11px] font-semibold text-stone-500">
                  Ya se avisó el {formatearFecha(p.enviadoEl)}
                </div>
              )}
              {!p.telefono && (
                <div className="mt-1 text-[11px] font-semibold text-amber-800">
                  Sin teléfono cargado: WhatsApp va a abrir sin el contacto elegido.
                </div>
              )}
            </div>

            <BotonAviso
              accion={registrarAviso}
              tipo={p.tipo}
              mensaje={p.mensaje}
              telefono={p.telefono}
              contratoId={p.contratoId}
              liquidacionId={p.liquidacionId}
              periodo={p.periodo}
              yaEnviado={p.enviadoEl != null}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function Avisos() {
  const supabase = await createClient();
  const hoy = hoyISO();
  const periodo = primerDiaDelMes(hoy);

  const [
    { data: contratos },
    { data: cobros },
    { data: ajustes },
    { data: liquidaciones },
    { data: enviados },
  ] = await Promise.all([
    supabase
      .from("contratos")
      .select(
        "id, monto_actual, moneda, dia_vencimiento, indice, inquilinos(nombre, telefono), propiedades(direccion, piso_depto)"
      )
      .eq("estado", "activo")
      .is("deleted_at", null)
      .limit(2000),
    supabase
      .from("cobros")
      .select("contrato_id")
      .eq("periodo", periodo)
      .is("anulado_at", null)
      .limit(2000),
    // Aumentos ya aplicados a los que todavía no se les avisó al inquilino.
    supabase
      .from("ajustes")
      .select(
        "id, contrato_id, fecha_aplicacion, indice, monto_anterior, monto_nuevo, contratos(id, moneda, inquilinos(nombre, telefono), propiedades(direccion, piso_depto))"
      )
      .is("notificado_at", null)
      .order("fecha_aplicacion", { ascending: false })
      .limit(500),
    supabase
      .from("liquidaciones")
      .select(
        "id, periodo, moneda, neto_a_pagar, metodo_pago, estado, propietarios(nombre, telefono), liquidacion_detalle(id)"
      )
      .in("estado", ["emitida", "pagada"])
      .eq("periodo", periodo)
      .is("anulado_at", null)
      .limit(500),
    supabase
      .from("avisos_enviados")
      .select("tipo, contrato_id, liquidacion_id, periodo, enviado_at")
      .gte("enviado_at", `${periodo}T00:00:00Z`)
      .limit(5000),
  ]);

  // Qué avisos ya salieron este mes, para no repetirlos.
  const yaAvisado = new Map<string, string>();
  for (const a of enviados ?? []) {
    const clave = `${a.tipo}:${a.contrato_id ?? a.liquidacion_id}:${a.periodo ?? ""}`;
    const anterior = yaAvisado.get(clave);
    if (!anterior || a.enviado_at > anterior) yaAvisado.set(clave, a.enviado_at);
  }

  const cobrados = new Set((cobros ?? []).map((c) => c.contrato_id));

  // ------------------------------------------------------ recordatorios --
  const vencimientos: Pendiente[] = [];

  for (const c of contratos ?? []) {
    if (cobrados.has(c.id)) continue;

    const inquilino = c.inquilinos as unknown as { nombre: string; telefono: string | null } | null;
    const propiedad = c.propiedades as unknown as { direccion: string; piso_depto: string | null } | null;
    const direccion = `${propiedad?.direccion ?? ""}${propiedad?.piso_depto ? ` ${propiedad.piso_depto}` : ""}`;
    const vence = vencimientoDelPeriodo(periodo, c.dia_vencimiento);
    const atraso = Math.max(0, diasEntre(vence, hoy));

    // Antes del vencimiento se avisa recién dos días antes: mandar el aviso el
    // día 1 para algo que vence el 10 solo enseña a ignorarlo.
    if (atraso === 0 && diasEntre(hoy, vence) > 2) continue;

    const enviado = yaAvisado.get(`vencimiento:${c.id}:${periodo}`) ?? null;

    vencimientos.push({
      clave: `venc-${c.id}`,
      tipo: "vencimiento",
      titulo: direccion,
      detalle: `${inquilino?.nombre ?? ""} · ${formatearMoneda(Number(c.monto_actual), c.moneda as Moneda)} · ${
        atraso > 0 ? `${atraso} ${atraso === 1 ? "día" : "días"} de atraso` : `vence el ${formatearFecha(vence)}`
      }`,
      mensaje: avisoDeVencimiento({
        inquilino: inquilino?.nombre ?? "",
        direccion,
        periodo,
        vencimiento: vence,
        monto: Number(c.monto_actual),
        moneda: c.moneda as Moneda,
        diasDeAtraso: atraso,
      }),
      telefono: inquilino?.telefono ?? null,
      contratoId: c.id,
      liquidacionId: null,
      periodo,
      href: `/contratos/${c.id}`,
      urgente: atraso > 0,
      enviadoEl: enviado,
    });
  }

  vencimientos.sort((a, b) => Number(b.urgente) - Number(a.urgente));

  // ------------------------------------------------------------ aumentos --
  const aumentos: Pendiente[] = (ajustes ?? []).map((a) => {
    const contrato = a.contratos as unknown as {
      id: string; moneda: string;
      inquilinos: { nombre: string; telefono: string | null } | null;
      propiedades: { direccion: string; piso_depto: string | null } | null;
    } | null;

    const direccion = `${contrato?.propiedades?.direccion ?? ""}${
      contrato?.propiedades?.piso_depto ? ` ${contrato.propiedades.piso_depto}` : ""
    }`;

    return {
      clave: `aum-${a.id}`,
      tipo: "aumento" as const,
      titulo: direccion,
      detalle: `${contrato?.inquilinos?.nombre ?? ""} · ${formatearMoneda(
        Number(a.monto_anterior), (contrato?.moneda ?? "ARS") as Moneda
      )} → ${formatearMoneda(Number(a.monto_nuevo), (contrato?.moneda ?? "ARS") as Moneda)} desde el ${formatearFecha(a.fecha_aplicacion)}`,
      mensaje: avisoDeAumento({
        inquilino: contrato?.inquilinos?.nombre ?? "",
        direccion,
        montoAnterior: Number(a.monto_anterior),
        montoNuevo: Number(a.monto_nuevo),
        moneda: (contrato?.moneda ?? "ARS") as Moneda,
        desde: a.fecha_aplicacion,
        indice: a.indice,
      }),
      telefono: contrato?.inquilinos?.telefono ?? null,
      contratoId: a.contrato_id,
      liquidacionId: null,
      periodo: null,
      href: `/contratos/${a.contrato_id}`,
      urgente: false,
      enviadoEl: yaAvisado.get(`aumento:${a.contrato_id}:`) ?? null,
    };
  });

  // ------------------------------------------------------- liquidaciones --
  const rendiciones: Pendiente[] = (liquidaciones ?? []).map((l) => {
    const propietario = l.propietarios as unknown as { nombre: string; telefono: string | null } | null;
    const renglones = (l.liquidacion_detalle ?? []) as { id: string }[];

    return {
      clave: `liq-${l.id}`,
      tipo: "liquidacion" as const,
      titulo: propietario?.nombre ?? "",
      detalle: `${nombreDelPeriodo(l.periodo)} · ${formatearMoneda(
        Number(l.neto_a_pagar), l.moneda as Moneda
      )} · ${l.estado === "pagada" ? "ya pagada" : "emitida, falta pagar"}`,
      mensaje: avisoDeLiquidacion({
        propietario: propietario?.nombre ?? "",
        periodo: l.periodo,
        neto: Number(l.neto_a_pagar),
        moneda: l.moneda as Moneda,
        unidades: renglones.length,
        metodoPago: l.metodo_pago,
      }),
      telefono: propietario?.telefono ?? null,
      contratoId: null,
      liquidacionId: l.id,
      periodo: l.periodo,
      href: `/liquidaciones/${l.id}`,
      urgente: false,
      enviadoEl: yaAvisado.get(`liquidacion:${l.id}:${l.periodo}`) ?? null,
    };
  });

  const total = vencimientos.length + aumentos.length + rendiciones.length;
  const sinAvisar = [...vencimientos, ...aumentos, ...rendiciones].filter((p) => !p.enviadoEl).length;

  return (
    <div>
      <Titulo>Avisos</Titulo>

      <p className="mb-5 max-w-2xl text-sm text-stone-600">
        La app arma el mensaje y abre tu WhatsApp con el texto escrito; vos tocás
        enviar. No se manda nada solo, y queda registrado a quién se le avisó y
        cuándo. <strong>{sinAvisar}</strong> de {total} sin avisar todavía.
      </p>

      {total === 0 ? (
        <Vacio texto="No hay nada para avisar hoy. Está todo cobrado, sin aumentos nuevos y sin liquidaciones para comunicar." />
      ) : (
        <div className="space-y-8">
          <Seccion
            titulo="Recordatorios de pago"
            ayuda="Los que vencen en los próximos dos días y los que ya están atrasados."
            pendientes={vencimientos}
          />
          <Seccion
            titulo="Aumentos aplicados"
            ayuda="Aumentos ya aplicados a los que todavía no se les avisó al inquilino."
            pendientes={aumentos}
          />
          <Seccion
            titulo="Liquidaciones del mes"
            ayuda="Para avisarle a cada propietario que su liquidación está lista."
            pendientes={rendiciones}
          />
        </div>
      )}
    </div>
  );
}
