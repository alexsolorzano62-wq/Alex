// El isotipo del logo: las torres verdes sobre la base en rombo.
// Si algún día querés usar el archivo original, poné el PNG en
// `public/logo.png` y cambiá este componente por una <Image />.
export function Isotipo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g fill="#1a9b3e">
        <rect x="30" y="42" width="6" height="34" />
        <rect x="40" y="30" width="6" height="46" />
        <rect x="50" y="22" width="6" height="54" />
        <rect x="60" y="30" width="6" height="46" />
        <rect x="70" y="42" width="6" height="34" />
      </g>
      <path
        d="M53 92 8 70l45-14 45 14-45 22z"
        fill="none"
        stroke="#1a9b3e"
        strokeWidth="4"
        transform="translate(-3,-8)"
      />
    </svg>
  );
}

export function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Isotipo className={compacto ? "h-7 w-7" : "h-9 w-9"} />
      <div className="leading-none">
        <div
          className={`font-titulo font-bold tracking-tight text-stone-900 ${
            compacto ? "text-sm" : "text-base"
          }`}
        >
          Lamelas &amp; Chaumont
        </div>
        {!compacto && (
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-stone-500">
            Administración
          </div>
        )}
      </div>
    </div>
  );
}
