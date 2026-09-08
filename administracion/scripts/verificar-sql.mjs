// Chequea que toda la SQL del proyecto parsee contra el parser de PostgreSQL
// de verdad — el mismo que usa el servidor. No prueba que las columnas existan
// ni que los tipos cierren, pero sí que nada de lo que le vas a pegar a la
// consola de Supabase se rompa por una coma.
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const pg = require("libpg-query");

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migraciones = path.join(raiz, "supabase", "migrations");

const archivos = [
  ...(await readdir(migraciones)).sort().map((n) => path.join(migraciones, n)),
  path.join(raiz, "supabase", "semilla.sql"),
  path.join(raiz, "supabase", "carga-inicial.sql"),
  path.join(raiz, "supabase", "migraciones-0007-0009.sql"),
  path.join(raiz, "supabase", "migracion-0010.sql"),
];

let fallos = 0;

for (const archivo of archivos) {
  const nombre = path.basename(archivo);
  try {
    const arbol = await pg.parse(await readFile(archivo, "utf8"));
    console.log(`OK   ${nombre}: ${arbol.stmts?.length ?? 0} sentencias`);
  } catch (error) {
    fallos++;
    console.log(`FALLA ${nombre}: ${error instanceof Error ? error.message : error}`);
  }
}

console.log(fallos === 0 ? "\nSQL OK." : `\n${fallos} archivos de SQL con errores.`);
process.exit(fallos === 0 ? 0 : 1);
