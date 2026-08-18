import Link from "next/link";
import Encabezado from "@/components/Encabezado";
import NavInferior from "@/components/NavInferior";
import Metrica from "@/components/Metrica";
import BarrasPorCliente from "@/components/BarrasPorCliente";
import FilaPrestamo from "@/components/FilaPrestamo";
import { traerPrestamos, usuarioActual } from "@/lib/datos";
import {
  capitalPorCliente,
  proximosVencimientos,
  resolver,
  totales,
} from "@/lib/agregados";
import { hoyISO } from "@/lib/fechas";
import { formatFecha } from "@/lib/fechas";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [usuario, prestamos] = await Promise.all([usuarioActual(), traerPrestamos()]);

  const hoy = hoyISO();
  const resueltos = resolver(prestamos, hoy);
  const numeros = totales(resueltos);
  const proximos = proximosVencimientos(resueltos);
  const porCliente = capitalPorCliente(resueltos);

  const alertas = proximos.filter(
    ({ datos }) => datos.estadoVisual === "vencido" || datos.estadoVisual === "por_vencer"
  );
  // Los que ya aparecen arriba no se repiten en la lista de próximos.
  const siguientes = proximos.filter(({ datos }) => datos.estadoVisual === "al_dia");

  return (
    <>
      <Encabezado subtitulo={usuario?.email ?? undefined} />

      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">
        <p className="text-xs text-slate-400">Al {formatFecha(hoy)}</p>

        <section className="mt-3 grid grid-cols-2 gap-3">
          <Metrica
            etiqueta="En la calle"
            monto={numeros.enLaCalle}
            detalle={`${numeros.vigentes} préstamo${numeros.vigentes === 1 ? "" : "s"} vigente${numeros.vigentes === 1 ? "" : "s"}`}
          />
          <Metrica
            etiqueta="A cobrar"
            monto={numeros.aCobrar}
            detalle="Capital más interés"
          />
          <Metrica
            etiqueta="Interés pendiente"
            monto={numeros.interesPendiente}
            detalle="Todavía sin cobrar"
          />
          <Metrica
            etiqueta="Ganancia cobrada"
            monto={numeros.gananciaCobrada}
            detalle="Intereses ya en tu bolsillo"
          />
        </section>

        {alertas.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-sm font-bold text-slate-900">
              Necesitan atención
              <span className="ml-2 font-normal text-slate-500">
                {numeros.vencidos} vencido{numeros.vencidos === 1 ? "" : "s"} ·{" "}
                {numeros.porVencer} por vencer
              </span>
            </h2>
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {alertas.map((item) => (
                <FilaPrestamo key={item.prestamo.id} {...item} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-6">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-bold text-slate-900">Próximos vencimientos</h2>
            <Link href="/prestamos" className="text-xs font-medium text-brand-600">
              Ver todos
            </Link>
          </div>
          {siguientes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
              {proximos.length === 0
                ? "No tenés préstamos vigentes."
                : "Todo lo que vence pronto ya está arriba."}
            </p>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {siguientes.slice(0, 5).map((item) => (
                <FilaPrestamo key={item.prestamo.id} {...item} />
              ))}
            </div>
          )}
        </section>

        {porCliente.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-bold text-slate-900">
              Capital por cliente
            </h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <BarrasPorCliente filas={porCliente} />
            </div>
          </section>
        )}

        <section className="mt-6 space-y-3">
          <Link
            href="/simulador"
            className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 active:bg-brand-100"
          >
            <span>
              <span className="block text-sm font-semibold text-brand-800">
                Simular un préstamo
              </span>
              <span className="block text-xs text-brand-700">
                Cuánto paga por semana, sin guardar nada
              </span>
            </span>
            <span aria-hidden="true" className="text-brand-600">
              →
            </span>
          </Link>

          <div className="grid grid-cols-2 gap-3">
          <Link
            href="/prestamos/nuevo"
            className="rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white active:bg-brand-700"
          >
            Nuevo préstamo
          </Link>
          <Link
            href="/clientes/nuevo"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 active:bg-slate-100"
          >
            Nuevo cliente
          </Link>
          </div>
        </section>
      </main>

      <NavInferior />
    </>
  );
}
