"use client";

import { useState } from "react";
import { linkWhatsApp } from "@/lib/whatsapp";

// Abre WhatsApp con el mensaje escrito y, en el mismo gesto, deja registrado
// que el aviso salió. No se puede saber si la persona finalmente tocó enviar,
// así que se registra la intención — que es lo que después sirve para decir
// "a este se le avisó el martes".
export function BotonAviso({
  accion, tipo, mensaje, telefono, contratoId, liquidacionId, periodo, yaEnviado,
}: {
  accion: (formData: FormData) => Promise<void>;
  tipo: string;
  mensaje: string;
  telefono: string | null;
  contratoId?: string | null;
  liquidacionId?: string | null;
  periodo?: string | null;
  yaEnviado: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50"
        >
          {abierto ? "Ocultar" : "Ver mensaje"}
        </button>

        <form action={accion}>
          <input type="hidden" name="tipo" value={tipo} />
          {contratoId && <input type="hidden" name="contrato_id" value={contratoId} />}
          {liquidacionId && <input type="hidden" name="liquidacion_id" value={liquidacionId} />}
          {periodo && <input type="hidden" name="periodo" value={periodo} />}
          <input type="hidden" name="destino" value={telefono ?? ""} />

          <button
            type="submit"
            onClick={() => window.open(linkWhatsApp(telefono, mensaje), "_blank", "noopener")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${
              yaEnviado ? "bg-stone-400 hover:bg-stone-500" : "bg-marca-600 hover:bg-marca-700"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20z" />
              <path d="M8.8 7.6c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.8 4.3 3.8 2.1.8 2.6.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.5-.3l-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.5l.4-.5.3-.5v-.4l-.7-1.6z" />
            </svg>
            {yaEnviado ? "Enviar de nuevo" : "Enviar"}
          </button>
        </form>
      </div>

      {abierto && (
        <div className="w-full max-w-md rounded-lg border border-stone-200 bg-stone-50 p-3">
          <p className="whitespace-pre-line text-xs text-stone-700">{mensaje}</p>
          <button
            type="button"
            className="mt-2 text-xs font-semibold text-marca-700 hover:underline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(mensaje);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              } catch {
                setCopiado(false);
              }
            }}
          >
            {copiado ? "Copiado" : "Copiar texto"}
          </button>
        </div>
      )}
    </div>
  );
}
