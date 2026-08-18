import Link from "next/link";
import Encabezado from "@/components/Encabezado";
import FormularioCliente from "@/components/FormularioCliente";

export const metadata = { title: "Nuevo cliente" };

export default function NuevoClientePage() {
  return (
    <>
      <Encabezado subtitulo="Nuevo cliente" />

      <main className="mx-auto max-w-lg px-4 pb-16 pt-4">
        <Link href="/clientes" className="text-sm text-slate-500">
          ← Volver
        </Link>
        <h1 className="mb-4 mt-2 text-lg font-bold">Nuevo cliente</h1>

        <FormularioCliente />
      </main>
    </>
  );
}
