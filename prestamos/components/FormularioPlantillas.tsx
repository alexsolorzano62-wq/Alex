"use client";

import { useActionState, useRef, useState } from "react";
import { guardarPlantillas } from "@/app/acciones";
import {
  aplicarPlantilla,
  EJEMPLOS,
  ETIQUETAS,
  MODALIDADES,
  PLANTILLAS_POR_DEFECTO,
  TIPOS,
  type PlantillasGuardadas,
  type TipoMensaje,
} from "@/lib/plantillas";
import type { Modalidad } from "@/lib/types";

function clave(tipo: TipoMensaje, modalidad: Modalidad) {
  return `${tipo}.${modalidad}`;
}

/** Los nueve textos: lo guardado si existe, si no el de fábrica. */
function estadoInicial(guardadas: PlantillasGuardadas) {
  const textos: Record<string, string> = {};
  for (const { tipo } of TIPOS) {
    for (const { modalidad } of MODALIDADES) {
      textos[clave(tipo, modalidad)] =
        guardadas[tipo]?.[modalidad] ?? PLANTILLAS_POR_DEFECTO[tipo][modalidad];
    }
  }
  return textos;
}

export default function FormularioPlantillas({
  plantillas,
}: {
  plantillas: PlantillasGuardadas;
}) {
  const [estado, accion, enviando] = useActionState(guardarPlantillas, undefined);
  const [guardado, setGuardado] = useState(false);
  const [textos, setTextos] = useState(() => estadoInicial(plantillas));
  const [modalidad, setModalidad] = useState<Modalidad>("semanal");
  const referencias = useRef<Record<string, HTMLTextAreaElement | null>>({});

  /** Mete la etiqueta justo donde está el cursor. */
  function insertar(campo: string, etiqueta: string) {
    const area = referencias.current[campo];
    const texto = textos[campo];
    const trozo = `{${etiqueta}}`;

    if (!area) {
      setTextos((previo) => ({ ...previo, [campo]: texto + trozo }));
      return;
    }

    const desde = area.selectionStart;
    const hasta = area.selectionEnd;
    setTextos((previo) => ({
      ...previo,
      [campo]: texto.slice(0, desde) + trozo + texto.slice(hasta),
    }));

    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(desde + trozo.length, desde + trozo.length);
    });
  }

  const muestra = EJEMPLOS[modalidad];

  return (
    <form
      action={(datos) => {
        setGuardado(true);
        return accion(datos);
      }}
      className="space-y-6"
    >
      {/* Las modalidades que no se están editando viajan igual, para que
          guardar una no borre las otras. */}
      {Object.entries(textos)
        .filter(([campo]) => !campo.endsWith(`.${modalidad}`))
        .map(([campo, texto]) => (
          <input key={campo} type="hidden" name={campo} value={texto} />
        ))}

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <p className="mb-2 text-xs font-medium text-slate-500">
          Estás editando los mensajes de:
        </p>
        <div className="flex flex-wrap gap-2">
          {MODALIDADES.map((opcion) => (
            <button
              key={opcion.modalidad}
              type="button"
              onClick={() => setModalidad(opcion.modalidad)}
              aria-pressed={modalidad === opcion.modalidad}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
                modalidad === opcion.modalidad
                  ? "bg-brand-600 text-white"
                  : "border border-slate-300 bg-white text-slate-600"
              }`}
            >
              {opcion.titulo}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Cada modalidad tiene sus propios textos, porque lo que el cliente necesita
          saber no es lo mismo.
        </p>
      </div>

      {TIPOS.map((mensaje) => {
        const campo = clave(mensaje.tipo, modalidad);
        return (
          <section key={campo}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">{mensaje.titulo}</h2>
              <button
                type="button"
                onClick={() =>
                  setTextos((previo) => ({
                    ...previo,
                    [campo]: PLANTILLAS_POR_DEFECTO[mensaje.tipo][modalidad],
                  }))
                }
                className="text-xs font-medium text-slate-500 underline"
              >
                Restaurar el original
              </button>
            </div>
            <p className="mb-2 text-xs text-slate-500">{mensaje.ayuda}</p>

            <textarea
              ref={(elemento) => {
                referencias.current[campo] = elemento;
              }}
              name={campo}
              value={textos[campo]}
              onChange={(e) =>
                setTextos((previo) => ({ ...previo, [campo]: e.target.value }))
              }
              rows={8}
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
                  onClick={() => insertar(campo, etiqueta.clave)}
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
                {aplicarPlantilla(textos[campo], muestra)}
              </pre>
            </div>
          </section>
        );
      })}

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
        {enviando ? "Guardando..." : "Guardar los nueve mensajes"}
      </button>
    </form>
  );
}
