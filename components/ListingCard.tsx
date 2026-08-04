import Link from "next/link";
import {
  Listing,
  PROPERTY_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  formatPrice,
} from "@/lib/types";

export default function ListingCard({
  listing,
  agentName,
}: {
  listing: Listing;
  agentName?: string;
}) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition active:scale-[0.99] active:bg-slate-50"
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl text-brand-600">
        🏠
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="truncate text-sm font-semibold text-slate-900">
            {listing.title}
          </h2>
          <span className="flex shrink-0 items-center gap-1">
            {listing.priority_note && (
              <span
                className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-700"
                title="Tiene un detalle importante"
              >
                ⚠
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[listing.status]}`}
            >
              {STATUS_LABELS[listing.status]}
            </span>
          </span>
        </div>
        <p className="truncate text-xs text-slate-500">
          {[listing.neighborhood, listing.city].filter(Boolean).join(", ") ||
            "Zona sin especificar"}
        </p>
        <p className="mt-1 text-sm font-bold text-brand-700">
          {formatPrice(listing.price, listing.currency)}
        </p>
        <p className="truncate text-[11px] text-slate-400">
          {PROPERTY_TYPE_LABELS[listing.property_type]}
          {listing.bedrooms ? ` · ${listing.bedrooms} dorm.` : ""}
          {agentName ? ` · 👤 ${agentName}` : ""}
        </p>
      </div>
    </Link>
  );
}
