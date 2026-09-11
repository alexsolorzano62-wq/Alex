import Link from "next/link";
import Encabezado from "@/components/Encabezado";
import FormularioPlantillas from "@/components/FormularioPlantillas";
import { traerPlantillas } from "@/lib/datos";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mensajes de WhatsApp" };

export default async function AjustesPage() {
  const plantillas = await traerPlantillas();

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
          datos de cada cliente cuando mandás el mensaje. Si una etiqueta no aplica
          (las cuotas en un préstamo con interés mensual, por ejemplo), su renglón
          desaparece solo.
        </p>

        <FormularioPlantillas plantillas={plantillas} />

        <section className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="text-sm font-bold text-slate-900">Bajar una copia</h2>
          <p className="mb-3 mt-1 text-xs text-slate-500">
            Se abren en Excel. La base también se respalda sola todas las noches.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { que: "prestamos", texto: "Préstamos" },
              { que: "cobros", texto: "Cobros" },
              { que: "clientes", texto: "Clientes" },
            ].map((archivo) => (
              <a
                key={archivo.que}
                href={`/exportar?que=${archivo.que}`}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-center text-sm font-medium text-slate-700 active:bg-slate-100"
              >
                {archivo.texto}
              </a>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
