"use client";

import { useActionState, useState } from "react";
import { registrarPago } from "@/app/acciones";
import CampoTexto, { claseInput } from "@/components/CampoTexto";
import { hoyISO } from "@/lib/fechas";
import { plata } from "@/lib/format";
import type { ResumenPrestamo } from "@/lib/calc";
import type { PrestamoConCliente, TipoPago } from "@/lib/types";

type Opcion = {
  tipo: TipoPago;
  titulo: string;
  detalle: string;
  monto: number;
  montoEditable?: boolean;
};

export default function FormularioPago({
  prestamo,
  datos,
}: {
  prestamo: PrestamoConCliente;
  datos: ResumenPrestamo;
}) {
  const [estado, accion, enviando] = useActionState(registrarPago, undefined);
  const [elegida, setElegida] = useState<Opcion | null>(null);

  const opciones: Opcion[] =
    prestamo.modalidad === "mensual"
      ? [
          {
            tipo: "interes",
            titulo: "Cobré el interés",
            detalle: "El capital queda igual y se renueva un mes más",
            monto: datos.interes,
          },
          {
            tipo: "capital",
            titulo: "Entrega a cuenta",
            detalle: "Bajás el capital que sigue debiendo",
            monto: 0,
            montoEditable: true,
          },
          {
            tipo: "total",
            titulo: "Saldó todo",
            detalle: `Cerrás el préstamo por ${plata(datos.aDevolver)}`,
            monto: datos.aDevolver,
          },
        ]
      : [
          {
            tipo: "cuota",
            titulo: "Cobré una cuota",
            detalle: `Cuota ${datos.cuotasPagadas + 1} de ${datos.cuotasTotal}`,
            monto: datos.cuotaMonto ?? 0,
          },
          {
            tipo: "total",
            titulo: "Saldó todo",
            detalle: `Cerrás el préstamo por ${plata(datos.aDevolver)}`,
            monto: datos.aDevolver,
          },
        ];

  if (!elegida) {
    return (
      <div className="space-y-2">
        {opciones.map((opcion) => (
          <button
            key={opcion.tipo}
            type="button"
            onClick={() => setElegida(opcion)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left active:bg-slate-50"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-800">
                {opcion.titulo}
              </span>
              <span className="block text-xs text-slate-500">{opcion.detalle}</span>
            </span>
            {opcion.monto > 0 && (
              <span className="tabular shrink-0 text-sm font-bold text-brand-700">
                {plata(opcion.monto)}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
      <input type="hidden" name="prestamo_id" value={prestamo.id} />
      <input type="hidden" name="tipo" value={elegida.tipo} />

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-brand-800">{elegida.titulo}</p>
        <button
          type="button"
          onClick={() => setElegida(null)}
          className="text-xs font-medium text-slate-500 underline"
        >
          Cambiar
        </button>
      </div>

      <CampoTexto etiqueta="Cuánto te pagó">
        <input
          name="monto"
          inputMode="decimal"
          defaultValue={elegida.monto > 0 ? String(elegida.monto) : ""}
          placeholder="0"
          required={elegida.montoEditable}
          className={claseInput}
        />
      </CampoTexto>

      <CampoTexto etiqueta="Fecha del pago">
        <input name="fecha" type="date" defaultValue={hoyISO()} className={claseInput} />
      </CampoTexto>

      <CampoTexto etiqueta="Nota (opcional)">
        <input name="nota" placeholder="Ej: pagó en efectivo" className={claseInput} />
      </CampoTexto>

      {estado?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white active:bg-brand-700 disabled:opacity-60"
      >
        {enviando ? "Guardando..." : "Registrar el pago"}
      </button>
    </form>
  );
}
