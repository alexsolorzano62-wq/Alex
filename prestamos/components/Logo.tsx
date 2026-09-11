/**
 * El billete de la marca.
 *
 * Es el emoji, no un dibujo: se ve nítido en cualquier tamaño y a color en
 * todos los teléfonos, sin pesar nada. Va dentro de un cuadrado azul, igual
 * que el ícono que queda en la pantalla de inicio.
 *
 * El tamaño del emoji sale del `font-size` de la caja, así que quien la usa
 * pasa alto, ancho y tamaño de texto juntos: `h-8 w-8 text-[18px]`.
 */
export function LogoMark({ className = "h-8 w-8 text-[18px]" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-500 leading-none ${className}`}
      role="img"
      aria-label="Préstamos"
    >
      💵
    </span>
  );
}
