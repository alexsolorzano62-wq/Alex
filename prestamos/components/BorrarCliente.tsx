"use client";

import { useActionState } from "react";
import { borrarCliente } from "@/app/acciones";
import { plata } from "@/lib/format";

/**
 * Borrar un cliente arrastra sus préstamos y sus pagos, así que está guardado
 * detrás de un desplegable y pide escribir el nombre. No alcanza con un toque.
 */
export default function BorrarCliente({
  id,
  nombre,
  prestamos,
  cobrado,
}: {
  id: string;
  nombre: string;
  prestamos: number;
  cobrado: number;
}) {
  const [estado, accion, enviando] = useActionState(borrarCliente, undefined);

  return (
    <details className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
        Borrar este cliente
      </summary>

      <form action={accion} className="border-t border-slate-100 dark:border-slate-800 px-4 py-4">
        <input type="hidden" name="id" value={id} />

        <p className="text-sm text-slate-700 dark:text-slate-300">
          Se borra <strong>{nombre}</strong> y con él{" "}
          <strong>
            {prestamos} préstamo{prestamos === 1 ? "" : "s"}
          </strong>
          {cobrado > 0 && (
            <>
              {" "}
              y todo su historial de cobros por <strong>{plata(cobrado)}</strong>
            </>
          )}
          . No se puede deshacer.
        </p>

        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Escribí <span className="font-mono">{nombre}</span> para confirmar:
          </span>
          <input
            name="confirmacion"
            autoComplete="off"
            placeholder={nombre}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-base outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </label>

        {estado?.error && (
          <p className="mt-2 rounded-xl bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            {estado.error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="mt-3 w-full rounded-xl border border-red-300 dark:border-red-800 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 active:bg-red-50 dark:active:bg-red-900/30 disabled:opacity-60"
        >
          {enviando ? "Borrando..." : "Borrar definitivamente"}
        </button>
      </form>
    </details>
  );
}
