"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteListingButton({
  listingId,
  photos,
}: {
  listingId: string;
  photos: string[];
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();

    if (photos.length > 0) {
      await supabase.storage.from("listing-photos").remove(photos);
    }

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId);

    setDeleting(false);

    if (error) {
      alert("No se pudo eliminar el alquiler.");
      return;
    }

    router.push("/listings");
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 active:bg-red-50"
      >
        Eliminar alquiler
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setConfirming(false)}
        className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 active:bg-slate-50"
      >
        Cancelar
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white active:bg-red-700 disabled:opacity-60"
      >
        {deleting ? "Eliminando..." : "Confirmar"}
      </button>
    </div>
  );
}
