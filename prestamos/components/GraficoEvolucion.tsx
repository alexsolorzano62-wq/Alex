"use client";

import { useState } from "react";
import { nombreMes } from "@/lib/fechas";
import { plata, plataCorta } from "@/lib/format";
import type { PuntoHistorico } from "@/lib/agregados";

const SERIES = [
  { clave: "prestado", texto: "Prestado", color: "#1877f2" },
  { clave: "ganado", texto: "Ganado", color: "#059669" },
] as const;

const RANGOS = [
  { texto: "6M", meses: 6 },
  { texto: "1A", meses: 12 },
  { texto: "MÁX", meses: Infinity },
] as const;

const ANCHO = 320;
const ALTO = 130;
const DERECHA = 58; // lugar para los importes del eje

/**
 * Cómo vino creciendo lo prestado y la ganancia, mes a mes.
 *
 * Las dos series son pesos y comparten el eje, así que se comparan mirando:
 * la distancia entre las dos líneas es lo que todavía no volvió.
 */
export default function GraficoEvolucion({ puntos }: { puntos: PuntoHistorico[] }) {
  const [rango, setRango] = useState<number>(6);

  const visibles =
    rango === Infinity ? puntos : puntos.slice(Math.max(0, puntos.length - rango));
  const ultimo = visibles[visibles.length - 1];

  if (!ultimo) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 px-4 py-10 text-center text-sm text-slate-600 dark:text-slate-400">
        Todavía no hay movimientos para graficar.
      </p>
    );
  }

  const techo = Math.max(1, ...visibles.map((p) => Math.max(p.prestado, p.ganado)));
  const util = ANCHO - DERECHA;
  const x = (i: number) =>
    visibles.length === 1 ? util : (i / (visibles.length - 1)) * util;
  const y = (valor: number) => ALTO - (valor / techo) * (ALTO - 10);

  const lineas = [techo, techo * 0.66, techo * 0.33];

  return (
    <figure className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <figcaption>
        <p className="tabular text-3xl font-bold leading-none text-slate-900 dark:text-slate-100">
          {plata(ultimo.ganado)}
        </p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          ganado sobre {plata(ultimo.prestado)} prestados
        </p>
      </figcaption>

      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO + 16}`}
        className="mt-3 w-full"
        role="img"
        aria-label={`Evolución: ${plata(ultimo.prestado)} prestados y ${plata(ultimo.ganado)} ganados`}
      >
        {lineas.map((valor) => (
          <g key={valor}>
            <line
              x1="0"
              x2={util}
              y1={y(valor)}
              y2={y(valor)}
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth="1"
            />
            <text
              x={util + 8}
              y={y(valor) + 4}
              className="fill-slate-500 dark:fill-slate-400"
              style={{ fontSize: 10 }}
            >
              {plataCorta(valor)}
            </text>
          </g>
        ))}

        {SERIES.map((serie) => (
          <g key={serie.clave}>
            <polyline
              fill="none"
              stroke={serie.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={visibles.map((p, i) => `${x(i)},${y(p[serie.clave])}`).join(" ")}
            />
            <circle
              cx={x(visibles.length - 1)}
              cy={y(ultimo[serie.clave])}
              r="3.5"
              fill={serie.color}
            />
          </g>
        ))}

        <text x="0" y={ALTO + 14} className="fill-slate-500 dark:fill-slate-400" style={{ fontSize: 10 }}>
          {nombreMes(visibles[0].mes)}
        </text>
        <text
          x={util}
          y={ALTO + 14}
          textAnchor="end"
          className="fill-slate-500 dark:fill-slate-400"
          style={{ fontSize: 10 }}
        >
          {nombreMes(ultimo.mes)}
        </text>
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3 text-xs">
          {SERIES.map((serie) => (
            <span key={serie.clave} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: serie.color }}
              />
              {serie.texto}
            </span>
          ))}
        </div>

        <div className="flex gap-1 rounded-full bg-slate-100 dark:bg-slate-800 p-0.5">
          {RANGOS.filter(
            (opcion) => opcion.meses === Infinity || puntos.length > opcion.meses
          ).map((opcion) => (
            <button
              key={opcion.texto}
              type="button"
              onClick={() => setRango(opcion.meses)}
              aria-pressed={rango === opcion.meses}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                rango === opcion.meses ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {opcion.texto}
            </button>
          ))}
        </div>
      </div>
    </figure>
  );
}
