import Encabezado from "@/components/Encabezado";
import NavInferior from "@/components/NavInferior";
import ListaPagos from "@/components/ListaPagos";
import { traerPagos } from "@/lib/datos";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cobros" };

export default async function PagosPage() {
  const pagos = await traerPagos();

  return (
    <>
      <Encabezado subtitulo="Cobros" />

      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">
        <h1 className="mb-3 text-lg font-bold">Cobros</h1>
        <ListaPagos pagos={pagos} />
      </main>

      <NavInferior />
    </>
  );
}
