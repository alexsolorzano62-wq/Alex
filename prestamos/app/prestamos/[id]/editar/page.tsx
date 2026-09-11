import Link from "next/link";
import { notFound } from "next/navigation";
import Encabezado from "@/components/Encabezado";
import FormularioEditarPrestamo from "@/components/FormularioEditarPrestamo";
import { traerPrestamo } from "@/lib/datos";

export const dynamic = "force-dynamic";

export default async function EditarPrestamoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prestamo = await traerPrestamo(id);
  if (!prestamo) notFound();

  return (
    <>
      <Encabezado subtitulo={prestamo.cliente?.nombre ?? "Préstamo"} />

      <main className="mx-auto max-w-lg px-4 pb-16 pt-4">
        <Link href={`/prestamos/${prestamo.id}`} className="text-sm text-slate-500">
          ← Volver
        </Link>
        <h1 className="mb-4 mt-2 text-lg font-bold">Corregir préstamo</h1>

        <FormularioEditarPrestamo prestamo={prestamo} />
      </main>
    </>
  );
}
