"use client";

import { useEffect, useState } from "react";

/** Barra fija que avisa cuando el celular se quedó sin señal. */
export default function AvisoSinConexion() {
  const [sinConexion, setSinConexion] = useState(false);

  useEffect(() => {
    const actualizar = () => setSinConexion(!navigator.onLine);

    actualizar();
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);
    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
    };
  }, []);

  if (!sinConexion) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-30 bg-amber-500 px-4 py-1.5 text-center text-xs font-semibold text-white"
    >
      Sin conexión — estás viendo los últimos datos cargados
    </div>
  );
}
