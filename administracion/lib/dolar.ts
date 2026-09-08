// Cotización del dólar.
//
// No se lee de dolarhoy ni de El Cronista: esos son sitios de noticias y para
// sacarles el número habría que rasparles el HTML, que cambia cuando les da la
// gana y se lleva puesta la pantalla sin avisar. dolarapi.com publica los
// mismos valores como datos, sin clave y sin costo.

export type Cotizacion = {
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  actualizado: string;
};

// Las que le sirven a una inmobiliaria: el oficial para lo formal, el blue
// porque es con el que se habla, y el MEP porque es con el que se opera.
export const CASAS_VISIBLES = ["oficial", "blue", "bolsa"] as const;

const NOMBRES: Record<string, string> = {
  oficial: "Oficial",
  blue: "Blue",
  bolsa: "MEP",
  contadoconliqui: "CCL",
  mayorista: "Mayorista",
  tarjeta: "Tarjeta",
  cripto: "Cripto",
};

// Si la fuente no contesta, la pantalla se dibuja sin la cotización. Una
// cartelera de cambio caída no es motivo para que no puedas cobrar un alquiler.
export async function cotizaciones(): Promise<Cotizacion[] | null> {
  try {
    const respuesta = await fetch("https://dolarapi.com/v1/dolares", {
      // Se guarda diez minutos: el blue no se mueve tanto como para pedirlo en
      // cada carga de pantalla, y así no dependemos de que el servicio aguante.
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(4000),
    });

    if (!respuesta.ok) return null;

    const datos = (await respuesta.json()) as unknown[];
    if (!Array.isArray(datos)) return null;

    const leidas = datos
      .map((d) => d as Record<string, unknown>)
      .filter((d) => typeof d?.casa === "string" && Number.isFinite(Number(d?.venta)))
      .map((d) => ({
        casa: String(d.casa),
        nombre: NOMBRES[String(d.casa)] ?? String(d.nombre ?? d.casa),
        compra: Number(d.compra),
        venta: Number(d.venta),
        actualizado: String(d.fechaActualizacion ?? ""),
      }));

    return leidas.length > 0 ? leidas : null;
  } catch {
    return null;
  }
}

export function soloVisibles(todas: Cotizacion[] | null): Cotizacion[] {
  if (!todas) return [];
  return CASAS_VISIBLES
    .map((c) => todas.find((d) => d.casa === c))
    .filter((d): d is Cotizacion => d != null);
}
