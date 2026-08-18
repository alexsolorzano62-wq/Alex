"use client";

import { useEffect } from "react";

/**
 * Deja la app instalable y con el cascarón cacheado.
 *
 * El service worker vive en `public/sw.js`; acá solo se lo registra una vez
 * que la página ya cargó, para no competir con la carga inicial.
 */
export default function RegistrarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const registrar = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Sin service worker la app sigue andando: solo se pierde el modo offline.
      });
    };

    if (document.readyState === "complete") {
      registrar();
    } else {
      window.addEventListener("load", registrar, { once: true });
      return () => window.removeEventListener("load", registrar);
    }
  }, []);

  return null;
}
