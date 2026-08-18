"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { crearPrestamo } from "@/app/acciones";
import CampoTexto, { claseInput } from "@/components/CampoTexto";
import { calcularPlan, tasaImplicita } from "@/lib/calc";
import { formatFecha, hoyISO, sumarMeses } from "@/lib/fechas";
import { parsearPesos, parsearTasa } from "@/lib/parseo";
import { plata, porcentaje } from "@/lib/format";
import type { Cliente, Modalidad } from "@/lib/types";

export default function FormularioPrestamo({ clientes }: { clientes: Cliente[] }) {
  const [estado, accion, enviando] = useActionState(crearPrestamo, undefined);

  const [modalidad, setModalidad] = useState<Modalidad>("mensual");
  const [capital, setCapital] = useState("");
  const [tasa, setTasa] = useState("30");
  const [fechaInicio, setFechaInicio] = useState(hoyISO());
  const [plazoMeses, setPlazoMeses] = useState("1");
  const [cuotas, setCuotas] = useState("3");
  const [totalManual, setTotalManual] = useState("");

  // Vista previa: lo mismo que va a quedar guardado, calculado mientras escribís.
  const capitalNum = parsearPesos(capital) ?? 0;
  const tasaNum = parsearTasa(tasa) ?? 0;
  const cuotasNum = Number(cuotas) || 1;
  const totalManualNum = parsearPesos(totalManual);
  const plan = calcularPlan({
    modalidad,
    capital: capitalNum,
    tasa: tasaNum,
    cuotas: cuotasNum,
    totalManual: totalManualNum,
  });
  const vencimiento = sumarMeses(
    fechaInicio || hoyISO(),
    modalidad === "cuotas" ? 1 : Math.max(1, Number(plazoMeses) || 1)
  );
  const tasaReal =
    modalidad === "cuotas" && totalManualNum
      ? tasaImplicita(capitalNum, totalManualNum)
      : tasaNum;

  if (clientes.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-600">
          Primero cargá un cliente y después le creás el préstamo.
        </p>
        <Link
          href="/clientes/nuevo"
          className="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Cargar cliente
        </Link>
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-4">
      <input type="hidden" name="modalidad" value={modalidad} />

      <CampoTexto etiqueta="Cliente">
        <select name="cliente_id" required className={claseInput} defaultValue="">
          <option value="" disabled>
            Elegí el cliente
          </option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre}
            </option>
          ))}
        </select>
      </CampoTexto>

      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Cómo lo devuelve
        </span>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { valor: "mensual", titulo: "Interés mensual", detalle: "Paga el interés y renueva" },
              { valor: "cuotas", titulo: "En cuotas", detalle: "Plan cerrado en N cuotas" },
            ] as const
          ).map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => setModalidad(opcion.valor)}
              aria-pressed={modalidad === opcion.valor}
              className={`rounded-xl border px-3 py-2.5 text-left ${
                modalidad === opcion.valor
                  ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
                  : "border-slate-300 bg-white"
              }`}
            >
              <span className="block text-sm font-semibold text-slate-800">
                {opcion.titulo}
              </span>
              <span className="block text-[11px] text-slate-500">{opcion.detalle}</span>
            </button>
          ))}
        </div>
      </div>

      <CampoTexto etiqueta="Monto que prestás">
        <input
          name="capital"
          value={capital}
          onChange={(e) => setCapital(e.target.value)}
          inputMode="decimal"
          placeholder="200.000"
          required
          className={claseInput}
        />
      </CampoTexto>

      <div className="grid grid-cols-2 gap-3">
        <CampoTexto
          etiqueta={modalidad === "mensual" ? "Tasa mensual %" : "Tasa del plan %"}
        >
          <input
            name="tasa"
            value={tasa}
            onChange={(e) => setTasa(e.target.value)}
            inputMode="decimal"
            placeholder="30"
            className={claseInput}
          />
        </CampoTexto>

        <CampoTexto etiqueta="Fecha de inicio">
          <input
            name="fecha_inicio"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            required
            className={claseInput}
          />
        </CampoTexto>
      </div>

      {modalidad === "mensual" ? (
        <CampoTexto etiqueta="Vence en" ayuda="Después lo vas renovando mes a mes.">
          <select
            name="plazo_meses"
            value={plazoMeses}
            onChange={(e) => setPlazoMeses(e.target.value)}
            className={claseInput}
          >
            {[1, 2, 3, 4, 5, 6, 9, 12].map((meses) => (
              <option key={meses} value={meses}>
                {meses === 1 ? "1 mes" : `${meses} meses`}
              </option>
            ))}
          </select>
        </CampoTexto>
      ) : (
        <>
          <CampoTexto etiqueta="Cantidad de cuotas">
            <select
              name="cuotas"
              value={cuotas}
              onChange={(e) => setCuotas(e.target.value)}
              className={claseInput}
            >
              {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? "1 cuota" : `${n} cuotas`}
                </option>
              ))}
            </select>
          </CampoTexto>

          <CampoTexto
            etiqueta="Total a devolver (opcional)"
            ayuda="Si pactaste un número cerrado, ponelo acá y la tasa se calcula sola."
          >
            <input
              name="total_manual"
              value={totalManual}
              onChange={(e) => setTotalManual(e.target.value)}
              inputMode="decimal"
              placeholder={plan.total ? String(plan.total) : "256.110"}
              className={claseInput}
            />
          </CampoTexto>
        </>
      )}

      <CampoTexto etiqueta="Observación (opcional)">
        <input
          name="observacion"
          placeholder="Algo para acordarte"
          className={claseInput}
        />
      </CampoTexto>

      {capitalNum > 0 && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Así queda
          </p>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Presta</dt>
              <dd className="tabular font-medium">{plata(capitalNum)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">
                Interés {modalidad === "mensual" ? "del mes" : "del plan"} (
                {porcentaje(tasaReal)})
              </dt>
              <dd className="tabular font-medium">{plata(plan.interes)}</dd>
            </div>
            <div className="flex justify-between border-t border-brand-200 pt-1.5">
              <dt className="font-semibold text-slate-800">A devolver</dt>
              <dd className="tabular text-base font-bold text-brand-700">
                {plata(plan.total)}
              </dd>
            </div>
            {modalidad === "cuotas" && plan.cuotaMonto && (
              <div className="flex justify-between">
                <dt className="text-slate-600">Cuota</dt>
                <dd className="tabular font-medium">
                  {cuotasNum} × {plata(plan.cuotaMonto)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-600">
                {modalidad === "cuotas" ? "Primer vencimiento" : "Vence"}
              </dt>
              <dd className="font-medium">{formatFecha(vencimiento)}</dd>
            </div>
          </dl>
        </div>
      )}

      {estado?.error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white active:bg-brand-700 disabled:opacity-60"
      >
        {enviando ? "Guardando..." : "Guardar préstamo"}
      </button>
    </form>
  );
}
