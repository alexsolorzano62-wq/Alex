"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SuggestionActions({
  suggestionId,
  resolverId,
}: {
  suggestionId: string;
  resolverId: string;
}) {
  const router = useRouter();
  const [working, setWorking] = useState(false);

  async function resolve(status: "aprobada" | "rechazada") {
    setWorking(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("suggestions")
      .update({
        status,
        resolved_by: resolverId,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", suggestionId);

    setWorking(false);

    if (error) {
      alert("No se pudo actualizar la sugerencia.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-2 flex gap-2">
      <button
        onClick={() => resolve("aprobada")}
        disabled={working}
        className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white active:bg-emerald-700 disabled:opacity-60"
      >
        ✓ Aprobar
      </button>
      <button
        onClick={() => resolve("rechazada")}
        disabled={working}
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 active:bg-slate-50 disabled:opacity-60"
      >
        ✕ Rechazar
      </button>
    </div>
  );
}
