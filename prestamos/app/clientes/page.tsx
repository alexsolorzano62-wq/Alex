import Link from "next/link";
import Encabezado from "@/components/Encabezado";
import NavInferior from "@/components/NavInferior";
import ListaClientes, { type ResumenCliente } from "@/components/ListaClientes";
import { traerClientes, traerPrestamos } from "@/lib/datos";
import { resolver } from "@/lib/agregados";
import { hoyISO } from "@/lib/fechas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clientes" };

export default async function ClientesPage() {
  const [clientes, prestamos] = await Promise.all([traerClientes(), traerPrestamos()]);
  const resueltos = resolver(prestamos, hoyISO());

  const filas: ResumenCliente[] = clientes.map((cliente) => {
    const suyos = resueltos.filter(
      ({ prestamo }) =>
        prestamo.cliente_id === cliente.id && prestamo.estado === "vigente"
    );

    return {
      id: cliente.id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      enLaCalle: suyos.reduce((acc, { datos }) => acc + datos.capital, 0),
      prestamosVigentes: suyos.length,
      tieneVencido: suyos.some(({ datos }) => datos.vencido),
    };
  });

  return (
    <>
      <Encabezado subtitulo="Clientes" />

      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">Clientes</h1>
          <Link
            href="/clientes/nuevo"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white active:bg-brand-700"
          >
            + Nuevo
          </Link>
        </div>

        <ListaClientes clientes={filas} />
      </main>

      <NavInferior />
    </>
  );
}
