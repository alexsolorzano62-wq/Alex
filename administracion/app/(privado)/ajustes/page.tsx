import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { aplicarAjuste } from "@/app/acciones";
import { Titulo, Vacio } from "@/components/Ui";
import { formatearMoneda } from "@/lib/dinero";
import { formatearFecha, hoyISO } from "@/lib/fechas";
import { calcularAjuste } from "@/lib/ajustes";
import { valorDeIndice } from "@/lib/indices";
import type { Indice } from "@/lib/types";
import { FilaAjuste } from "@/components/FilaAjuste";

export const dynamic = "force-dynamic";

type ContratoAjuste = {
  id: string;
  monto_actual: number;
  moneda: "ARS" | "USD";
  indice: Indice;
  ajuste_porcentaje_fijo: number | null;
  ajuste_frecuencia_meses: number;
  fecha_inicio: string;
  fecha_ultimo_ajuste: string | null;
  fecha_proximo_ajuste: string;
  inquilinos: { nombre: string } | null;
  propiedades: { direccion: string; piso_depto: string | null } | null;
};

export default async function Ajustes() {
  const supabase = await createClient();
  const hoy = hoyISO();

  const { data } = await supabase
    .from("contratos")
    .select(
      "id, monto_actual, moneda, indice, ajuste_porcentaje_fijo, ajuste_frecuencia_meses, fecha_inicio, fecha_ultimo_ajuste, fecha_proximo_ajuste, inquilinos(nombre), propiedades(direccion, piso_depto)"
    )
    .eq("estado", "activo")
    .is("deleted_at", null)
    .not("fecha_proximo_ajuste", "is", null)
    .lte("fecha_proximo_ajuste", hoy)
    .order("fecha_proximo_ajuste");

  const contratos = (data ?? []) as unknown as ContratoAjuste[];

  // Se calcula cada aumento contra la serie guardada. Si falta el valor del
  // índice, se dice cuál falta en vez de inventar un número.
  const propuestas = await Promise.all(
    contratos.map(async (c) => {
      const desde = c.fecha_ultimo_ajuste ?? c.fecha_inicio;
      const hasta = c.fecha_proximo_ajuste;

      if (c.indice === "FIJO" || c.indice === "SIN_AJUSTE") {
        try {
          const calculo = calcularAjuste({
            montoActual: Number(c.monto_actual),
            indice: c.indice,
            porcentajeFijo: c.ajuste_porcentaje_fijo,
          });
          return { contrato: c, calculo, base: null, final: null, problema: null };
        } catch (error) {
          return {
            contrato: c, calculo: null, base: null, final: null,
            problema: error instanceof Error ? error.message : "No se pudo calcular.",
          };
        }
      }

      const [base, final] = await Promise.all([
        valorDeIndice(supabase, c.indice, desde),
        valorDeIndice(supabase, c.indice, hasta),
      ]);

      if (base == null || final == null) {
        return {
          contrato: c, calculo: null, base, final,
          problema: `Falta el valor de ${c.indice} para ${base == null ? formatearFecha(desde) : formatearFecha(hasta)}. Actualizá la serie desde Más → Índices.`,
        };
      }

      return {
        contrato: c,
        calculo: calcularAjuste({
          montoActual: Number(c.monto_actual),
          indice: c.indice,
          valorIndiceBase: base,
          valorIndiceFinal: final,
        }),
        base, final, problema: null,
      };
    })
  );

  return (
    <div>
      <Titulo>Aumentos pendientes</Titulo>

      {propuestas.length === 0 ? (
        <Vacio texto="Ningún contrato cumplió período de ajuste todavía." />
      ) : (
        <>
          <p className="mb-4 text-sm text-stone-600">
            {propuestas.length} contratos cumplieron su período. Revisá cada
            monto y aplicalo: el aumento rige para los recibos que emitas después.
          </p>

          <ul className="space-y-3">
            {propuestas.map((p) => (
              <li key={p.contrato.id}>
                {p.problema ? (
                  <div className="tarjeta border-amber-200 bg-amber-50">
                    <Link href={`/contratos/${p.contrato.id}`} className="font-titulo font-bold hover:text-marca-700">
                      {p.contrato.propiedades?.direccion}
                      {p.contrato.propiedades?.piso_depto ? ` ${p.contrato.propiedades.piso_depto}` : ""}
                    </Link>
                    <p className="mt-1 text-sm text-amber-800">{p.problema}</p>
                    <p className="mt-1 text-xs text-stone-600">
                      Alquiler actual: {formatearMoneda(Number(p.contrato.monto_actual), p.contrato.moneda)}
                    </p>
                  </div>
                ) : (
                  <FilaAjuste
                    accion={aplicarAjuste}
                    contratoId={p.contrato.id}
                    titulo={`${p.contrato.propiedades?.direccion ?? ""}${
                      p.contrato.propiedades?.piso_depto ? ` ${p.contrato.propiedades.piso_depto}` : ""
                    }`}
                    subtitulo={`${p.contrato.inquilinos?.nombre ?? ""} · ${p.contrato.indice} · vencía el ${formatearFecha(p.contrato.fecha_proximo_ajuste)}`}
                    moneda={p.contrato.moneda}
                    montoAnterior={p.calculo!.montoAnterior}
                    montoNuevo={p.calculo!.montoNuevo}
                    variacion={p.calculo!.variacionPorcentual}
                    valorBase={p.base}
                    valorFinal={p.final}
                    fechaAplicacion={p.contrato.fecha_proximo_ajuste}
                  />
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
