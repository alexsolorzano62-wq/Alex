"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function IconoInicio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoPrestamos() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" strokeLinecap="round" />
      <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" strokeLinecap="round" />
    </svg>
  );
}

function IconoClientes() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" strokeLinecap="round" />
      <path d="M16.5 11.5a3 3 0 1 0-2-5.3" strokeLinecap="round" />
      <path d="M17 14.5a5.5 5.5 0 0 1 4.5 5.5" strokeLinecap="round" />
    </svg>
  );
}

const ITEMS = [
  { href: "/", label: "Inicio", icono: <IconoInicio /> },
  { href: "/prestamos", label: "Préstamos", icono: <IconoPrestamos /> },
  { href: "/clientes", label: "Clientes", icono: <IconoClientes /> },
];

export default function NavInferior() {
  const ruta = usePathname();

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl">
        {ITEMS.map((item) => {
          const activo =
            item.href === "/" ? ruta === "/" : ruta.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activo ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                activo ? "text-brand-600" : "text-slate-400"
              }`}
            >
              {item.icono}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
