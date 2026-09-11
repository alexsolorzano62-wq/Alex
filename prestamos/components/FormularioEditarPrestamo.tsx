"use client";

import { useActionState, useState } from "react";
import { editarPrestamo } from "@/app/acciones";
import CampoTexto, { claseInput } from "@/components/CampoTexto";
import { tasaImplicita } from "@/lib/calc";
import { frecuenciaDe, textoCuotas } from "@/lib/periodos";
import { parsearPesos, parsearTasa } from "@/lib/parseo";
import { plata, porcentaje } from "@/lib/format";
import type { PrestamoConCliente } from "@/lib/types";

export default function FormularioEditarPrestamo({
  prestamo,
}: {
  prestamo: PrestamoConCliente;
}) {
  const [estado, accion, enviando] = useActionState(editarPrestamo, undefined);

  const esPlan = prestamo.modalidad !== "mensual";

  const [capital, setCapital] = useState(prestamo.capital_inicial.toLocaleString("es-AR"));
  const [tasa, setTasa] = useState(String(prestamo.tasa_mensual));
  const [cuotas, setCuotas] = useState(String(prestamo.cuotas_total ?? ""));
  const [cuotaMonto, setCuotaMonto] = useState(
    prestamo.cuota_monto ? prestamo.cuota_monto.toLocaleString("es-AR") : ""
  );

  const capitalNum = parsearPesos(capital) ?? 0;
  const cuotasNum = Number(cuotas) || 0;
  const cuotaNum = parsearPesos(cuotaMonto) ?? 0;
  const tasaNum = parsearTasa(tasa) ?? 0;

  const total = esPlan ? cuotaNum * cuotasNum : capitalNum * (1 + tasaNum / 100);
  const tasaReal = esPlan ? tasaImplicita(capitalNum, total) : tasaNum;

  return (
    <form action={accion} className="space-y-4">
      <input type="hidden" name="id" value={prestamo.id} />

      <p className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
        Se corrigen los números y las fechas. Los {prestamo.pagos.length} cobro
        {prestamo.pagos.length === 1 ? "" : "s"} ya registrado
        {prestamo.pagos.length === 1 ? "" : "s"} quedan como están. La modalidad no se
        cambia: si te equivocaste de modalidad, conviene borrar el préstamo y cargarlo
        de nuevo.
      </p>

      <CampoTexto etiqueta="Monto prestado">
        <input
          name="capital"
          value={capital}
          onChange={(e) => setCapital(e.target.value)}
          inputMode="decimal"
          required
          className={claseInput}
        />
      </CampoTexto>

      {esPlan ? (
        <div className="grid grid-cols-2 gap-3">
          <CampoTexto etiqueta="Cantidad de cuotas">
            <input
              name="cuotas"
              value={cuotas}
              onChange={(e) => setCuotas(e.target.value)}
              inputMode="numeric"
              required
              className={claseInput}
            />
          </CampoTexto>
          <CampoTexto etiqueta="Cuánto es cada una">
            <input
              name="cuota_monto"
              value={cuotaMonto}
              onChange={(e) => setCuotaMonto(e.target.value)}
              inputMode="decimal"
              required
              className={claseInput}
            />
          </CampoTexto>
        </div>
      ) : (
        <CampoTexto etiqueta="Tasa mensual %">
          <input
            name="tasa"
            value={tasa}
            onChange={(e) => setTasa(e.target.value)}
            inputMode="decimal"
            className={claseInput}
          />
        </CampoTexto>
      )}

      <div className="grid grid-cols-2 gap-3">
        <CampoTexto etiqueta="Fecha de inicio">
          <input
            name="fecha_inicio"
            type="date"
            defaultValue={prestamo.fecha_inicio}
            required
            className={claseInput}
          />
        </CampoTexto>
        <CampoTexto
          etiqueta="Próximo vencimiento"
          ayuda="Se corre solo con cada cobro."
        >
          <input
            name="fecha_vencimiento"
            type="date"
            defaultValue={prestamo.fecha_vencimiento}
            required
            className={claseInput}
          />
        </CampoTexto>
      </div>

      <CampoTexto etiqueta="Observación (opcional)">
        <input
          name="observacion"
          defaultValue={prestamo.observacion ?? ""}
          className={claseInput}
        />
      </CampoTexto>

      {capitalNum > 0 && total > 0 && (
        <div className="rounded-2xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
            Así queda
          </p>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600 dark:text-slate-400">Presta</dt>
              <dd className="tabular font-medium">{plata(capitalNum)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600 dark:text-slate-400">Interés ({porcentaje(tasaReal)})</dt>
              <dd className="tabular font-medium">{plata(total - capitalNum)}</dd>
            </div>
            <div className="flex justify-between border-t border-brand-200 dark:border-brand-800 pt-1.5">
              <dt className="font-semibold text-slate-800 dark:text-slate-200">A devolver</dt>
              <dd className="tabular text-base font-bold text-brand-700 dark:text-brand-300">
                {plata(total)}
              </dd>
            </div>
            {esPlan && cuotasNum > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-600 dark:text-slate-400">Plan</dt>
                <dd className="tabular font-medium">
                  {textoCuotas(cuotasNum, frecuenciaDe(prestamo))} de {plata(cuotaNum)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {estado?.error && (
        <p className="rounded-xl bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white active:bg-brand-700 disabled:opacity-60"
      >
        {enviando ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
