"use client";

import { useActionState, useRef, useState } from "react";
import { guardarPlantillas } from "@/app/acciones";
import {
  aplicarPlantilla,
  EJEMPLOS,
  ETIQUETAS,
  PLANTILLA_ESTADO_CUENTA,
  PLANTILLA_PRESTAMO_NUEVO,
  PLANTILLA_COMPROBANTE,
} from "@/lib/plantillas";
import type { Ajustes } from "@/lib/types";

type Editor = {
  campo: "plantilla_estado_cuenta" | "plantilla_prestamo_nuevo" | "plantilla_comprobante";
  titulo: string;
  ayuda: string;
  porDefecto: string;
};

const EDITORES: Editor[] = [
  {
    campo: "plantilla_estado_cuenta",
    titulo: "Estado de cuenta",
    ayuda: "El que le mandás para recordarle cuánto debe y cuándo vence.",
    porDefecto: PLANTILLA_ESTADO_CUENTA,
  },
  {
    campo: "plantilla_prestamo_nuevo",
    titulo: "Préstamo nuevo",
    ayuda: "El aviso que sale cuando le cargás un préstamo recién hecho.",
    porDefecto: PLANTILLA_PRESTAMO_NUEVO,
  },
  {
    campo: "plantilla_comprobante",
    titulo: "Comprobante de pago",
    ayuda: "El recibo que le mandás cuando te paga, con el saldo y lo que le queda.",
    porDefecto: PLANTILLA_COMPROBANTE,
  },
];

export default function FormularioPlantillas({ ajustes }: { ajustes: Ajustes | null }) {
  const [estado, accion, enviando] = useActionState(guardarPlantillas, undefined);
  const [guardado, setGuardado] = useState(false);

  const [textos, setTextos] = useState<Record<string, string>>({
    plantilla_estado_cuenta:
      ajustes?.plantilla_estado_cuenta ?? PLANTILLA_ESTADO_CUENTA,
    plantilla_prestamo_nuevo:
      ajustes?.plantilla_prestamo_nuevo ?? PLANTILLA_PRESTAMO_NUEVO,
    plantilla_comprobante: ajustes?.plantilla_comprobante ?? PLANTILLA_COMPROBANTE,
  });

  const [ejemplo, setEjemplo] = useState(0);
  const referencias = useRef<Record<string, HTMLTextAreaElement | null>>({});

  /** Mete la etiqueta justo donde está el cursor. */
  function insertar(campo: string, clave: string) {
    const area = referencias.current[campo];
    const texto = textos[campo];
    const etiqueta = `{${clave}}`;

    if (!area) {
      setTextos((previo) => ({ ...previo, [campo]: texto + etiqueta }));
      return;
    }

    const desde = area.selectionStart;
    const hasta = area.selectionEnd;
    const nuevo = texto.slice(0, desde) + etiqueta + texto.slice(hasta);
    setTextos((previo) => ({ ...previo, [campo]: nuevo }));

    // Se devuelve el cursor justo después de lo que se acaba de insertar.
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(desde + etiqueta.length, desde + etiqueta.length);
    });
  }

  return (
    <form
      action={(datos) => {
        setGuardado(true);
        return accion(datos);
      }}
      className="space-y-8"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <p className="mb-1.5 text-xs font-medium text-slate-500">
          Ver las vistas previas con un préstamo:
        </p>
        <div className="flex gap-2">
          {EJEMPLOS.map((muestra, indice) => (
            <button
              key={muestra.nombre}
              type="button"
              onClick={() => setEjemplo(indice)}
              aria-pressed={ejemplo === indice}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
                ejemplo === indice
                  ? "bg-brand-600 text-white"
                  : "border border-slate-300 bg-white text-slate-600"
              }`}
            >
              {muestra.nombre}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          Conviene que el texto se lea bien en los dos casos, porque la misma
          plantilla se usa para todos tus préstamos.
        </p>
      </div>

      {EDITORES.map((editor) => (
        <section key={editor.campo}>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900">{editor.titulo}</h2>
            <button
              type="button"
              onClick={() =>
                setTextos((previo) => ({ ...previo, [editor.campo]: editor.porDefecto }))
              }
              className="text-xs font-medium text-slate-500 underline"
            >
              Restaurar el original
            </button>
          </div>
          <p className="mb-2 text-xs text-slate-500">{editor.ayuda}</p>

          <textarea
            ref={(elemento) => {
              referencias.current[editor.campo] = elemento;
            }}
            name={editor.campo}
            value={textos[editor.campo]}
            onChange={(e) =>
              setTextos((previo) => ({ ...previo, [editor.campo]: e.target.value }))
            }
            rows={9}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm leading-relaxed outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />

          <p className="mt-2 text-xs font-medium text-slate-500">
            Tocá una etiqueta para insertarla donde tengas el cursor:
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {ETIQUETAS.map((etiqueta) => (
              <button
                key={etiqueta.clave}
                type="button"
                title={etiqueta.descripcion}
                onClick={() => insertar(editor.campo, etiqueta.clave)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 font-mono text-[11px] text-slate-600 active:bg-brand-50"
              >
                {`{${etiqueta.clave}}`}
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
              Así le va a llegar
            </p>
            <pre className="mt-1.5 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800">
              {aplicarPlantilla(textos[editor.campo], EJEMPLOS[ejemplo].variables)}
            </pre>
          </div>
        </section>
      ))}

      {estado?.error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {estado.error}
        </p>
      )}

      {guardado && !enviando && !estado?.error && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          ✓ Guardado. Tus mensajes ya salen así.
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white active:bg-brand-700 disabled:opacity-60"
      >
        {enviando ? "Guardando..." : "Guardar plantillas"}
      </button>
    </form>
  );
}
