"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import EstadoBadge from "@/components/EstadoBadge";
import FilaPrestamo from "@/components/FilaPrestamo";
import { formatFecha, formatFechaCorta } from "@/lib/fechas";
import { plata, porcentaje } from "@/lib/format";
import { tasaImplicita } from "@/lib/calc";
import type { PrestamoResuelto } from "@/lib/agregados";

type Filtro = "vigentes" | "vencidos" | "cerrados" | "todos";

const FILTROS: { valor: Filtro; texto: string }[] = [
  { valor: "vigentes", texto: "Vigentes" },
  { valor: "vencidos", texto: "Vencidos" },
  { valor: "cerrados", texto: "Cerrados" },
  { valor: "todos", texto: "Todos" },
];

export default function ListaPrestamos({ items }: { items: PrestamoResuelto[] }) {
  const [filtro, setFiltro] = useState<Filtro>("vigentes");
  const [busqueda, setBusqueda] = useState("");

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return items.filter(({ prestamo, datos }) => {
      const pasaFiltro =
        filtro === "todos"
          ? true
          : filtro === "vigentes"
            ? prestamo.estado === "vigente"
            : filtro === "vencidos"
              ? prestamo.estado === "vigente" && datos.vencido
              : prestamo.estado !== "vigente";

      if (!pasaFiltro) return false;
      if (!texto) return true;

      return (
        (prestamo.cliente?.nombre ?? "").toLowerCase().includes(texto) ||
        (prestamo.observacion ?? "").toLowerCase().includes(texto)
      );
    });
  }, [items, filtro, busqueda]);

  const sumas = visibles.reduce(
    (acc, { datos }) => ({
      capital: acc.capital + datos.capital,
      aDevolver: acc.aDevolver + datos.aDevolver,
      interes: acc.interes + datos.interes,
    }),
    { capital: 0, aDevolver: 0, interes: 0 }
  );

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTROS.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            onClick={() => setFiltro(opcion.valor)}
            aria-pressed={filtro === opcion.valor}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${
              filtro === opcion.valor
                ? "bg-brand-600 text-white"
                : "border border-slate-300 bg-white text-slate-600"
            }`}
          >
            {opcion.texto}
          </button>
        ))}
      </div>

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por cliente..."
        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />

      {visibles.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          No hay préstamos para mostrar.
        </p>
      ) : (
        <>
          {/* En el celular, una tarjeta por préstamo. */}
          <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white md:hidden">
            {visibles.map((item) => (
              <FilaPrestamo key={item.prestamo.id} {...item} />
            ))}
          </div>

          {/* En pantalla grande, la planilla de siempre. */}
          <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-semibold">Nombre</th>
                  <th className="px-3 py-2 text-right font-semibold">Monto</th>
                  <th className="px-3 py-2 font-semibold">Inicio</th>
                  <th className="px-3 py-2 text-right font-semibold">Tasa</th>
                  <th className="px-3 py-2 text-right font-semibold">A devolver</th>
                  <th className="px-3 py-2 text-right font-semibold">Solo interés</th>
                  <th className="px-3 py-2 font-semibold">Vence</th>
                  <th className="px-3 py-2 font-semibold">Observación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.map(({ prestamo, datos }) => {
                  const tasa =
                    prestamo.modalidad === "cuotas" && prestamo.total_a_devolver
                      ? tasaImplicita(prestamo.capital_inicial, prestamo.total_a_devolver)
                      : prestamo.tasa_mensual;

                  return (
                    <tr key={prestamo.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <Link
                          href={`/prestamos/${prestamo.id}`}
                          className="font-medium text-slate-900 hover:text-brand-600"
                        >
                          {prestamo.cliente?.nombre}
                        </Link>
                        <EstadoBadge estado={datos.estadoVisual} className="ml-2" />
                      </td>
                      <td className="tabular px-3 py-2 text-right">
                        {plata(datos.capital)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {formatFechaCorta(prestamo.fecha_inicio)}
                      </td>
                      <td className="tabular px-3 py-2 text-right">
                        {porcentaje(tasa)}
                      </td>
                      <td className="tabular px-3 py-2 text-right font-semibold">
                        {plata(datos.aDevolver)}
                      </td>
                      <td className="tabular px-3 py-2 text-right text-slate-600">
                        {plata(datos.interes)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {formatFecha(prestamo.fecha_vencimiento)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {prestamo.modalidad === "cuotas"
                          ? `${datos.cuotasTotal} cuotas de ${plata(datos.cuotaMonto ?? 0)}`
                          : (prestamo.observacion ?? "")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                  <td className="px-3 py-2">Totales</td>
                  <td className="tabular px-3 py-2 text-right">{plata(sumas.capital)}</td>
                  <td />
                  <td />
                  <td className="tabular px-3 py-2 text-right">
                    {plata(sumas.aDevolver)}
                  </td>
                  <td className="tabular px-3 py-2 text-right">{plata(sumas.interes)}</td>
                  <td />
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* En el celular los totales van aparte, porque no hay tabla. */}
          <dl className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-3 md:hidden">
            <div>
              <dt className="text-[11px] uppercase text-slate-500">Capital</dt>
              <dd className="tabular text-sm font-bold">{plata(sumas.capital)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-500">A cobrar</dt>
              <dd className="tabular text-sm font-bold">{plata(sumas.aDevolver)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-500">Interés</dt>
              <dd className="tabular text-sm font-bold">{plata(sumas.interes)}</dd>
            </div>
          </dl>
        </>
      )}
    </>
  );
}
