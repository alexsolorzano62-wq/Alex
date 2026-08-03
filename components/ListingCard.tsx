import Link from "next/link";
import Image from "next/image";
import {
  Listing,
  PROPERTY_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/lib/types";

function formatPrice(price: number | null, currency: string) {
  if (price == null) return "Consultar precio";
  const symbol = currency === "USD" ? "US$" : "$";
  return `${symbol} ${price.toLocaleString("es-AR")}`;
}

export default function ListingCard({
  listing,
  thumbnailUrl,
}: {
  listing: Listing;
  thumbnailUrl?: string;
}) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition active:scale-[0.99] active:bg-slate-50"
    >
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={listing.title}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-slate-300">
            🏠
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="truncate text-sm font-semibold text-slate-900">
            {listing.title}
          </h2>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[listing.status]}`}
          >
            {STATUS_LABELS[listing.status]}
          </span>
        </div>
        <p className="truncate text-xs text-slate-500">
          {[listing.neighborhood, listing.city].filter(Boolean).join(", ") ||
            "Zona sin especificar"}
        </p>
        <p className="mt-1 text-sm font-bold text-brand-700">
          {formatPrice(listing.price, listing.currency)}
        </p>
        <p className="text-[11px] text-slate-400">
          {PROPERTY_TYPE_LABELS[listing.property_type]}
          {listing.rooms ? ` · ${listing.rooms} amb.` : ""}
        </p>
      </div>
    </Link>
  );
}
