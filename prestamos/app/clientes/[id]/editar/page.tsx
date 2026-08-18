import Link from "next/link";
import { notFound } from "next/navigation";
import Encabezado from "@/components/Encabezado";
import FormularioCliente from "@/components/FormularioCliente";
import { traerCliente } from "@/lib/datos";

export const dynamic = "force-dynamic";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await traerCliente(id);
  if (!cliente) notFound();

  return (
    <>
      <Encabezado subtitulo={cliente.nombre} />

      <main className="mx-auto max-w-lg px-4 pb-16 pt-4">
        <Link href={`/clientes/${cliente.id}`} className="text-sm text-slate-500">
          ← Volver
        </Link>
        <h1 className="mb-4 mt-2 text-lg font-bold">Editar cliente</h1>

        <FormularioCliente cliente={cliente} />
      </main>
    </>
  );
}
