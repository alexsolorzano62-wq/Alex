"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const ORDENES = [
  { valor: "direccion", texto: "Dirección A → Z" },
  { valor: "direccion_desc", texto: "Dirección Z → A" },
  { valor: "precio_desc", texto: "Alquiler: del más caro al más barato" },
  { valor: "precio_asc", texto: "Alquiler: del más barato al más caro" },
  { valor: "vencimiento", texto: "Contrato que vence primero" },
] as const;

// El buscador y los filtros viven en la URL: así la vista que estás mirando
// se puede compartir o dejar en un favorito, y volver atrás funciona.
export function FiltrosUnidades({
  tipos, mostrarEstado = true, mostrarOrden = true, mostrarAgrupar = true, marcador,
}: {
  tipos: { valor: string; texto: string }[];
  mostrarEstado?: boolean;
  mostrarOrden?: boolean;
  mostrarAgrupar?: boolean;
  marcador?: string;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();

  const [texto, setTexto] = useState(params.get("q") ?? "");

  // Se espera un momento antes de buscar, para no pedir a la base en cada tecla.
  useEffect(() => {
    const actual = params.get("q") ?? "";
    if (texto === actual) return;

    const tiempo = setTimeout(() => {
      const nuevos = new URLSearchParams(params.toString());
      if (texto.trim()) nuevos.set("q", texto.trim());
      else nuevos.delete("q");
      router.replace(`${ruta}?${nuevos.toString()}`, { scroll: false });
    }, 300);

    return () => clearTimeout(tiempo);
  }, [texto, params, router, ruta]);

  function cambiar(clave: string, valor: string) {
    const nuevos = new URLSearchParams(params.toString());
    if (valor && valor !== "todos") nuevos.set(clave, valor);
    else nuevos.delete(clave);
    router.replace(`${ruta}?${nuevos.toString()}`, { scroll: false });
  }

  const hayFiltros =
    Boolean(texto) ||
    Boolean(params.get("estado")) ||
    Boolean(params.get("tipo")) ||
    Boolean(params.get("orden")) ||
    Boolean(params.get("agrupar"));

  return (
    <div className="mb-4 space-y-3">
      <div className="relative">
        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7"></circle>
          <path d="m20 20-3.5-3.5"></path>
        </svg>
        <input
          type="search"
          className="campo pl-9"
          placeholder={marcador ?? "Buscar por dirección, propietario o inquilino"}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-label="Buscar"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {mostrarOrden && (
          <select
            className="campo w-auto py-1.5 text-sm"
            value={params.get("orden") ?? "direccion"}
            onChange={(e) => cambiar("orden", e.target.value)}
            aria-label="Ordenar por"
          >
            {ORDENES.map((o) => (
              <option key={o.valor} value={o.valor}>{o.texto}</option>
            ))}
          </select>
        )}

        {mostrarAgrupar && (
          <select
            className="campo w-auto py-1.5 text-sm"
            value={params.get("agrupar") ?? "ninguno"}
            onChange={(e) => cambiar("agrupar", e.target.value)}
            aria-label="Agrupar por"
          >
            <option value="ninguno">Sin agrupar</option>
            <option value="propietario">Agrupar por propietario</option>
            <option value="edificio">Agrupar por edificio</option>
          </select>
        )}

        {mostrarEstado && (
          <select
            className="campo w-auto py-1.5 text-sm"
            value={params.get("estado") ?? "todos"}
            onChange={(e) => cambiar("estado", e.target.value)}
            aria-label="Estado"
          >
            <option value="todos">Todos los estados</option>
            <option value="alquilado">Alquiladas</option>
            <option value="disponible">Disponibles</option>
            <option value="en_refaccion">En refacción</option>
            <option value="retirado">Retiradas</option>
          </select>
        )}

        <select
          className="campo w-auto py-1.5 text-sm"
          value={params.get("tipo") ?? "todos"}
          onChange={(e) => cambiar("tipo", e.target.value)}
          aria-label="Tipo de propiedad"
        >
          <option value="todos">Todos los tipos</option>
          {tipos.map((t) => (
            <option key={t.valor} value={t.valor}>{t.texto}</option>
          ))}
        </select>

        {hayFiltros && (
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800"
            onClick={() => {
              setTexto("");
              router.replace(ruta, { scroll: false });
            }}
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}

// Solo el buscador, para las pantallas que ya tienen sus propios filtros.
export function Buscador({ marcador }: { marcador?: string }) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const [texto, setTexto] = useState(params.get("q") ?? "");

  useEffect(() => {
    const actual = params.get("q") ?? "";
    if (texto === actual) return;

    const tiempo = setTimeout(() => {
      const nuevos = new URLSearchParams(params.toString());
      if (texto.trim()) nuevos.set("q", texto.trim());
      else nuevos.delete("q");
      router.replace(`${ruta}?${nuevos.toString()}`, { scroll: false });
    }, 300);

    return () => clearTimeout(tiempo);
  }, [texto, params, router, ruta]);

  return (
    <div className="relative mb-4">
      <svg
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7"></circle>
        <path d="m20 20-3.5-3.5"></path>
      </svg>
      <input
        type="search"
        className="campo pl-9"
        placeholder={marcador ?? "Buscar por dirección, propietario o inquilino"}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        aria-label="Buscar"
      />
    </div>
  );
}
