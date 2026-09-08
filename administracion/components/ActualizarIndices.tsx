"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ActualizarIndices({ indices }: { indices: string[] }) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function actualizar(indice: string) {
    setTrabajando(indice);
    setMensaje(null);
    setError(null);

    try {
      const respuesta = await fetch(`/api/indices/actualizar?indice=${indice}`, { method: "POST" });
      const json = await respuesta.json();

      if (!respuesta.ok) {
        setError(json.error ?? "No se pudo actualizar.");
      } else if (json.nuevos === 0) {
        setMensaje(`${indice}: ya estaba al día.`);
      } else {
        setMensaje(`${indice}: se cargaron ${json.nuevos} valores, hasta el ${json.hasta}.`);
        router.refresh();
      }
    } catch {
      setError("No se pudo contactar al servidor.");
    } finally {
      setTrabajando(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {indices.map((indice) => (
          <button
            key={indice}
            type="button"
            className="boton-secundario"
            disabled={trabajando != null}
            onClick={() => actualizar(indice)}
          >
            {trabajando === indice ? `Bajando ${indice}…` : `Actualizar ${indice}`}
          </button>
        ))}
      </div>

      {mensaje && (
        <p className="mt-3 rounded-lg bg-marca-50 px-3 py-2 text-sm text-marca-800">{mensaje}</p>
      )}
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
