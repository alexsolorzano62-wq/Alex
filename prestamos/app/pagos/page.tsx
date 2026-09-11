import Encabezado from "@/components/Encabezado";
import NavInferior from "@/components/NavInferior";
import ListaPagos from "@/components/ListaPagos";
import { traerPagos, traerPrestamos } from "@/lib/datos";
import { gananciaPorCobro } from "@/lib/agregados";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cobros" };

export default async function PagosPage() {
  const [pagos, prestamos] = await Promise.all([traerPagos(), traerPrestamos()]);

  // Cuánto de cada cobro fue ganancia no se puede leer del cobro suelto: en un
  // plan cada cuota trae capital e interés mezclados. Se calcula por préstamo.
  const ganancias = [...gananciaPorCobro(prestamos)];

  return (
    <>
      <Encabezado subtitulo="Cobros" />

      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">
        <h1 className="mb-3 text-lg font-bold">Cobros</h1>
        <ListaPagos pagos={pagos} ganancias={ganancias} />
      </main>

      <NavInferior />
    </>
  );
}
