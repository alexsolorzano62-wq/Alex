"use client";

import { useState } from "react";
import Link from "next/link";
import BotonesWhatsApp from "@/components/BotonesWhatsApp";
import { claseInput } from "@/components/CampoTexto";
import { calcularPlan, tasaImplicita } from "@/lib/calc";
import { plata, porcentaje } from "@/lib/format";
import { parsearPesos, parsearTasa } from "@/lib/parseo";
import { planesPara, PLANES_SEMANALES } from "@/lib/planes";
import { linkWhatsApp } from "@/lib/whatsapp";

/** Montos que están en la lista de precios, para tocar de una. */
const ATAJOS = [...new Set(PLANES_SEMANALES.map((plan) => plan.capital))].sort(
  (a, b) => a - b
);

export default function Simulador() {
  const [capital, setCapital] = useState("");
  const [tasaMensual, setTasaMensual] = useState("30");

  const capitalNum = parsearPesos(capital) ?? 0;
  const tasaNum = parsearTasa(tasaMensual) ?? 0;

  const semanales = capitalNum > 0 ? planesPara(capitalNum) : [];
  const mensual =
    capitalNum > 0
      ? calcularPlan({ modalidad: "mensual", capital: capitalNum, tasa: tasaNum })
      : null;

  const enLista = ATAJOS.includes(capitalNum);

  const mensaje = [
    `Préstamo de ${plata(capitalNum)}`,
    "",
    ...semanales.map(
      (plan) =>
        `${plan.semanas} semanas de ${plata(plan.cuota)} — total ${plata(plan.total)}`
    ),
  ].join("\n");

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          ¿Cuánto quiere?
        </span>
        <input
          value={capital}
          onChange={(e) => setCapital(e.target.value)}
          inputMode="decimal"
          placeholder="200.000"
          autoFocus
          className={claseInput}
        />
      </label>

      <div className="flex flex-wrap gap-1.5">
        {ATAJOS.map((monto) => (
          <button
            key={monto}
            type="button"
            onClick={() => setCapital(monto.toLocaleString("es-AR"))}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
              capitalNum === monto
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-300 bg-white text-slate-600"
            }`}
          >
            {plata(monto)}
          </button>
        ))}
      </div>

      {capitalNum <= 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          Escribí un monto y te muestro cuánto paga en cada plan.
        </p>
      ) : (
        <>
          <section>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">Planes semanales</h2>
              {!enLista && (
                <span className="text-[11px] text-amber-700">
                  monto fuera de la lista: calculado en proporción
                </span>
              )}
            </div>

            <div className="space-y-2">
              {semanales.map((plan) => (
                <div
                  key={plan.semanas}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {plan.semanas} semanas
                    </p>
                    <p className="tabular text-lg font-bold text-brand-700">
                      {plata(plan.cuota)}
                      <span className="text-xs font-normal text-slate-500"> /semana</span>
                    </p>
                  </div>

                  <dl className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Devuelve en total</dt>
                      <dd className="tabular font-semibold">{plata(plan.total)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Tu ganancia</dt>
                      <dd className="tabular font-medium text-emerald-700">
                        {plata(plan.interes)}{" "}
                        <span className="text-xs text-slate-500">
                          ({porcentaje(tasaImplicita(capitalNum, plan.total))})
                        </span>
                      </dd>
                    </div>
                  </dl>

                  <Link
                    href={`/prestamos/nuevo?capital=${capitalNum}&modalidad=semanal&semanas=${plan.semanas}`}
                    className="mt-3 block rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white active:bg-brand-700"
                  >
                    Usar este plan
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {mensual && (
            <section>
              <h2 className="mb-2 text-sm font-bold text-slate-900">
                Si en cambio lo hacés con interés mensual
              </h2>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <label className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">Tasa mensual</span>
                  <span className="flex items-center gap-1">
                    <input
                      value={tasaMensual}
                      onChange={(e) => setTasaMensual(e.target.value)}
                      inputMode="decimal"
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
                    />
                    <span className="text-sm text-slate-500">%</span>
                  </span>
                </label>

                <dl className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Interés por mes</dt>
                    <dd className="tabular font-medium">{plata(mensual.interes)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">A devolver al mes</dt>
                    <dd className="tabular font-semibold">{plata(mensual.total)}</dd>
                  </div>
                </dl>

                <Link
                  href={`/prestamos/nuevo?capital=${capitalNum}&modalidad=mensual`}
                  className="mt-3 block rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 active:bg-slate-100"
                >
                  Usar interés mensual
                </Link>
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-2 text-sm font-bold text-slate-900">Pasarle las opciones</h2>
            <BotonesWhatsApp
              mensaje={mensaje}
              link={linkWhatsApp(null, mensaje)}
              etiqueta="Mandar por WhatsApp"
            />
          </section>
        </>
      )}
    </div>
  );
}
