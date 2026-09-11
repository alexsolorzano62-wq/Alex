import Link from "next/link";
import Encabezado from "@/components/Encabezado";
import NavInferior from "@/components/NavInferior";
import Metrica from "@/components/Metrica";
import GraficoEvolucion from "@/components/GraficoEvolucion";
import GraficoMeses from "@/components/GraficoMeses";
import { traerPagos, traerPrestamos } from "@/lib/datos";
import {
  resolver,
  resumenPorMes,
  serieHistorica,
  totales,
  vencimientosDelMes,
} from "@/lib/agregados";
import { hoyISO, mesDe, nombreMes, sumarMeses } from "@/lib/fechas";
import { plata } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resumen" };

export default async function ResumenPage() {
  const [prestamos, pagos] = await Promise.all([traerPrestamos(), traerPagos()]);

  const hoy = hoyISO();
  const resueltos = resolver(prestamos, hoy);
  const numeros = totales(resueltos);
  const meses = resumenPorMes(prestamos, pagos, hoy);
  const historia = serieHistorica(prestamos, pagos, hoy);
  const esteMes = meses[meses.length - 1];
  const proximo = mesDe(sumarMeses(hoy, 1));
  const proyeccion = vencimientosDelMes(resueltos, proximo);

  // Cuánto de todo lo que prestaste ya volvió a tu bolsillo.
  const prestadoTotal = resueltos.reduce(
    (acc, { prestamo }) => acc + prestamo.capital_inicial,
    0
  );
  const cobradoTotal = resueltos.reduce((acc, { datos }) => acc + datos.cobrado, 0);
  const faltaRecuperar = Math.max(0, prestadoTotal - cobradoTotal);

  return (
    <>
      <Encabezado subtitulo="Resumen" />

      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">
        <h1 className="text-lg font-bold">Resumen</h1>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          Cómo viene el negocio mes a mes.
        </p>

        <section className="grid grid-cols-2 gap-3">
          <Metrica
            etiqueta="En la calle"
            monto={numeros.enLaCalle}
            detalle="Capital prestado hoy"
          />
          <Metrica
            etiqueta="Ganancia cobrada"
            monto={numeros.gananciaCobrada}
            detalle="Intereses de todos los tiempos"
          />
        </section>

        <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
          {faltaRecuperar === 0 ? (
            <p className="text-sm font-semibold text-emerald-700">
              <span aria-hidden="true">✓</span> Recuperaste todo lo que prestaste
              <span className="block text-xs font-normal text-slate-500">
                Cobraste {plata(cobradoTotal)} sobre {plata(prestadoTotal)} prestados.
                Lo que entre de acá en más es ganancia.
              </span>
            </p>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-slate-700">
                  Recuperado de lo prestado
                </p>
                <p className="tabular text-lg font-bold text-brand-700">
                  {Math.round((cobradoTotal / Math.max(1, prestadoTotal)) * 100)}%
                </p>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{
                    width: `${Math.min(100, Math.max(1.5, (cobradoTotal / Math.max(1, prestadoTotal)) * 100))}%`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Cobraste {plata(cobradoTotal)} de {plata(prestadoTotal)}. Faltan{" "}
                {plata(faltaRecuperar)} para estar a mano.
              </p>
            </>
          )}
        </section>

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-slate-900">Cómo viene</h2>
          <GraficoEvolucion puntos={historia} />
        </section>

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-slate-900">El detalle de cada mes</h2>
          <GraficoMeses meses={meses} />
        </section>

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-slate-900">
            {nombreMes(esteMes.mes)}
            <span className="ml-2 font-normal text-slate-500">el mes en curso</span>
          </h2>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm">
            <li className="flex items-baseline justify-between gap-3 px-4 py-2.5">
              <span className="text-slate-600">
                Prestaste
                <span className="ml-1 text-xs text-slate-400">
                  {esteMes.prestamosNuevos} préstamo
                  {esteMes.prestamosNuevos === 1 ? "" : "s"}
                </span>
              </span>
              <span className="tabular font-semibold">{plata(esteMes.prestado)}</span>
            </li>
            <li className="flex items-baseline justify-between gap-3 px-4 py-2.5">
              <span className="text-slate-600">Entró en total</span>
              <span className="tabular font-semibold">{plata(esteMes.cobrado)}</span>
            </li>
            <li className="flex items-baseline justify-between gap-3 px-4 py-2.5">
              <span className="text-slate-600">Ganaste de interés</span>
              <span className="tabular font-semibold text-emerald-700">
                {plata(esteMes.ganancia)}
              </span>
            </li>
            <li className="flex items-baseline justify-between gap-3 px-4 py-2.5">
              <span className="text-slate-600">
                Se renovaron
                <span className="ml-1 text-xs text-slate-400">
                  {esteMes.renovaciones} préstamo
                  {esteMes.renovaciones === 1 ? "" : "s"}
                </span>
              </span>
              <span className="tabular font-semibold">
                {plata(esteMes.montoRenovado)}
              </span>
            </li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-slate-900">
            {nombreMes(proximo)}
            <span className="ml-2 font-normal text-slate-500">lo que viene</span>
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="tabular text-xl font-bold text-slate-900">
              {plata(proyeccion.monto)}
            </p>
            <p className="mt-0.5 text-sm text-slate-600">
              {proyeccion.cuotas} vencimiento{proyeccion.cuotas === 1 ? "" : "s"} el mes
              que viene
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Es lo que vence en {nombreMes(proximo)} si todos pagan al día. No incluye
              lo que ya está atrasado.
            </p>
          </div>
        </section>

        <Link
          href="/"
          className="mt-6 block rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700"
        >
          Volver al inicio
        </Link>
      </main>

      <NavInferior />
    </>
  );
}
