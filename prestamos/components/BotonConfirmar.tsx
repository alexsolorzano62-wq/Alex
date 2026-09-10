"use client";

import { useSyncExternalStore } from "react";

/**
 * Botón para acciones que no se pueden deshacer.
 *
 * Queda deshabilitado hasta que la página termina de cargar del todo. Si no,
 * un toque apurado en un celular lento manda el formulario antes de que el
 * navegador pueda preguntar nada, y la acción se ejecuta sin confirmación.
 */
export default function BotonConfirmar({
  pregunta,
  children,
  className,
}: {
  pregunta: string;
  children: React.ReactNode;
  className?: string;
}) {
  // false mientras se dibuja en el servidor y durante la hidratación;
  // true recién cuando el botón ya responde de verdad.
  const listo = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  return (
    <button
      type="submit"
      disabled={!listo}
      className={`${className} disabled:opacity-50`}
      onClick={(evento) => {
        if (!window.confirm(pregunta)) evento.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
