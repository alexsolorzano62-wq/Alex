import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/supabase/profile";
import DeleteListingButton from "@/components/DeleteListingButton";
import LocationMap from "@/components/LocationMap";
import SuggestionForm from "@/components/SuggestionForm";
import SuggestionActions from "@/components/SuggestionActions";
import {
  Listing,
  Suggestion,
  PROPERTY_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  RENTAL_PURPOSE_LABELS,
  ADJUSTMENT_INDEX_LABELS,
  SUGGESTION_STATUS_LABELS,
  SUGGESTION_STATUS_COLORS,
  formatPrice,
} from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single<Listing>();

  if (!listing) notFound();

  const role = await getRole(supabase, user.id);
  const isOwner = listing.created_by === user.id;
  const canManage = isOwner || role === "admin";

  const { data: suggestionsData } = await supabase
    .from("suggestions")
    .select("*")
    .eq("listing_id", id)
    .order("created_at", { ascending: false });
  const suggestions = (suggestionsData ?? []) as Suggestion[];

  const profileIds = Array.from(
    new Set([
      listing.created_by,
      ...suggestions.map((s) => s.suggested_by),
    ])
  );
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", profileIds);
  const names = new Map<string, string>(
    (profiles ?? []).map((p) => [p.id, p.full_name ?? "Agente"])
  );

  const agentName = names.get(listing.created_by) ?? "Agente";

  const contractChips: string[] = [];
  if (listing.rental_purpose) {
    contractChips.push(`Destino: ${RENTAL_PURPOSE_LABELS[listing.rental_purpose]}`);
  }
  if (listing.contract_months != null) {
    contractChips.push(`Contrato: ${listing.contract_months} meses`);
  }
  const ajusteParts: string[] = [];
  if (listing.adjustment_frequency) ajusteParts.push(listing.adjustment_frequency);
  if (listing.adjustment_index) {
    ajusteParts.push(
      listing.adjustment_index === "fijo"
        ? `fijo ${listing.adjustment_fixed_pct ?? "?"}%`
        : ADJUSTMENT_INDEX_LABELS[listing.adjustment_index]
    );
  }
  if (ajusteParts.length > 0) contractChips.push(`Ajuste: ${ajusteParts.join(" · ")}`);
  if (listing.expenses != null) {
    contractChips.push(`Expensas: $${listing.expenses.toLocaleString("es-AR")}`);
  }
  if (listing.pets_allowed != null) {
    contractChips.push(listing.pets_allowed ? "Acepta mascotas" : "No acepta mascotas");
  }
  if (listing.furnished != null) {
    contractChips.push(listing.furnished ? "Amoblado" : "Sin amoblar");
  }

  const isLocal = listing.property_type === "local";
  const pendingSuggestions = suggestions.filter((s) => s.status === "pendiente");

  return (
    <div className="min-h-dvh pb-10">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <Link
          href="/listings"
          className="rounded-lg px-2 py-1 text-xl text-slate-500 active:bg-slate-100"
          aria-label="Volver"
        >
          ←
        </Link>
        <h1 className="truncate text-base font-bold text-slate-900">
          {listing.title}
        </h1>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{listing.title}</h2>
            <p className="text-sm text-slate-500">
              {[listing.neighborhood, listing.city].filter(Boolean).join(", ") ||
                "Zona sin especificar"}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[listing.status]}`}
          >
            {STATUS_LABELS[listing.status]}
          </span>
        </div>

        <p className="mb-4 text-2xl font-bold text-brand-700">
          {formatPrice(listing.price, listing.currency)}
        </p>

        {listing.priority_note && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
              ⚠ Importante
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-amber-900">
              {listing.priority_note}
            </p>
          </div>
        )}

        <div
          className={`mb-4 grid gap-2 text-center text-xs text-slate-600 ${
            isLocal ? "grid-cols-4" : "grid-cols-3"
          }`}
        >
          <div className="rounded-xl bg-slate-100 py-2">
            <p className="font-bold text-slate-900">
              {PROPERTY_TYPE_LABELS[listing.property_type]}
            </p>
            <p>Tipo</p>
          </div>
          <div className="rounded-xl bg-slate-100 py-2">
            <p className="font-bold text-slate-900">{listing.bedrooms ?? "-"}</p>
            <p>Dormitorios</p>
          </div>
          <div className="rounded-xl bg-slate-100 py-2">
            <p className="font-bold text-slate-900">{listing.bathrooms ?? "-"}</p>
            <p>Baños</p>
          </div>
          {isLocal && (
            <div className="rounded-xl bg-slate-100 py-2">
              <p className="font-bold text-slate-900">{listing.area_m2 ?? "-"}</p>
              <p>m²</p>
            </div>
          )}
        </div>

        {contractChips.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {contractChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {listing.latitude != null && listing.longitude != null && (
          <LocationMap
            latitude={listing.latitude}
            longitude={listing.longitude}
            address={listing.title}
          />
        )}

        {listing.description && (
          <div className="mb-4">
            <h3 className="mb-1 text-sm font-semibold text-slate-700">
              Descripción
            </h3>
            <p className="whitespace-pre-line text-sm text-slate-600">
              {listing.description}
            </p>
          </div>
        )}

        <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <p>
            👤 Agente responsable:{" "}
            <span className="font-semibold text-slate-700">{agentName}</span>
          </p>
          <p className="mt-0.5">
            Actualizado el {formatDate(listing.updated_at)}
          </p>
        </div>

        {canManage && (
          <div className="mb-6 space-y-2 border-t border-slate-200 pt-4">
            <Link
              href={`/listings/${listing.id}/edit`}
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 active:bg-slate-50"
            >
              Editar alquiler
            </Link>
            <DeleteListingButton listingId={listing.id} />
          </div>
        )}

        <div className="border-t border-slate-200 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            Sugerencias de corrección
            {pendingSuggestions.length > 0 && ` (${pendingSuggestions.length} pendientes)`}
          </h3>

          {suggestions.length === 0 && (
            <p className="mb-3 text-xs text-slate-400">
              Nadie sugirió correcciones para esta propiedad.
            </p>
          )}

          <div className="mb-3 space-y-2">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    {names.get(s.suggested_by) ?? "Agente"} ·{" "}
                    {formatDate(s.created_at)}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${SUGGESTION_STATUS_COLORS[s.status]}`}
                  >
                    {SUGGESTION_STATUS_LABELS[s.status]}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                  {s.message}
                </p>
                {canManage && s.status === "pendiente" && (
                  <SuggestionActions suggestionId={s.id} resolverId={user.id} />
                )}
              </div>
            ))}
          </div>

          {!isOwner && <SuggestionForm listingId={listing.id} userId={user.id} />}
        </div>
      </main>
    </div>
  );
}
