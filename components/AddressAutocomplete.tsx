"use client";

import { useEffect, useRef, useState } from "react";

export interface AddressValue {
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Suggestion {
  label: string;
  city: string | null;
  latitude: number;
  longitude: number;
  approximate: boolean;
}

export default function AddressAutocomplete({
  value,
  onChange,
}: {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // Evita volver a buscar el texto que el propio agente acaba de elegir.
  const justPickedRef = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (justPickedRef.current) {
      justPickedRef.current = false;
      return;
    }

    const query = value.address.trim();
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      if (query.length < 3) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setSuggestions(data.results ?? []);
        setOpen(true);
      } catch {
        // Búsqueda cancelada o sin conexión: se sigue pudiendo escribir a mano.
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value.address]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function pick(suggestion: Suggestion) {
    justPickedRef.current = true;
    onChange({
      // Si solo se ubicó la calle, se respeta la dirección con altura que
      // escribió el agente y se usan las coordenadas de la calle.
      address: suggestion.approximate ? value.address.trim() : suggestion.label,
      city: suggestion.city,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
    setOpen(false);
    setSuggestions([]);
  }

  function handleType(text: string) {
    // Al editar el texto a mano, las coordenadas anteriores dejan de ser válidas.
    onChange({
      address: text,
      city: value.city,
      latitude: null,
      longitude: null,
    });
  }

  const hasCoords = value.latitude != null && value.longitude != null;

  return (
    <div ref={boxRef} className="relative">
      <label className="mb-1 block text-sm font-medium text-slate-700">
        Dirección *
      </label>
      <input
        value={value.address}
        onChange={(e) => handleType(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        required
        autoComplete="off"
        placeholder="Escribí la calle y la altura"
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />

      {loading && (
        <p className="mt-1 text-xs text-slate-400">Buscando direcciones...</p>
      )}

      {hasCoords && !open && (
        <p className="mt-1 text-xs text-emerald-600">
          📍 Ubicación confirmada{value.city ? ` · ${value.city}` : ""}
        </p>
      )}

      {!hasCoords && !loading && !open && value.address.trim().length >= 3 && (
        <p className="mt-1 text-xs text-slate-400">
          Sin ubicación en el mapa. Podés guardarla igual.
        </p>
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <li key={`${s.label}-${i}`}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="flex w-full items-center gap-2 border-b border-slate-100 px-4 py-3 text-left last:border-0 active:bg-slate-50"
              >
                <span className="text-slate-400">📍</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {s.label}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {s.city}
                    {s.approximate && (
                      <span className="text-amber-600">
                        {s.city ? " · " : ""}solo la calle
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
