"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { plata } from "@/lib/format";

export type ResumenCliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  enLaCalle: number;
  prestamosVigentes: number;
  tieneVencido: boolean;
};

export default function ListaClientes({ clientes }: { clientes: ResumenCliente[] }) {
  const [busqueda, setBusqueda] = useState("");

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return clientes;
    return clientes.filter((cliente) => cliente.nombre.toLowerCase().includes(texto));
  }, [clientes, busqueda]);

  return (
    <>
      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar cliente..."
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />

      {visibles.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          {clientes.length === 0
            ? "Todavía no cargaste clientes."
            : "Ningún cliente con ese nombre."}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {visibles.map((cliente) => (
            <li key={cliente.id}>
              <Link
                href={`/clientes/${cliente.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 active:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {cliente.nombre}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {cliente.prestamosVigentes === 0
                      ? "Sin préstamos vigentes"
                      : `${cliente.prestamosVigentes} vigente${cliente.prestamosVigentes === 1 ? "" : "s"}`}
                    {cliente.tieneVencido && (
                      <span className="ml-1 font-semibold text-red-600">· vencido</span>
                    )}
                  </p>
                </div>
                {cliente.enLaCalle > 0 && (
                  <span className="tabular shrink-0 text-sm font-bold text-slate-900">
                    {plata(cliente.enLaCalle)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
