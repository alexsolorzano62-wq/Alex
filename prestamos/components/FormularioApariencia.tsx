"use client";

import { useState } from "react";
import { guardarApariencia } from "@/app/acciones";
import { familiaDe, FUENTES, TEMAS } from "@/lib/apariencia";
import type { Tema } from "@/lib/types";

/**
 * Elegir tema y tipografía.
 *
 * Cada opción de letra se muestra escrita con esa misma letra, que es la única
 * forma honesta de elegir una: los nombres no dicen nada.
 */
export default function FormularioApariencia({
  tema: temaGuardado,
  fuente: fuenteGuardada,
}: {
  tema: Tema;
  fuente: string;
}) {
  const [tema, setTema] = useState<Tema>(temaGuardado);
  const [fuente, setFuente] = useState(fuenteGuardada);

  return (
    <form action={guardarApariencia} className="space-y-6">
      <input type="hidden" name="tema" value={tema} />
      <input type="hidden" name="fuente" value={fuente} />

      <section>
        <h2 className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-100">Tema</h2>
        <div className="grid grid-cols-2 gap-2">
          {TEMAS.map((opcion) => (
            <button
              key={opcion.clave}
              type="button"
              onClick={() => setTema(opcion.clave)}
              aria-pressed={tema === opcion.clave}
              className={`rounded-xl border px-3 py-2.5 text-left ${
                tema === opcion.clave
                  ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100 dark:bg-brand-900/40 dark:ring-brand-900"
                  : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
              }`}
            >
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                {opcion.nombre}
              </span>
              <span className="block text-[11px] text-slate-600 dark:text-slate-400">
                {opcion.detalle}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-100">Letra</h2>
        <div className="space-y-2">
          {FUENTES.map((opcion) => (
            <button
              key={opcion.clave}
              type="button"
              onClick={() => setFuente(opcion.clave)}
              aria-pressed={fuente === opcion.clave}
              style={{ fontFamily: familiaDe(opcion.clave) }}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left ${
                fuente === opcion.clave
                  ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100 dark:bg-brand-900/40 dark:ring-brand-900"
                  : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
              }`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {opcion.nombre}
                </span>
                <span className="tabular block text-xs text-slate-600 dark:text-slate-400">
                  Miriam Marquez · $27.900 · vence 06/09
                </span>
              </span>
              {fuente === opcion.clave && (
                <span aria-hidden="true" className="text-brand-600 dark:text-brand-400">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <button
        type="submit"
        className="w-full rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white active:bg-brand-700"
      >
        Guardar apariencia
      </button>
    </form>
  );
}
