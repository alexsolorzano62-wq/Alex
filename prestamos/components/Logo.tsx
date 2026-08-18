export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {/* De abajo hacia arriba: cada moneda tapa a la de atrás. */}
      <g fill="currentColor" stroke="currentColor" strokeWidth="0">
        <rect width="100" height="100" rx="22" />
      </g>
      <g fill="none" stroke="white" strokeWidth="6">
        <ellipse cx="50" cy="70" rx="30" ry="10" />
      </g>
      <g fill="currentColor" stroke="white" strokeWidth="6">
        <ellipse cx="50" cy="52" rx="30" ry="10" />
        <ellipse cx="50" cy="34" rx="30" ry="10" />
      </g>
    </svg>
  );
}
