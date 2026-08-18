"use client";

import { useState } from "react";

/**
 * Manda el mensaje por WhatsApp o lo copia al portapapeles.
 *
 * Si el cliente tiene teléfono cargado, el link abre directo su chat con el
 * texto ya escrito. Si no, abre WhatsApp para que elijas a quién mandárselo.
 */
export default function BotonesWhatsApp({
  mensaje,
  link,
  etiqueta = "Enviar por WhatsApp",
}: {
  mensaje: string;
  link: string;
  etiqueta?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje);
    } catch {
      // Safari sin permisos de portapapeles: se selecciona a mano.
      const area = document.createElement("textarea");
      area.value = mensaje;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white active:bg-emerald-700"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.9 9.9 0 0 0 4.74 1.2c5.46 0 9.9-4.43 9.9-9.9 0-5.45-4.44-9.9-9.9-9.9zm5.8 14.03c-.24.68-1.2 1.25-1.96 1.4-.52.1-1.2.18-3.5-.74-2.94-1.18-4.83-4.1-4.98-4.3-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.25-.28.55-.35.73-.35l.53.01c.17 0 .4-.06.62.48l.85 2.05c.07.14.12.31.02.5l-.29.46-.42.46c-.14.14-.29.3-.12.58.16.29.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.15.44.12.6-.07l.86-1c.2-.24.36-.19.6-.11l1.98.94c.24.11.4.17.46.27.06.1.06.57-.18 1.25z" />
          </svg>
          {etiqueta}
        </a>
        <button
          type="button"
          onClick={copiar}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 active:bg-slate-100"
        >
          {copiado ? "¡Copiado!" : "Copiar"}
        </button>
      </div>

      <details className="rounded-xl border border-slate-200 bg-white">
        <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-500">
          Ver el mensaje
        </summary>
        <pre className="whitespace-pre-wrap px-3 pb-3 text-xs leading-relaxed text-slate-700">
          {mensaje}
        </pre>
      </details>
    </div>
  );
}
