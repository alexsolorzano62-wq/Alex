import Link from "next/link";
import { notFound } from "next/navigation";
import Encabezado from "@/components/Encabezado";
import FilaPrestamo from "@/components/FilaPrestamo";
import BotonesWhatsApp from "@/components/BotonesWhatsApp";
import BotonConfirmar from "@/components/BotonConfirmar";
import { borrarCliente } from "@/app/acciones";
import { traerCliente, traerPlantillas, traerPrestamosDeCliente } from "@/lib/datos";
import { resolver } from "@/lib/agregados";
import { hoyISO, formatFecha } from "@/lib/fechas";
import { plata } from "@/lib/format";
import { linkWhatsApp, mensajeDe } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cliente, prestamos, plantillas] = await Promise.all([
    traerCliente(id),
    traerPrestamosDeCliente(id),
    traerPlantillas(),
  ]);
  if (!cliente) notFound();

  const hoy = hoyISO();
  const resueltos = resolver(prestamos, hoy);
  const vigentes = resueltos.filter(({ prestamo }) => prestamo.estado === "vigente");

  const enLaCalle = vigentes.reduce((acc, { datos }) => acc + datos.capital, 0);
  const aCobrar = vigentes.reduce((acc, { datos }) => acc + datos.aDevolver, 0);
  const gananciaCobrada = resueltos.reduce((acc, { datos }) => acc + datos.ganancia, 0);

  // Con un solo préstamo vigente se puede mandar su estado de cuenta directo.
  const unico = vigentes.length === 1 ? vigentes[0] : null;
  const mensaje = unico
    ? mensajeDe("estado_cuenta", unico.prestamo, unico.datos, cliente.nombre, hoy, {
        plantillas,
      })
    : null;

  return (
    <>
      <Encabezado subtitulo={cliente.nombre} />

      <main className="mx-auto max-w-lg px-4 pb-16 pt-4">
        <Link href="/clientes" className="text-sm text-slate-500">
          ← Volver
        </Link>

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">{cliente.nombre}</h1>
            {cliente.telefono && (
              <p className="text-sm text-slate-500">{cliente.telefono}</p>
            )}
            <p className="text-xs text-slate-400">
              Cliente desde {formatFecha(cliente.created_at.slice(0, 10))}
            </p>
          </div>
          <Link
            href={`/clientes/${cliente.id}/editar`}
            className="shrink-0 rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600"
          >
            Editar
          </Link>
        </div>

        {cliente.notas && (
          <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
            {cliente.notas}
          </p>
        )}

        <dl className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-3">
          <div>
            <dt className="text-[11px] uppercase text-slate-500">En la calle</dt>
            <dd className="tabular text-sm font-bold">{plata(enLaCalle)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase text-slate-500">A cobrar</dt>
            <dd className="tabular text-sm font-bold">{plata(aCobrar)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase text-slate-500">Te dejó</dt>
            <dd className="tabular text-sm font-bold">{plata(gananciaCobrada)}</dd>
          </div>
        </dl>

        {mensaje && (
          <section className="mt-5">
            <h2 className="mb-2 text-sm font-bold text-slate-900">Estado de cuenta</h2>
            <BotonesWhatsApp
              mensaje={mensaje}
              link={linkWhatsApp(cliente.telefono, mensaje)}
              etiqueta={cliente.telefono ? "Enviar por WhatsApp" : "Elegir contacto"}
            />
          </section>
        )}

        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Préstamos</h2>
            <Link
              href="/prestamos/nuevo"
              className="text-xs font-medium text-brand-600"
            >
              + Nuevo préstamo
            </Link>
          </div>
          {resueltos.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
              Este cliente todavía no tiene préstamos.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {resueltos.map((item) => (
                <FilaPrestamo key={item.prestamo.id} {...item} />
              ))}
            </div>
          )}
        </section>

        <form action={borrarCliente} className="mt-8">
          <input type="hidden" name="id" value={cliente.id} />
          <BotonConfirmar
            pregunta={`¿Borrar a ${cliente.nombre}? Se borran también sus ${resueltos.length} préstamo(s) y todos los pagos. No se puede deshacer.`}
            className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 active:bg-red-50"
          >
            Borrar cliente
          </BotonConfirmar>
          <p className="mt-1 text-center text-xs text-slate-400">
            Se borran también sus préstamos y pagos.
          </p>
        </form>
      </main>
    </>
  );
}
