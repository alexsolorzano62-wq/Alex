"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SuggestionForm({
  listingId,
  userId,
}: {
  listingId: string;
  userId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("suggestions").insert({
      listing_id: listingId,
      suggested_by: userId,
      message: message.trim(),
    });

    setSending(false);

    if (insertError) {
      setError("No se pudo enviar la sugerencia. Probá de nuevo.");
      return;
    }

    setMessage("");
    setOpen(false);
    setSent(true);
    router.refresh();
  }

  if (!open) {
    return (
      <div className="space-y-2">
        {sent && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Sugerencia enviada. El agente responsable la va a revisar.
          </p>
        )}
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 active:bg-slate-50"
        >
          ✏️ Sugerir una corrección
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
      <label className="block text-sm font-medium text-slate-700">
        ¿Qué habría que corregir o actualizar?
      </label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        autoFocus
        placeholder="Ej: el precio se actualizó a $500.000 en enero"
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
      />
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 active:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="flex-1 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white active:bg-brand-700 disabled:opacity-60"
        >
          {sending ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </form>
  );
}
