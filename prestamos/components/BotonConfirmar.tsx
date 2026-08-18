"use client";

/**
 * Botón para acciones que no se pueden deshacer: pide confirmación antes de
 * mandar el formulario.
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
  return (
    <button
      type="submit"
      className={className}
      onClick={(evento) => {
        if (!window.confirm(pregunta)) evento.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
