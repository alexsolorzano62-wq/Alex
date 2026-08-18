import Link from "next/link";
import Encabezado from "@/components/Encabezado";
import NavInferior from "@/components/NavInferior";
import ListaPrestamos from "@/components/ListaPrestamos";
import { traerPrestamos } from "@/lib/datos";
import { resolver } from "@/lib/agregados";
import { hoyISO } from "@/lib/fechas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Préstamos" };

export default async function PrestamosPage() {
  const prestamos = await traerPrestamos();
  const items = resolver(prestamos, hoyISO());

  return (
    <>
      <Encabezado subtitulo="Todos los préstamos" />

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">Préstamos</h1>
          <Link
            href="/prestamos/nuevo"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white active:bg-brand-700"
          >
            + Nuevo
          </Link>
        </div>

        <ListaPrestamos items={items} />
      </main>

      <NavInferior />
    </>
  );
}
