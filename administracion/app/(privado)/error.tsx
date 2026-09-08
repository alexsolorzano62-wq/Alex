"use client";

// Las acciones del servidor avisan los problemas tirando un error con un
// mensaje en castellano. Acá se muestra ese mensaje, no un stack trace.
export default function Error({
  error, reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <h1 className="titulo">No se pudo completar</h1>
      <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error.message || "Ocurrió un problema inesperado."}
      </p>
      <button onClick={reset} className="boton mt-5">Reintentar</button>
    </div>
  );
}
