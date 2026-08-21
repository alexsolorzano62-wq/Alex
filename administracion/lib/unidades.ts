import type { Moneda } from "@/lib/types";

// Una unidad es la propiedad más el contrato que la tiene ocupada hoy. Es la
// forma en que la inmobiliaria mira su cartera: por dirección, no por contrato.
export type Unidad = {
  id: string;
  direccion: string;
  pisoDepto: string | null;
  direccionCompleta: string;
  localidad: string | null;
  tipo: string;
  estado: string;
  propietarioId: string | null;
  propietario: string;
  contratoId: string | null;
  inquilino: string | null;
  monto: number | null;
  moneda: Moneda;
  indice: string | null;
  honorarios: number | null;
  fechaFin: string | null;
  proximoAjuste: string | null;
};

export type Orden =
  | "direccion" | "direccion_desc" | "precio_desc" | "precio_asc" | "vencimiento";

// Coincide si el texto aparece en la dirección, en el propietario o en el
// inquilino. Sin acentos y sin distinguir mayúsculas: nadie escribe "Núñez"
// con tilde cuando está apurado.
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function coincide(unidad: Unidad, busqueda: string): boolean {
  const aguja = normalizar(busqueda.trim());
  if (!aguja) return true;

  const pajar = normalizar(
    [unidad.direccionCompleta, unidad.localidad, unidad.propietario, unidad.inquilino]
      .filter(Boolean)
      .join(" ")
  );

  // Cada palabra tiene que aparecer en algún lado: "mitre peña" encuentra la
  // propiedad de Mitre cuyo dueño es Peña.
  return aguja.split(/\s+/).every((palabra) => pajar.includes(palabra));
}

const comparador = new Intl.Collator("es-AR", { numeric: true, sensitivity: "base" });

export function ordenar(unidades: Unidad[], orden: Orden): Unidad[] {
  const lista = [...unidades];

  switch (orden) {
    case "direccion_desc":
      return lista.sort((a, b) => comparador.compare(b.direccionCompleta, a.direccionCompleta));

    case "precio_desc":
      // Las unidades sin contrato no tienen precio: van al final en los dos
      // órdenes, para que no ensucien el principio de la lista.
      return lista.sort((a, b) => {
        if (a.monto == null && b.monto == null) return comparador.compare(a.direccionCompleta, b.direccionCompleta);
        if (a.monto == null) return 1;
        if (b.monto == null) return -1;
        return b.monto - a.monto;
      });

    case "precio_asc":
      return lista.sort((a, b) => {
        if (a.monto == null && b.monto == null) return comparador.compare(a.direccionCompleta, b.direccionCompleta);
        if (a.monto == null) return 1;
        if (b.monto == null) return -1;
        return a.monto - b.monto;
      });

    case "vencimiento":
      return lista.sort((a, b) => {
        if (!a.fechaFin && !b.fechaFin) return comparador.compare(a.direccionCompleta, b.direccionCompleta);
        if (!a.fechaFin) return 1;
        if (!b.fechaFin) return -1;
        return a.fechaFin.localeCompare(b.fechaFin);
      });

    case "direccion":
    default:
      return lista.sort((a, b) => comparador.compare(a.direccionCompleta, b.direccionCompleta));
  }
}
