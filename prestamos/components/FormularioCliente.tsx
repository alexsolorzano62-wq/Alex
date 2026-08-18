"use client";

import { useActionState } from "react";
import { crearCliente, editarCliente } from "@/app/acciones";
import CampoTexto, { claseInput } from "@/components/CampoTexto";
import type { Cliente } from "@/lib/types";

export default function FormularioCliente({ cliente }: { cliente?: Cliente }) {
  const [estado, accion, enviando] = useActionState(
    cliente ? editarCliente : crearCliente,
    undefined
  );

  return (
    <form action={accion} className="space-y-4">
      {cliente && <input type="hidden" name="id" value={cliente.id} />}

      <CampoTexto etiqueta="Nombre y apellido">
        <input
          name="nombre"
          defaultValue={cliente?.nombre}
          required
          autoFocus={!cliente}
          placeholder="Miriam Marquez"
          className={claseInput}
        />
      </CampoTexto>

      <CampoTexto
        etiqueta="WhatsApp"
        ayuda="Con característica y sin el 15. Ej: 11 5555 4444"
      >
        <input
          name="telefono"
          type="tel"
          inputMode="tel"
          defaultValue={cliente?.telefono ?? ""}
          placeholder="11 5555 4444"
          className={claseInput}
        />
      </CampoTexto>

      <CampoTexto etiqueta="Notas (opcional)">
        <textarea
          name="notas"
          rows={3}
          defaultValue={cliente?.notas ?? ""}
          placeholder="Dónde trabaja, quién lo recomendó, lo que te sirva"
          className={claseInput}
        />
      </CampoTexto>

      {estado?.error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white active:bg-brand-700 disabled:opacity-60"
      >
        {enviando ? "Guardando..." : cliente ? "Guardar cambios" : "Guardar cliente"}
      </button>
    </form>
  );
}
