import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/supabase/profile";
import { getPendingSuggestionsCount } from "@/lib/supabase/suggestions";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import ListingCard from "@/components/ListingCard";
import { PROPERTY_TYPE_LABELS, STATUS_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?: string;
    estado?: string;
    zona?: string;
    dorm?: string;
    orden?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = await getRole(supabase, user.id);

  let query = supabase.from("listings").select("*");

  if (params.tipo) query = query.eq("property_type", params.tipo);
  if (params.estado) query = query.eq("status", params.estado);
  if (params.zona) query = query.ilike("neighborhood", `%${params.zona}%`);
  if (params.dorm) query = query.gte("bedrooms", Number(params.dorm));

  const searchTerm = params.q?.trim().replace(/[,()%]/g, "");
  if (searchTerm) {
    query = query.or(
      `title.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
    );
  }

  // Al ordenar por precio se agrupa por moneda (ARS primero, después USD)
  // para no mezclar pesos con dólares en el mismo ranking.
  if (params.orden === "precio_desc") {
    query = query
      .order("currency", { ascending: true })
      .order("price", { ascending: false, nullsFirst: false });
  } else if (params.orden === "precio_asc") {
    query = query
      .order("currency", { ascending: true })
      .order("price", { ascending: true, nullsFirst: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const [{ data: listings, error }, { data: profiles }, pendingSuggestions] =
    await Promise.all([
      query,
      supabase.from("profiles").select("id, full_name"),
      getPendingSuggestionsCount(supabase, user.id, role),
    ]);

  const agentNames = new Map<string, string>(
    (profiles ?? []).map((p) => [p.id, p.full_name ?? ""])
  );

  const hasFilters = Boolean(
    params.tipo || params.estado || params.zona || params.dorm || params.q || params.orden
  );

  const filterSelectClass =
    "rounded-xl border border-slate-300 bg-white px-2 py-2 text-xs";

  return (
    <div className="min-h-dvh pb-32">
      <AppHeader userEmail={user.email ?? ""} />

      <main className="mx-auto max-w-2xl px-4 pt-4">
        <form method="get" className="mb-4 space-y-2">
          <input
            type="text"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Buscar por dirección o descripción"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400"
          />

          <div className="grid grid-cols-2 gap-2">
            <select name="tipo" defaultValue={params.tipo ?? ""} className={filterSelectClass}>
              <option value="">Tipo de inmueble</option>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select name="estado" defaultValue={params.estado ?? ""} className={filterSelectClass}>
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
              defaultValue={params.zona ?? ""}
              placeholder="Zona"
              className={`${filterSelectClass} placeholder:text-slate-400`}
            />

            <select name="dorm" defaultValue={params.dorm ?? ""} className={filterSelectClass}>
              <option value="">Dormitorios</option>
              {BEDROOM_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}+ dormitorios
                </option>
              ))}
            </select>

            <select name="orden" defaultValue={params.orden ?? ""} className={filterSelectClass}>
              <option value="">Más recientes</option>
              <option value="precio_desc">Precio: mayor a menor</option>
              <option value="precio_asc">Precio: menor a mayor</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white active:bg-slate-700"
            >
              Aplicar
            </button>

            {hasFilters && (
              <Link
                href="/listings"
                className="col-span-2 flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 active:bg-slate-100"
              >
                Limpiar filtros
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
              agentName={agentNames.get(listing.created_by) || undefined}
            />
          ))}
        </div>
      </main>

      <Link
        href="/listings/new"
        className="fixed bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-3xl leading-none text-white shadow-lg active:bg-brand-700"
        aria-label="Nuevo alquiler"
      >
        +
      </Link>

      <BottomNav role={role} pendingSuggestions={pendingSuggestions} />
    </div>
  );
}
