import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/supabase/profile";
import { getPendingSuggestionsCount } from "@/lib/supabase/suggestions";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import {
  PROPERTY_TYPE_LABELS,
  PropertyType,
  ListingStatus,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const TYPE_ICONS: Record<PropertyType, string> = {
  monoambiente: "🏢",
  departamento: "🏢",
  casa: "🏡",
  duplex: "🏘️",
  local: "🏪",
  oficina: "💼",
  galpon: "🏭",
  estacionamiento: "🚗",
  terreno: "🌱",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = await getRole(supabase, user.id);

  const [{ data: rows }, pendingSuggestions] = await Promise.all([
    supabase.from("listings").select("property_type, status"),
    getPendingSuggestionsCount(supabase, user.id, role),
  ]);

  const listings = (rows ?? []) as {
    property_type: PropertyType;
    status: ListingStatus;
  }[];

  const statusTotals: Record<ListingStatus, number> = {
    disponible: 0,
    reservado: 0,
    proximamente: 0,
    pausado: 0,
  };
  const availableByType = new Map<PropertyType, number>();
  const totalByType = new Map<PropertyType, number>();

  for (const l of listings) {
    if (l.status in statusTotals) statusTotals[l.status]++;
    totalByType.set(l.property_type, (totalByType.get(l.property_type) ?? 0) + 1);
    if (l.status === "disponible") {
      availableByType.set(
        l.property_type,
        (availableByType.get(l.property_type) ?? 0) + 1
      );
    }
  }

  const typeTiles = (
    Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]
  ).filter((t) => (totalByType.get(t) ?? 0) > 0);

  return (
    <div className="min-h-dvh pb-32">
      <AppHeader userEmail={user.email ?? ""} />

      <main className="mx-auto max-w-2xl px-4 pt-4">
        {pendingSuggestions > 0 && (
          <Link
            href="/suggestions"
            className="mb-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 active:bg-amber-100"
          >
            <span className="text-sm font-medium text-amber-800">
              🔔 Tenés {pendingSuggestions}{" "}
              {pendingSuggestions === 1
                ? "sugerencia pendiente"
                : "sugerencias pendientes"}{" "}
              de revisar
            </span>
            <span className="text-amber-600">→</span>
          </Link>
        )}

        <Link
          href="/listings?estado=disponible"
          className="mb-3 block rounded-2xl bg-brand-600 p-5 text-white shadow-sm active:bg-brand-700"
        >
          <p className="text-4xl font-bold">{statusTotals.disponible}</p>
          <p className="mt-1 text-sm font-medium text-brand-100">
            Alquileres disponibles
          </p>
        </Link>

        <div className="mb-6 grid grid-cols-3 gap-2">
          <Link
            href="/listings?estado=reservado"
            className="rounded-xl bg-amber-50 px-3 py-2.5 text-center active:bg-amber-100"
          >
            <p className="text-lg font-bold text-amber-700">
              {statusTotals.reservado}
            </p>
            <p className="text-[11px] font-medium text-amber-600">Reservados</p>
          </Link>
          <Link
            href="/listings?estado=proximamente"
            className="rounded-xl bg-sky-50 px-3 py-2.5 text-center active:bg-sky-100"
          >
            <p className="text-lg font-bold text-sky-700">
              {statusTotals.proximamente}
            </p>
            <p className="text-[11px] font-medium text-sky-600">Próximamente</p>
          </Link>
          <Link
            href="/listings?estado=pausado"
            className="rounded-xl bg-slate-100 px-3 py-2.5 text-center active:bg-slate-200"
          >
            <p className="text-lg font-bold text-slate-600">
              {statusTotals.pausado}
            </p>
            <p className="text-[11px] font-medium text-slate-500">Pausados</p>
          </Link>
        </div>

        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          Disponibles por tipo
        </h2>
        {typeTiles.length === 0 ? (
          <p className="mt-8 text-center text-sm text-slate-400">
            Todavía no hay alquileres cargados. Tocá el botón + para cargar el
            primero.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {typeTiles.map((type) => (
              <Link
                key={type}
                href={`/listings?tipo=${type}&estado=disponible`}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50"
              >
                <span className="text-2xl">{TYPE_ICONS[type]}</span>
                <div className="min-w-0">
                  <p className="text-xl font-bold leading-tight text-slate-900">
                    {availableByType.get(type) ?? 0}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {PROPERTY_TYPE_LABELS[type]}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
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
