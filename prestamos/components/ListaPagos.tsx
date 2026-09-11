"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { borrarPago } from "@/app/acciones";
import BotonConfirmar from "@/components/BotonConfirmar";
import { numerarCuotas } from "@/lib/calc";
import { formatFecha, mesDe, nombreMes } from "@/lib/fechas";
import { plata } from "@/lib/format";
import type { PagoConDetalle } from "@/lib/types";

const NOMBRE_TIPO: Record<string, string> = {
  interes: "Interés del mes",
  capital: "Entrega a cuenta",
  cuota: "Cuota",
  total: "Saldó todo",
};

const TODOS = "todos";

export default function ListaPagos({ pagos }: { pagos: PagoConDetalle[] }) {
  // Los meses y los clientes salen de los cobros que existen: no tiene sentido
  // ofrecer un filtro que no va a devolver nada.
  const meses = useMemo(
    () => [...new Set(pagos.map((pago) => mesDe(pago.fecha)))].sort().reverse(),
    [pagos]
  );
  const clientes = useMemo(() => {
    const porId = new Map<string, string>();
    for (const pago of pagos) {
      const cliente = pago.prestamo?.cliente;
      if (cliente) porId.set(cliente.id, cliente.nombre);
    }
    return [...porId.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [pagos]);

  // Los cobros llegan de todos los préstamos juntos, así que se numeran por
  // préstamo: la cuota 3 de uno no tiene nada que ver con la de otro.
  const numeros = useMemo(() => {
    const porPrestamo = new Map<string, typeof pagos>();
    for (const pago of pagos) {
      const id = pago.prestamo?.id ?? pago.prestamo_id;
      porPrestamo.set(id, [...(porPrestamo.get(id) ?? []), pago]);
    }

    const todos = new Map<string, number>();
    for (const delPrestamo of porPrestamo.values()) {
      for (const [id, numero] of numerarCuotas(delPrestamo)) todos.set(id, numero);
    }
    return todos;
  }, [pagos]);

  const [mes, setMes] = useState(meses[0] ?? TODOS);
  const [cliente, setCliente] = useState(TODOS);

  const visibles = useMemo(
    () =>
      pagos.filter((pago) => {
        if (mes !== TODOS && mesDe(pago.fecha) !== mes) return false;
        if (cliente !== TODOS && pago.prestamo?.cliente?.id !== cliente) return false;
        return true;
      }),
    [pagos, mes, cliente]
  );

  const cobrado = visibles.reduce((acc, pago) => acc + pago.monto, 0);
  const ganancia = visibles
    .filter((pago) => pago.tipo === "interes")
    .reduce((acc, pago) => acc + pago.monto, 0);

  if (pagos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 px-4 py-10 text-center text-sm text-slate-600 dark:text-slate-400">
        Todavía no registraste ningún cobro.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Mes</span>
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            {meses.map((valor) => (
              <option key={valor} value={valor}>
                {nombreMes(valor)}
              </option>
            ))}
            <option value={TODOS}>Todos los meses</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Cliente</span>
          <select
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value={TODOS}>Todos</option>
            {clientes.map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
        <div>
          <dt className="text-[11px] uppercase text-slate-600 dark:text-slate-400">Cobros</dt>
          <dd className="tabular text-sm font-bold">{visibles.length}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase text-slate-600 dark:text-slate-400">Entró</dt>
          <dd className="tabular text-sm font-bold">{plata(cobrado)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase text-slate-600 dark:text-slate-400">De interés</dt>
          <dd className="tabular text-sm font-bold text-emerald-700 dark:text-emerald-400">
            {plata(ganancia)}
          </dd>
        </div>
      </dl>

      {visibles.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 px-4 py-10 text-center text-sm text-slate-600 dark:text-slate-400">
          No hay cobros con ese filtro.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {visibles.map((pago) => (
            <li key={pago.id} className="flex items-center gap-2 px-4 py-3">
              <Link
                href={`/prestamos/${pago.prestamo?.id ?? ""}`}
                className="flex min-w-0 flex-1 items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {pago.prestamo?.cliente?.nombre ?? "Cliente borrado"}
                  </p>
                  <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                    {numeros.has(pago.id)
                      ? `Cuota ${numeros.get(pago.id)}${pago.prestamo?.cuotas_total ? ` de ${pago.prestamo.cuotas_total}` : ""}`
                      : (NOMBRE_TIPO[pago.tipo] ?? pago.tipo)}{" "}
                    · {formatFecha(pago.fecha)}
                  </p>
                  {pago.nota && (
                    <p className="truncate text-xs text-slate-600 dark:text-slate-400">{pago.nota}</p>
                  )}
                </div>
                <span className="tabular shrink-0 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {plata(pago.monto)}
                </span>
              </Link>

              <form action={borrarPago} className="shrink-0">
                <input type="hidden" name="id" value={pago.id} />
                <BotonConfirmar
                  pregunta={`¿Borrar ${numeros.has(pago.id) ? `la cuota ${numeros.get(pago.id)}` : "este cobro"} de ${plata(pago.monto)} del ${formatFecha(pago.fecha)}? El préstamo vuelve a como estaba antes.`}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800"
                >
                  Borrar
                </BotonConfirmar>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
