"use client";

import { useState } from "react";
import { formatearMoneda } from "@/lib/dinero";

// El monto propuesto viene calculado del servidor, pero se puede corregir
// antes de aplicar: a veces el contrato tiene una cláusula que el índice solo
// no contempla, o se acordó redondear.
export function FilaAjuste({
  accion, contratoId, titulo, subtitulo, moneda,
  montoAnterior, montoNuevo, variacion, valorBase, valorFinal, fechaAplicacion,
}: {
  accion: (formData: FormData) => Promise<void>;
  contratoId: string;
  titulo: string;
  subtitulo: string;
  moneda: "ARS" | "USD";
  montoAnterior: number;
  montoNuevo: number;
  variacion: number;
  valorBase: number | null;
  valorFinal: number | null;
  fechaAplicacion: string;
}) {
  const [monto, setMonto] = useState(String(montoNuevo));
  const editado = Number(monto) !== montoNuevo;

  return (
    <form action={accion} className="tarjeta">
      <input type="hidden" name="contrato_id" value={contratoId} />
      <input type="hidden" name="fecha_aplicacion" value={fechaAplicacion} />
      {valorBase != null && <input type="hidden" name="valor_indice_base" value={valorBase} />}
      {valorFinal != null && <input type="hidden" name="valor_indice_final" value={valorFinal} />}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="truncate font-titulo text-base font-bold">{titulo}</div>
          <div className="mt-0.5 truncate text-xs text-stone-500">{subtitulo}</div>

          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="tabular text-stone-500 line-through">
              {formatearMoneda(montoAnterior, moneda)}
            </span>
            <span className="text-stone-400">→</span>
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                variacion >= 0 ? "bg-marca-100 text-marca-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              {variacion >= 0 ? "+" : ""}{variacion}%
            </span>
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div>
            <label className="etiqueta text-xs" htmlFor={`monto-${contratoId}`}>
              Alquiler nuevo
            </label>
            <input
              id={`monto-${contratoId}`}
              name="monto_nuevo"
              className="campo tabular w-40 text-right"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <button type="submit" className="boton">Aplicar</button>
        </div>
      </div>

      {editado && (
        <p className="mt-2 text-xs text-amber-700">
          Estás cambiando el monto calculado. Queda registrado igual, con el
          coeficiente que resulte.
        </p>
      )}
    </form>
  );
}
