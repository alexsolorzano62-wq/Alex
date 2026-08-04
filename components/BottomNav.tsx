"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/types";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M8 6h13M8 12h13M8 18h13" strokeLinecap="round" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.3 21a2 2 0 0 0 3.4 0" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" strokeLinecap="round" />
      <path d="M16.5 11.5a3 3 0 1 0-2-5.3" strokeLinecap="round" />
      <path d="M17 14.5a5.5 5.5 0 0 1 4.5 5.5" strokeLinecap="round" />
    </svg>
  );
}

export default function BottomNav({
  role = "agent",
  pendingSuggestions = 0,
}: {
  role?: UserRole;
  pendingSuggestions?: number;
}) {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: "Inicio", icon: <HomeIcon /> },
    { href: "/listings", label: "Alquileres", icon: <ListIcon /> },
    {
      href: "/suggestions",
      label: "Sugerencias",
      icon: <BellIcon />,
      badge: pendingSuggestions,
    },
    ...(role === "admin"
      ? [{ href: "/admin/agents", label: "Agentes", icon: <UsersIcon /> }]
      : []),
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                active ? "text-brand-600" : "text-slate-400"
              }`}
            >
              <span className="relative">
                {item.icon}
                {"badge" in item && item.badge != null && item.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
