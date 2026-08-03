import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeleteListingButton from "@/components/DeleteListingButton";
import {
  PROPERTY_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/lib/types";

function formatPrice(price: number | null, currency: string) {
  if (price == null) return "Consultar precio";
  const symbol = currency === "USD" ? "US$" : "$";
  return `${symbol} ${price.toLocaleString("es-AR")}`;
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
    .single();

  if (!listing) notFound();

  let photoUrls: string[] = [];
  if (listing.photos?.length) {
    const { data: signed } = await supabase.storage
      .from("listing-photos")
      .createSignedUrls(listing.photos, 60 * 60);
    photoUrls = signed?.map((s) => s.signedUrl).filter(Boolean) as string[];
  }

  const isOwner = listing.created_by === user.id;

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
        {photoUrls.length > 0 ? (
          <div className="mb-4 flex snap-x gap-2 overflow-x-auto">
            {photoUrls.map((url, i) => (
              <div
                key={i}
                className="relative h-56 w-full flex-shrink-0 snap-center overflow-hidden rounded-2xl bg-slate-100"
              >
                <Image
                  src={url}
                  alt={`Foto ${i + 1}`}
                  fill
                  sizes="500px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-4 flex h-40 items-center justify-center rounded-2xl bg-slate-100 text-4xl text-slate-300">
            🏠
          </div>
        )}

        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {listing.title}
            </h2>
            <p className="text-sm text-slate-500">
              {[listing.address, listing.neighborhood, listing.city]
                .filter(Boolean)
                .join(", ") || "Ubicación sin especificar"}
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

        <div className="mb-4 grid grid-cols-4 gap-2 text-center text-xs text-slate-600">
          <div className="rounded-xl bg-slate-100 py-2">
            <p className="font-bold text-slate-900">
              {PROPERTY_TYPE_LABELS[listing.property_type]}
            </p>
            <p>Tipo</p>
          </div>
          <div className="rounded-xl bg-slate-100 py-2">
            <p className="font-bold text-slate-900">{listing.rooms ?? "-"}</p>
            <p>Ambientes</p>
          </div>
          <div className="rounded-xl bg-slate-100 py-2">
            <p className="font-bold text-slate-900">
              {listing.bathrooms ?? "-"}
            </p>
            <p>Baños</p>
          </div>
          <div className="rounded-xl bg-slate-100 py-2">
            <p className="font-bold text-slate-900">
              {listing.area_m2 ?? "-"}
            </p>
            <p>m²</p>
          </div>
        </div>

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

        {listing.contact_phone && (
          <a
            href={`tel:${listing.contact_phone}`}
            className="mb-4 block rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white active:bg-slate-700"
          >
            Llamar al contacto: {listing.contact_phone}
          </a>
        )}

        {isOwner && (
          <div className="mt-6 space-y-2 border-t border-slate-200 pt-4">
            <Link
              href={`/listings/${listing.id}/edit`}
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 active:bg-slate-50"
            >
              Editar alquiler
            </Link>
            <DeleteListingButton
              listingId={listing.id}
              photos={listing.photos ?? []}
            />
          </div>
        )}
      </main>
    </div>
  );
}
