"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/panel", texto: "Panel", icono: "M3 12l9-9 9 9M5 10v10h14V10" },
  { href: "/unidades", texto: "Unidades", icono: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5" },
  { href: "/cobros", texto: "Planilla", icono: "M3 7h18v10H3zM7 12h.01M17 12h.01" },
  { href: "/liquidaciones", texto: "Liquidar", icono: "M6 3h12v18l-3-2-3 2-3-2-3 2V3zm3 5h6M9 12h6" },
  { href: "/mas", texto: "Más", icono: "M4 6h16M4 12h16M4 18h16" },
];

export function NavInferior() {
  const ruta = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-lg">
        {SECCIONES.map((s) => {
          const activa = ruta === s.href || ruta.startsWith(`${s.href}/`);
          return (
            <li key={s.href} className="flex-1">
              <Link
                href={s.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  activa ? "text-marca-700" : "text-stone-500"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d={s.icono} />
                </svg>
                {s.texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
