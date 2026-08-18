import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { cerrarSesion } from "@/app/acciones";

export default function Encabezado({ subtitulo }: { subtitulo?: string }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
      <Link href="/" className="flex min-w-0 items-center gap-2">
        <LogoMark className="h-8 w-8 shrink-0 text-brand-600" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight">Préstamos</p>
          {subtitulo && (
            <p className="truncate text-xs text-slate-500">{subtitulo}</p>
          )}
        </div>
      </Link>
      <form action={cerrarSesion}>
        <button
          type="submit"
          aria-label="Salir"
          title="Salir"
          className="rounded-lg p-2 text-slate-400 active:bg-slate-100"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M15 17l5-5-5-5M20 12H9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" strokeLinecap="round" />
          </svg>
        </button>
      </form>
    </header>
  );
}
