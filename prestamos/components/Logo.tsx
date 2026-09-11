/**
 * El As de $: un naipe donde el palo es el signo peso.
 *
 * Son dos dibujos y no uno. La carta entera tiene cinco elementos y por debajo
 * de unos 40 px se vuelve un borrón, así que donde el logo va chico —el
 * encabezado— se usa solo el peso. Es la misma decisión que toman los íconos:
 * `scripts/generar-iconos.py` genera los dos.
 */
const SERIF = "Georgia, 'Times New Roman', serif";

export function LogoMark({
  className = "h-8 w-8",
  variante = "simple",
}: {
  className?: string;
  variante?: "simple" | "carta";
}) {
  if (variante === "simple") {
    return (
      <svg viewBox="0 0 100 100" className={`shrink-0 ${className}`} role="img" aria-label="Préstamos">
        <rect width="100" height="100" rx="18" fill="#1877f2" />
        <text
          x="50" y="50" fontFamily={SERIF} fontWeight="bold" fontSize="66"
          fill="#f7f9fc" textAnchor="middle" dominantBaseline="central"
        >
          $
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className={`shrink-0 ${className}`} role="img" aria-label="Préstamos">
      <rect width="100" height="100" rx="18" fill="#1877f2" />
      <rect x="19.5" y="7" width="61" height="86" rx="5.2" fill="#f7f9fc" />

      {/* Los dos índices son el mismo dibujo, uno girado media vuelta. */}
      <g fontFamily={SERIF} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
        <g>
          <text x="32" y="18.6" fontSize="14.6" fill="#0a2e6b">A</text>
          <text x="32" y="31.9" fontSize="8.6" fill="#059669">$</text>
        </g>
        <g transform="rotate(180 50 50)">
          <text x="32" y="18.6" fontSize="14.6" fill="#0a2e6b">A</text>
          <text x="32" y="31.9" fontSize="8.6" fill="#059669">$</text>
        </g>
        <text x="50" y="50" fontSize="36" fill="#059669">$</text>
      </g>
    </svg>
  );
}
