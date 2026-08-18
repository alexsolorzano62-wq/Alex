import Link from "next/link";
import Encabezado from "@/components/Encabezado";
import NavInferior from "@/components/NavInferior";
import Simulador from "@/components/Simulador";

export const metadata = { title: "Simulador" };

export default function SimuladorPage() {
  return (
    <>
      <Encabezado subtitulo="Simulador" />

      <main className="mx-auto max-w-lg px-4 pb-28 pt-4">
        <Link href="/" className="text-sm text-slate-500">
          ← Volver
        </Link>
        <h1 className="mt-2 text-lg font-bold">Simulador de préstamos</h1>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          Poné el monto y mirá cuánto paga en cada plan, sin guardar nada. Si cierran,
          lo convertís en préstamo de un toque.
        </p>

        <Simulador />
      </main>

      <NavInferior />
    </>
  );
}
