"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

type Tema = "claro" | "oscuro" | "sistema";

const CLAVE = "tema";

// Aplica el tema al documento. Se llama también desde el script que corre
// antes de pintar, en el layout, para que no haya un destello blanco.
function aplicar(tema: Tema) {
  const oscuro =
    tema === "oscuro" ||
    (tema === "sistema" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", oscuro);
}

const OPCIONES: { valor: Tema; texto: string; icono: string }[] = [
  { valor: "claro", texto: "Claro", icono: "M12 3v2M12 19v2M5 12H3M21 12h-2M6 6l1.5 1.5M16.5 16.5L18 18M18 6l-1.5 1.5M7.5 16.5L6 18" },
  { valor: "oscuro", texto: "Oscuro", icono: "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" },
  { valor: "sistema", texto: "Automático", icono: "M4 5h16v10H4zM8 19h8M12 15v4" },
];

// La preferencia vive en el navegador, no en React. `useSyncExternalStore` es
// la forma de leerla sin escribir estado dentro de un efecto: en el servidor
// devuelve "sistema" y en el navegador, lo guardado.
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

function suscribir(alCambiar: () => void) {
  oyentes.add(alCambiar);
  window.addEventListener("storage", alCambiar);
  return () => {
    oyentes.delete(alCambiar);
    window.removeEventListener("storage", alCambiar);
  };
}

function leer(): Tema {
  try {
    return (localStorage.getItem(CLAVE) as Tema | null) ?? "sistema";
  } catch {
    return "sistema";
  }
}

export function SelectorTema() {
  const tema = useSyncExternalStore(suscribir, leer, () => "sistema" as Tema);
  const [abierto, setAbierto] = useState(false);

  // En automático hay que seguir al sistema cuando cambia solo, de noche.
  useEffect(() => {
    const medio = window.matchMedia("(prefers-color-scheme: dark)");
    const alCambiar = () => {
      if (leer() === "sistema") aplicar("sistema");
    };
    medio.addEventListener("change", alCambiar);
    return () => medio.removeEventListener("change", alCambiar);
  }, []);

  const elegir = useCallback((nuevo: Tema) => {
    try {
      localStorage.setItem(CLAVE, nuevo);
    } catch {
      // Navegador con el almacenamiento bloqueado: el tema vale para esta
      // pantalla y no se recuerda. Mejor eso que romper el botón.
    }
    aplicar(nuevo);
    avisar();
    setAbierto(false);
  }, []);

  const actual = OPCIONES.find((o) => o.valor === tema) ?? OPCIONES[2];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-label={`Tema: ${actual.texto}`}
        aria-expanded={abierto}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-600 hover:bg-stone-100"
      >
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none"
             stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
             style={{ height: "1.1rem", width: "1.1rem" }} aria-hidden="true">
          <path d={actual.icono} />
          {actual.valor === "claro" && <circle cx="12" cy="12" r="3.5" />}
        </svg>
      </button>

      {abierto && (
        <>
          {/* Un clic en cualquier lado cierra el menú. */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setAbierto(false)}
          />
          <ul className="absolute right-0 z-50 mt-1.5 w-44 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
            {OPCIONES.map((o) => (
              <li key={o.valor}>
                <button
                  type="button"
                  onClick={() => elegir(o.valor)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${
                    o.valor === tema
                      ? "bg-marca-50 font-bold text-marca-700"
                      : "text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none"
                       stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                       strokeLinejoin="round" aria-hidden="true">
                    <path d={o.icono} />
                    {o.valor === "claro" && <circle cx="12" cy="12" r="3.5" />}
                  </svg>
                  {o.texto}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
