import Link from "next/link";
import Encabezado from "@/components/Encabezado";
import FormularioApariencia from "@/components/FormularioApariencia";
import FormularioPlantillas from "@/components/FormularioPlantillas";
import RevisionVencimientos from "@/components/RevisionVencimientos";
import { traerApariencia, traerPlantillas, traerPrestamos } from "@/lib/datos";
import { revisarVencimientos } from "@/lib/revision";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const [plantillas, apariencia, prestamos] = await Promise.all([
    traerPlantillas(),
    traerApariencia(),
    traerPrestamos(),
  ]);

  const desfases = revisarVencimientos(prestamos);

  return (
    <>
      <Encabezado subtitulo="Ajustes" />

      <main className="mx-auto max-w-lg px-4 pb-16 pt-4">
        <Link href="/" className="text-sm text-slate-600 dark:text-slate-400">
          ← Volver
        </Link>
        <h1 className="mt-2 text-lg font-bold">Ajustes</h1>

        <section className="mb-10 mt-6">
          <FormularioApariencia tema={apariencia.tema} fuente={apariencia.fuente} />
        </section>

        <section className="mb-10 border-t border-slate-200 dark:border-slate-800 pt-6">
          <h2 className="text-lg font-bold">
            Revisión de vencimientos
            {desfases.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 align-middle text-xs font-semibold text-amber-900 dark:text-amber-200">
                {desfases.length} para revisar
              </span>
            )}
          </h2>
          <p className="mb-3 mt-1 text-sm text-slate-600 dark:text-slate-400">
            Recalcula desde cero qué día tendría que vencer cada préstamo según los
            cobros que tiene registrados, y lo compara con la fecha guardada. Sirve
            para encontrar los que quedaron corridos cuando borrar un cobro todavía
            no devolvía el vencimiento a su lugar.
          </p>
          <RevisionVencimientos desfases={desfases} />
        </section>

        <h2 className="border-t border-slate-200 pt-6 text-lg font-bold dark:border-slate-800">
          Mensajes de WhatsApp
        </h2>
        <p className="mb-6 mt-1 text-sm text-slate-600 dark:text-slate-400">
          Escribilos a tu manera. Lo que está entre llaves se reemplaza solo por los
          datos de cada cliente cuando mandás el mensaje. Si una etiqueta no aplica
          (las cuotas en un préstamo con interés mensual, por ejemplo), su renglón
          desaparece solo.
        </p>

        <FormularioPlantillas plantillas={plantillas} />

        <section className="mt-10 border-t border-slate-200 dark:border-slate-800 pt-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Bajar una copia</h2>
          <p className="mb-3 mt-1 text-xs text-slate-600 dark:text-slate-400">
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
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-center text-sm font-medium text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800"
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
