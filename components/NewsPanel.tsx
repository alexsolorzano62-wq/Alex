"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  ListingStatus,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/lib/types";

const LAST_SEEN_KEY = "novedades:ultimaVista";

function formatWhen(iso: string) {
  const date = new Date(iso);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

// Los precios llegan como "ARS 420000.00" desde la base de datos.
function formatMoney(raw: string | null) {
  if (!raw) return "sin precio";
  const [currency, amount] = raw.split(" ");
  const value = Number(amount);
  if (Number.isNaN(value)) return raw;
  const symbol = currency === "USD" ? "US$" : "$";
  return `${symbol} ${value.toLocaleString("es-AR", {
    maximumFractionDigits: 0,
  })}`;
}

function StatusChip({ value }: { value: string | null }) {
  if (!value) return <span className="text-slate-400">—</span>;
  const status = value as ListingStatus;
  const label = STATUS_LABELS[status] ?? value;
  const color = STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${color}`}>
      {label}
    </span>
  );
}

export default function NewsPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Activity[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);

  const fetchNews = useCallback(async () => {
    const supabase = createClient();
    const [{ data: activity }, { data: profiles }] = await Promise.all([
      supabase
        .from("activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase.from("profiles").select("id, full_name"),
    ]);

    return {
      rows: (activity ?? []) as Activity[],
      names: new Map(
        (profiles ?? []).map((p) => [p.id, p.full_name ?? "Agente"])
      ),
    };
  }, []);

  // Al entrar se cuentan las novedades posteriores a la última vez que se abrió.
  useEffect(() => {
    let active = true;

    const timer = setTimeout(async () => {
      const { rows, names: agentNames } = await fetchNews();
      if (!active) return;

      setItems(rows);
      setNames(agentNames);

      const lastSeen = window.localStorage.getItem(LAST_SEEN_KEY);
      setUnread(
        lastSeen ? rows.filter((r) => r.created_at > lastSeen).length : rows.length
      );
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fetchNews]);

  async function handleOpen() {
    setOpen(true);
    setLoading(true);
    const { rows, names: agentNames } = await fetchNews();
    setItems(rows);
    setNames(agentNames);
    setLoading(false);
    window.localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    setUnread(0);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label="Novedades"
        className="relative rounded-lg px-3 py-2 text-sm font-medium text-slate-500 active:bg-slate-100"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
        >
          <path
            d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z"
            strokeLinejoin="round"
          />
          <path d="M16 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11" strokeLinecap="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-40">
          <button
            aria-label="Cerrar novedades"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/40"
          />
          <aside className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-base font-bold text-slate-900">Novedades</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1 text-xl text-slate-400 active:bg-slate-100"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {loading && (
                <p className="text-sm text-slate-400">Cargando novedades...</p>
              )}

              {!loading && items.length === 0 && (
                <p className="mt-8 text-center text-sm text-slate-400">
                  Todavía no hay movimientos. Acá vas a ver los cambios de precio
                  y de estado que hagan tus compañeros.
                </p>
              )}

              <ul className="space-y-3">
                {items.map((item) => {
                  const who = item.changed_by
                    ? (names.get(item.changed_by) ?? "Agente")
                    : "Alguien";

                  return (
                    <li
                      key={item.id}
                      className="rounded-xl border border-slate-200 px-3 py-2.5"
                    >
                      {item.listing_id ? (
                        <Link
                          href={`/listings/${item.listing_id}`}
                          onClick={() => setOpen(false)}
                          className="block truncate text-sm font-semibold text-brand-700"
                        >
                          {item.listing_title}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-semibold text-slate-500">
                          {item.listing_title}
                        </p>
                      )}

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm">
                        {item.kind === "creada" && (
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                            Nueva propiedad
                          </span>
                        )}

                        {item.kind === "precio" && (
                          <>
                            <span className="text-slate-400 line-through">
                              {formatMoney(item.old_value)}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="font-bold text-brand-700">
                              {formatMoney(item.new_value)}
                            </span>
                          </>
                        )}

                        {item.kind === "estado" && (
                          <>
                            <StatusChip value={item.old_value} />
                            <span className="text-slate-400">→</span>
                            <StatusChip value={item.new_value} />
                          </>
                        )}
                      </div>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {who} · {formatWhen(item.created_at)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
