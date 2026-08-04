import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Busca direcciones para el autocompletado del formulario de carga.
// Usa Photon (OpenStreetMap): gratuito, sin clave de API.
// Los resultados se acotan a Tucumán y se priorizan los cercanos a la capital.
const TUCUMAN_BBOX = "-66.2,-28.1,-64.3,-25.9";
const CAPITAL_LAT = -26.83;
const CAPITAL_LON = -65.2;

export interface GeocodeResult {
  label: string;
  city: string | null;
  latitude: number;
  longitude: number;
  // true cuando no se encontró la altura exacta y se ubicó solo la calle.
  approximate: boolean;
}

async function searchPhoton(
  query: string,
  approximate: boolean
): Promise<GeocodeResult[]> {
  const url =
    "https://photon.komoot.io/api/?" +
    new URLSearchParams({
      q: query,
      limit: "5",
      bbox: TUCUMAN_BBOX,
      lat: String(CAPITAL_LAT),
      lon: String(CAPITAL_LON),
    });

  const res = await fetch(url, {
    headers: { "User-Agent": "LamelasChaumontApp/1.0" },
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok) return [];

  const data = await res.json();
  const seen = new Set<string>();
  const results: GeocodeResult[] = [];

  for (const feature of data.features ?? []) {
    const props = feature.properties ?? {};
    const coords = feature.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;

    const street = props.street || props.name;
    if (!street) continue;

    const label = [street, props.housenumber].filter(Boolean).join(" ");
    const city = props.city || props.county || props.district || null;

    const key = `${label}|${city}`;
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({
      label,
      city,
      latitude: Number(coords[1]),
      longitude: Number(coords[0]),
      approximate,
    });
  }

  return results;
}

export async function GET(request: Request) {
  // Solo para usuarios con sesión iniciada: es una herramienta interna.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchPhoton(query, false);
    if (results.length > 0) {
      return NextResponse.json({ results });
    }

    // OpenStreetMap no tiene todas las alturas cargadas. Si no encontró la
    // altura exacta, se ofrece la calle sola como ubicación aproximada.
    const streetOnly = query.replace(/\s*\d[\d\s/-]*$/, "").trim();
    if (streetOnly.length >= 3 && streetOnly !== query) {
      return NextResponse.json({
        results: await searchPhoton(streetOnly, true),
      });
    }

    return NextResponse.json({ results: [] });
  } catch {
    // Si el buscador no responde, el agente igual puede escribir la dirección a mano.
    return NextResponse.json({ results: [] });
  }
}
