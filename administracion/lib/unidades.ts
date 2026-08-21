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
  edificio: string | null;
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

export function ordenar<T extends Unidad>(unidades: T[], orden: Orden): T[] {
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

// ---------------------------------------------------------------------------
// Agrupar la cartera.
//
// Por propietario, porque hay dueños con unidades en direcciones distintas y
// verlas juntas es lo que después se liquida junto. Por edificio, porque hay
// dueños de edificios enteros y el mes se mira piso por piso.
// ---------------------------------------------------------------------------

export type Agrupado = "ninguno" | "propietario" | "edificio";

export type Grupo<T extends Unidad = Unidad> = {
  clave: string;
  titulo: string;
  subtitulo: string | null;
  href: string | null;
  unidades: T[];
  renta: number;
  alquiladas: number;
  vacantes: number;
};

// El edificio cargado a mano manda sobre la dirección: sirve para unir
// unidades que se escribieron distinto ("Rivadavia 2340" y "Av. Rivadavia
// 2340") y para ponerle el nombre propio al grupo.
export function claveDeEdificio(unidad: Unidad): string {
  const nombre = unidad.edificio?.trim();
  if (nombre) return `n:${normalizar(nombre)}`;
  return `d:${normalizar(unidad.direccion)}|${normalizar(unidad.localidad ?? "")}`;
}

function resumir(unidades: Unidad[]): Pick<Grupo, "renta" | "alquiladas" | "vacantes"> {
  return {
    renta: unidades
      .filter((u) => u.moneda === "ARS" && u.monto != null)
      .reduce((suma, u) => suma + (u.monto ?? 0), 0),
    alquiladas: unidades.filter((u) => u.estado === "alquilado").length,
    vacantes: unidades.filter((u) => u.estado !== "alquilado").length,
  };
}

function plural(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

export function agrupar<T extends Unidad>(
  unidades: T[],
  criterio: Agrupado,
  orden: Orden
): Grupo<T>[] {
  if (criterio === "ninguno") return [];

  const cajones = new Map<string, T[]>();

  for (const unidad of unidades) {
    const clave =
      criterio === "propietario"
        ? unidad.propietarioId ?? `sin-propietario`
        : claveDeEdificio(unidad);

    const cajon = cajones.get(clave);
    if (cajon) cajon.push(unidad);
    else cajones.set(clave, [unidad]);
  }

  const grupos: Grupo<T>[] = [];

  for (const [clave, delGrupo] of cajones) {
    const ordenadas = ordenar(delGrupo, orden);
    const primera = ordenadas[0];

    if (criterio === "propietario") {
      // Cuántas direcciones distintas tiene: es el dato que dice de un vistazo
      // si el dueño tiene un edificio o unidades desparramadas.
      const direcciones = new Set(ordenadas.map((u) => normalizar(u.direccion)));
      grupos.push({
        clave,
        titulo: primera.propietario || "Sin propietario asignado",
        subtitulo: plural(direcciones.size, "dirección", "direcciones"),
        href: primera.propietarioId ? `/propietarios/${primera.propietarioId}` : null,
        unidades: ordenadas,
        ...resumir(ordenadas),
      });
      continue;
    }

    // Si alguna unidad del edificio tiene nombre cargado, lo usa todo el grupo.
    const nombre = ordenadas.find((u) => u.edificio?.trim())?.edificio?.trim();
    const duenos = new Set(ordenadas.map((u) => u.propietarioId ?? u.propietario));

    grupos.push({
      clave,
      titulo: nombre || primera.direccion,
      subtitulo: nombre
        ? primera.direccion
        : duenos.size > 1
        ? plural(duenos.size, "propietario", "propietarios")
        : primera.propietario || null,
      href: null,
      unidades: ordenadas,
      ...resumir(ordenadas),
    });
  }

  // Los grupos se ordenan con el mismo criterio que las unidades: por plata
  // cuando se ordena por plata, alfabético en el resto de los casos.
  const alfabetico = (a: Grupo<T>, b: Grupo<T>) => comparador.compare(a.titulo, b.titulo);

  if (orden === "precio_desc") return grupos.sort((a, b) => b.renta - a.renta || alfabetico(a, b));
  if (orden === "precio_asc") return grupos.sort((a, b) => a.renta - b.renta || alfabetico(a, b));
  if (orden === "direccion_desc") return grupos.sort((a, b) => -alfabetico(a, b));
  return grupos.sort(alfabetico);
}
