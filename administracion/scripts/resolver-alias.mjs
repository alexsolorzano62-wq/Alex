// Traduce los imports "@/..." del proyecto a rutas reales, para poder correr
// los calculos con node suelto (sin levantar Next).
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function resolve(especificador, contexto, siguiente) {
  if (especificador.startsWith("@/")) {
    const base = path.join(raiz, especificador.slice(2));
    const candidatos = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")];
    const encontrado = candidatos.find((ruta) => existsSync(ruta));
    if (encontrado) {
      return siguiente(pathToFileURL(encontrado).href, contexto);
    }
  }
  return siguiente(especificador, contexto);
}
