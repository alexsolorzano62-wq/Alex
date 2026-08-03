import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import ListingCard from "@/components/ListingCard";
import { PROPERTY_TYPE_LABELS, STATUS_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?: string;
    estado?: string;
    zona?: string;
    q?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (resolvedSearchParams.tipo) query = query.eq("property_type", resolvedSearchParams.tipo);
  if (resolvedSearchParams.estado) query = query.eq("status", resolvedSearchParams.estado);
  if (resolvedSearchParams.zona) query = query.ilike("neighborhood", `%${resolvedSearchParams.zona}%`);

  const searchTerm = resolvedSearchParams.q?.trim().replace(/[,()%]/g, "");
  if (searchTerm) {
    query = query.or(
      `title.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
    );
  }

  const { data: listings, error } = await query;

  const thumbnailPaths = (listings ?? [])
    .map((l) => l.photos?.[0])
    .filter((p): p is string => Boolean(p));

  const signedUrlMap: Record<string, string> = {};
  if (thumbnailPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("listing-photos")
      .createSignedUrls(thumbnailPaths, 60 * 60);
    signed?.forEach((s) => {
      if (s.signedUrl && s.path) signedUrlMap[s.path] = s.signedUrl;
    });
  }

  const hasFilters = Boolean(
    resolvedSearchParams.tipo ||
      resolvedSearchParams.estado ||
      resolvedSearchParams.zona ||
      resolvedSearchParams.q
  );

  return (
    <div className="min-h-dvh pb-28">
      <AppHeader userEmail={user?.email ?? ""} />

      <main className="mx-auto max-w-2xl px-4 pt-4">
        <form method="get" className="mb-4 space-y-2">
          <input
            type="text"
            name="q"
            defaultValue={resolvedSearchParams.q ?? ""}
            placeholder="Buscar por título, dirección o descripción"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400"
          />

          <div className="grid grid-cols-3 gap-2">
          <select
            name="tipo"
            defaultValue={resolvedSearchParams.tipo ?? ""}
            className="rounded-xl border border-slate-300 bg-white px-2 py-2 text-xs"
          >
            <option value="">Tipo</option>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            name="estado"
            defaultValue={resolvedSearchParams.estado ?? ""}
            className="rounded-xl border border-slate-300 bg-white px-2 py-2 text-xs"
          >
            <option value="">Estado</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="zona"
            defaultValue={resolvedSearchParams.zona ?? ""}
            placeholder="Zona"
            className="rounded-xl border border-slate-300 bg-white px-2 py-2 text-xs placeholder:text-slate-400"
          />

          <button
            type="submit"
            className="col-span-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white active:bg-slate-700"
          >
            Filtrar
          </button>
          {hasFilters && (
            <Link
              href="/listings"
              className="flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 active:bg-slate-100"
            >
              Limpiar
            </Link>
          )}
          </div>
        </form>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            No se pudieron cargar los alquileres.
          </p>
        )}

        {listings && listings.length === 0 && (
          <p className="mt-16 text-center text-sm text-slate-400">
            {hasFilters
              ? "No hay alquileres que coincidan con el filtro."
              : "Todavía no hay alquileres cargados. Tocá el botón + para cargar el primero."}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3">
          {listings?.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              thumbnailUrl={
                listing.photos?.[0]
                  ? signedUrlMap[listing.photos[0]]
                  : undefined
              }
            />
          ))}
        </div>
      </main>

      <Link
        href="/listings/new"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-3xl leading-none text-white shadow-lg active:bg-brand-700"
        aria-label="Nuevo alquiler"
      >
        +
      </Link>
    </div>
  );
}
