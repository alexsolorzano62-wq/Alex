"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  mesesConVencimientos,
  proyeccionDelMes,
  type LineaCronograma,
} from "@/lib/agregados";
import { formatFechaCorta, nombreMes } from "@/lib/fechas";
import { plata } from "@/lib/format";
import { textoCuotas } from "@/lib/periodos";

/**
 * Lo que vence en un mes, discriminado.
 *
 * El cronograma entero llega calculado del servidor; acá solo se elige el mes,
 * así cambiarlo es instantáneo y no vuelve a pedir nada.
 */
export default function ProyeccionMes({
  pendiente,
  mesActual,
}: {
  pendiente: LineaCronograma[];
  mesActual: string;
}) {
  const meses = useMemo(() => mesesConVencimientos(pendiente), [pendiente]);

  // Arranca en el mes en curso si tiene algo pendiente; si ya está todo
  // cobrado, en el primero que venga después.
  const inicial =
    meses.find((mes) => mes >= mesActual) ?? meses[meses.length - 1] ?? mesActual;
  const [mes, setMes] = useState(inicial);

  const proyeccion = useMemo(
    () => proyeccionDelMes(pendiente, mes),
    [pendiente, mes]
  );

  if (meses.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 px-4 py-8 text-center text-sm text-slate-600 dark:text-slate-400">
        No hay cuotas pendientes: no tenés nada por cobrar.
      </p>
    );
  }

  const porcentajeCapital =
    proyeccion.monto > 0
      ? Math.round((proyeccion.capital / proyeccion.monto) * 100)
      : 0;

  return (
    <>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Mes
        </span>
        <select
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          {meses.map((valor) => (
            <option key={valor} value={valor}>
              {nombreMes(valor)}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
          Si todos pagan
        </p>
        <p className="tabular text-3xl font-bold text-slate-900 dark:text-slate-100">
          {plata(proyeccion.monto)}
        </p>
        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
          {proyeccion.cuotas} cuota{proyeccion.cuotas === 1 ? "" : "s"} de{" "}
          {proyeccion.lineas.length} préstamo
          {proyeccion.lineas.length === 1 ? "" : "s"} en {nombreMes(mes)}
        </p>

        {/* El desglose: cuánto es plata que vuelve y cuánto es ganancia. */}
        <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-brand-500"
            style={{ width: `${porcentajeCapital}%` }}
          />
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${100 - porcentajeCapital}%` }}
          />
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-brand-50 dark:bg-brand-900/30 p-3">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500"
              />
              Capital recuperado
            </dt>
            <dd className="tabular mt-0.5 text-lg font-bold text-brand-700 dark:text-brand-300">
              {plata(proyeccion.capital)}
            </dd>
            <dd className="text-xs text-slate-600 dark:text-slate-400">
              {porcentajeCapital}% de lo que entra
            </dd>
          </div>
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/30 p-3">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500"
              />
              Interés ganado
            </dt>
            <dd className="tabular mt-0.5 text-lg font-bold text-emerald-700 dark:text-emerald-400">
              {plata(proyeccion.interes)}
            </dd>
            <dd className="text-xs text-slate-600 dark:text-slate-400">
              {100 - porcentajeCapital}% de lo que entra
            </dd>
          </div>
        </dl>

        {proyeccion.vencidas > 0 && (
          <p className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
            <span aria-hidden="true">⚠</span> {proyeccion.vencidas} de esas cuotas ya
            vencieron ({plata(proyeccion.montoVencido)}): son atraso, no plata que
            esté por entrar.
          </p>
        )}

        <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
          Cada cuota se cuenta primero contra la plata que pusiste, y lo que sobra
          es ganancia. Por eso los préstamos nuevos aportan casi todo capital y los
          que ya están por terminar, casi todo interés.
        </p>
      </div>

      <h3 className="mb-2 mt-4 text-sm font-bold text-slate-900 dark:text-slate-100">
        El detalle, uno por uno
      </h3>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {proyeccion.lineas.map((linea) => {
          const numeros = linea.cuotas
            .map((cuota) => cuota.numero)
            .filter((numero): numero is number => numero != null);
          const vencidas = linea.cuotas.filter((cuota) => cuota.vencida).length;

          return (
            <li key={linea.prestamoId} className="px-4 py-3">
              <Link
                href={`/prestamos/${linea.prestamoId}`}
                className="flex items-baseline justify-between gap-3"
              >
                <span className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {linea.cliente}
                </span>
                <span className="tabular shrink-0 text-sm font-bold">
                  {plata(linea.monto)}
                </span>
              </Link>

              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                {linea.modalidad === "mensual"
                  ? "Interés del mes"
                  : textoCuotas(linea.cuotas.length, linea.frecuencia)}
                {numeros.length > 0 && linea.cuotasTotal ? (
                  <>
                    {" · "}
                    {numeros.length === 1
                      ? `n° ${numeros[0]}`
                      : `n° ${numeros[0]} a ${numeros[numeros.length - 1]}`}{" "}
                    de {linea.cuotasTotal}
                  </>
                ) : null}
              </p>

              <p className="tabular mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="text-brand-700 dark:text-brand-300">
                  capital {plata(linea.capital)}
                </span>
                {" · "}
                <span className="text-emerald-700 dark:text-emerald-400">
                  interés {plata(linea.interes)}
                </span>
              </p>

              <p className="mt-1 flex flex-wrap gap-1.5">
                {linea.cuotas.map((cuota) => (
                  <span
                    key={cuota.fecha}
                    className={`tabular rounded-md px-1.5 py-0.5 text-[11px] ${
                      cuota.vencida
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {formatFechaCorta(cuota.fecha)}
                    {cuota.vencida && <span aria-hidden="true"> ⚠</span>}
                  </span>
                ))}
              </p>

              {vencidas > 0 && (
                <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-300">
                  {vencidas} ya venció{vencidas === 1 ? "" : "eron"}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
