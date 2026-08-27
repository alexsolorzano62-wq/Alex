import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CerrarSesion } from "@/components/CerrarSesion";
import type { Perfil } from "@/lib/supabase/perfil";

const SECCIONES = [
  { href: "/panel", texto: "Panel" },
  { href: "/unidades", texto: "Unidades" },
  { href: "/contratos", texto: "Contratos" },
  { href: "/cobros", texto: "Planilla" },
  { href: "/gastos", texto: "Gastos" },
  { href: "/avisos", texto: "Avisos" },
  { href: "/liquidaciones", texto: "Liquidaciones" },
];

export function Encabezado({ perfil }: { perfil: Perfil }) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/panel" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {SECCIONES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              {s.texto}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-right text-xs leading-tight text-stone-500 sm:block">
            {perfil.nombre}
            {perfil.rol === "admin" && (
              <span className="block text-[10px] uppercase tracking-wider text-marca-700">
                Administrador
              </span>
            )}
          </span>
          <CerrarSesion />
        </div>
      </div>
    </header>
  );
}
