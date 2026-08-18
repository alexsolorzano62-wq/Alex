import Link from "next/link";
import Encabezado from "@/components/Encabezado";
import FormularioPlantillas from "@/components/FormularioPlantillas";
import { traerAjustes } from "@/lib/datos";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mensajes de WhatsApp" };

export default async function AjustesPage() {
  const ajustes = await traerAjustes();

  return (
    <>
      <Encabezado subtitulo="Ajustes" />

      <main className="mx-auto max-w-lg px-4 pb-16 pt-4">
        <Link href="/" className="text-sm text-slate-500">
          ← Volver
        </Link>
        <h1 className="mt-2 text-lg font-bold">Mensajes de WhatsApp</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">
          Escribilos a tu manera. Lo que está entre llaves se reemplaza solo por los
          datos de cada cliente cuando mandás el mensaje.
        </p>

        <FormularioPlantillas ajustes={ajustes} />
      </main>
    </>
  );
}
