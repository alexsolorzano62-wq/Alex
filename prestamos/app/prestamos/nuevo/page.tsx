import Link from "next/link";
import Encabezado from "@/components/Encabezado";
import FormularioPrestamo from "@/components/FormularioPrestamo";
import { traerClientes } from "@/lib/datos";
import type { Modalidad } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nuevo préstamo" };

const MODALIDADES: Modalidad[] = ["mensual", "cuotas", "semanal"];

export default async function NuevoPrestamoPage({
  searchParams,
}: {
  searchParams: Promise<{ capital?: string; modalidad?: string; semanas?: string }>;
}) {
  const [clientes, parametros] = await Promise.all([traerClientes(), searchParams]);

  // El simulador manda el plan ya elegido; solo se acepta lo que existe.
  const modalidad = MODALIDADES.find((valor) => valor === parametros.modalidad);

  return (
    <>
      <Encabezado subtitulo="Nuevo préstamo" />

      <main className="mx-auto max-w-lg px-4 pb-16 pt-4">
        <Link href="/prestamos" className="text-sm text-slate-500">
          ← Volver
        </Link>
        <h1 className="mb-4 mt-2 text-lg font-bold">Nuevo préstamo</h1>

        <FormularioPrestamo
          clientes={clientes}
          inicial={{
            capital: parametros.capital,
            modalidad,
            semanas: parametros.semanas,
          }}
        />
      </main>
    </>
  );
}
