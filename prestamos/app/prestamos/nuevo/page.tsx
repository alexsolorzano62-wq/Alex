import Link from "next/link";
import Encabezado from "@/components/Encabezado";
import FormularioPrestamo from "@/components/FormularioPrestamo";
import { traerClientes } from "@/lib/datos";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nuevo préstamo" };

export default async function NuevoPrestamoPage() {
  const clientes = await traerClientes();

  return (
    <>
      <Encabezado subtitulo="Nuevo préstamo" />

      <main className="mx-auto max-w-lg px-4 pb-16 pt-4">
        <Link href="/prestamos" className="text-sm text-slate-500">
          ← Volver
        </Link>
        <h1 className="mb-4 mt-2 text-lg font-bold">Nuevo préstamo</h1>

        <FormularioPrestamo clientes={clientes} />
      </main>
    </>
  );
}
