import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/supabase/profile";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import SuggestionActions from "@/components/SuggestionActions";
import {
  Suggestion,
  SUGGESTION_STATUS_LABELS,
  SUGGESTION_STATUS_COLORS,
} from "@/lib/types";

export const dynamic = "force-dynamic";

type SuggestionRow = Suggestion & {
  listing: { id: string; title: string; created_by: string } | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function SuggestionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = await getRole(supabase, user.id);

  const [{ data: suggestionsData }, { data: profiles }] = await Promise.all([
    supabase
      .from("suggestions")
      .select("*, listing:listings(id, title, created_by)")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const rows = (suggestionsData ?? []) as SuggestionRow[];
  const names = new Map<string, string>(
    (profiles ?? []).map((p) => [p.id, p.full_name ?? "Agente"])
  );

  // Pendientes que este usuario puede resolver (sus propiedades, o todas si es admin)
  const toReview = rows.filter(
    (s) =>
      s.status === "pendiente" &&
      s.listing &&
      (role === "admin" || s.listing.created_by === user.id)
  );

  // Las que envió este usuario
  const mine = rows.filter((s) => s.suggested_by === user.id);

  const pendingCount = toReview.length;

  return (
    <div className="min-h-dvh pb-32">
      <AppHeader userEmail={user.email ?? ""} />

      <main className="mx-auto max-w-2xl px-4 pt-4">
        <h1 className="mb-4 text-lg font-bold text-slate-900">Sugerencias</h1>

        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          Para revisar {pendingCount > 0 && `(${pendingCount})`}
        </h2>
        {toReview.length === 0 ? (
          <p className="mb-6 text-xs text-slate-400">
            No tenés sugerencias pendientes de revisar.
          </p>
        ) : (
          <div className="mb-6 space-y-2">
            {toReview.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-amber-200 bg-white px-4 py-3"
              >
                <Link
                  href={`/listings/${s.listing!.id}`}
                  className="text-sm font-semibold text-brand-700 underline-offset-2 active:underline"
                >
                  {s.listing!.title}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">
                  {names.get(s.suggested_by) ?? "Agente"} · {formatDate(s.created_at)}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                  {s.message}
                </p>
                <SuggestionActions suggestionId={s.id} resolverId={user.id} />
              </div>
            ))}
          </div>
        )}

        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          Enviadas por mí
        </h2>
        {mine.length === 0 ? (
          <p className="text-xs text-slate-400">
            Todavía no enviaste sugerencias. Podés sugerir correcciones desde la
            ficha de cualquier alquiler cargado por otro agente.
          </p>
        ) : (
          <div className="space-y-2">
            {mine.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  {s.listing ? (
                    <Link
                      href={`/listings/${s.listing.id}`}
                      className="text-sm font-semibold text-brand-700 underline-offset-2 active:underline"
                    >
                      {s.listing.title}
                    </Link>
                  ) : (
                    <p className="text-sm text-slate-400">Alquiler eliminado</p>
                  )}
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${SUGGESTION_STATUS_COLORS[s.status]}`}
                  >
                    {SUGGESTION_STATUS_LABELS[s.status]}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDate(s.created_at)}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                  {s.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav role={role} pendingSuggestions={pendingCount} />
    </div>
  );
}
