"use client";

import { useMemo, useState } from "react";
import { formatearMoneda } from "@/lib/dinero";
import { calcularPunitorios } from "@/lib/punitorios";
import { parsearMonto } from "@/lib/parseo";
import { formatearFecha, nombreDelPeriodo } from "@/lib/fechas";
import { etiqueta, TIPOS_CONCEPTO, type TipoPunitorio } from "@/lib/types";

type GastoPendiente = {
  id: string;
  descripcion: string;
  monto: number;
  tipo: string;
  fecha: string;
};

type Extra = { id: number; tipo: string; descripcion: string; monto: string };

type CargoFijo = { id: string; tipo: string; descripcion: string; monto: number };

export function FormularioCobro({
  accion, contrato, periodo, vencimiento, gastosPendientes, cargosFijos, saldoAnterior, hoy,
}: {
  accion: (formData: FormData) => Promise<void>;
  contrato: {
    id: string;
    monto_actual: number;
    moneda: "ARS" | "USD";
    punitorio_tipo: TipoPunitorio;
    punitorio_valor: number;
    punitorio_dias_gracia: number;
    inquilino: string;
    direccion: string;
  };
  periodo: string;
  vencimiento: string;
  gastosPendientes: GastoPendiente[];
  // Lo que esta unidad paga todos los meses además del alquiler.
  cargosFijos: CargoFijo[];
  // Lo que quedó del mes pasado. Positivo: a favor. Negativo: debe.
  saldoAnterior: number;
  hoy: string;
}) {
  const [fechaPago, setFechaPago] = useState(hoy);
  const [alquiler, setAlquiler] = useState(String(contrato.monto_actual));
  const [gastosElegidos, setGastosElegidos] = useState<string[]>([]);
  // Vienen tildados: si esta unidad paga el agua todos los meses, este mes
  // también. Destildar es la excepción, y por eso es lo que cuesta un clic.
  const [cargosElegidos, setCargosElegidos] = useState<string[]>(cargosFijos.map((c) => c.id));
  const [pagado, setPagado] = useState("");
  const [extras, setExtras] = useState<Extra[]>([]);
  const [proximoId, setProximoId] = useState(1);

  // Los punitorios se recalculan solos cuando cambiás la fecha de pago: es el
  // dato del que dependen, y hacerlo a mano es donde se cometen los errores.
  const punitorios = useMemo(
    () =>
      calcularPunitorios({
        montoAlquiler: parsearMonto(alquiler) ?? 0,
        vencimiento,
        fechaPago,
        tipo: contrato.punitorio_tipo,
        valor: Number(contrato.punitorio_valor),
        diasGracia: Number(contrato.punitorio_dias_gracia),
      }),
    [alquiler, fechaPago, vencimiento, contrato]
  );

  const gastosSeleccionados = gastosPendientes.filter((g) => gastosElegidos.includes(g.id));
  const cargosSeleccionados = cargosFijos.filter((c) => cargosElegidos.includes(c.id));

  // El saldo entra con el signo dado vuelta: lo que quedó a favor descuenta,
  // lo que quedó debiendo suma.
  const renglonSaldo = -saldoAnterior;

  const total =
    (parsearMonto(alquiler) ?? 0) +
    punitorios.monto +
    cargosSeleccionados.reduce((s, c) => s + Number(c.monto), 0) +
    gastosSeleccionados.reduce((s, g) => s + Number(g.monto), 0) +
    extras.reduce((s, e) => s + (parsearMonto(e.monto) ?? 0), 0) +
    renglonSaldo;

  // Si no se aclara cuánto entregó, se asume que pagó todo.
  const entregado = parsearMonto(pagado) ?? total;
  const saldoResultante = entregado - total;

  return (
    <form action={accion} className="space-y-6">
      <input type="hidden" name="contrato_id" value={contrato.id} />
      <input type="hidden" name="periodo" value={periodo} />

      <section className="tarjeta">
        <div className="font-titulo text-lg font-bold">{contrato.direccion}</div>
        <div className="text-sm text-stone-500">
          {contrato.inquilino} · alquiler de{" "}
          <span className="capitalize">{nombreDelPeriodo(periodo)}</span> · vencía el{" "}
          {formatearFecha(vencimiento)}
        </div>
      </section>

      <section className="tarjeta space-y-4">
        <h2 className="font-titulo text-lg font-bold">El pago</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="fecha_pago">Fecha de pago</label>
            <input
              id="fecha_pago"
              name="fecha_pago"
              type="date"
              className="campo"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="etiqueta" htmlFor="medio_pago">Cómo pagó</label>
            <select id="medio_pago" name="medio_pago" className="campo" defaultValue="transferencia">
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="deposito">Depósito</option>
              <option value="cheque">Cheque</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>
      </section>

      <section className="tarjeta space-y-4">
        <h2 className="font-titulo text-lg font-bold">Conceptos del recibo</h2>

        <div className="flex items-end gap-3">
          <input type="hidden" name="concepto_tipo" value="alquiler" />
          <input type="hidden" name="concepto_descripcion" value={`Alquiler ${nombreDelPeriodo(periodo)}`} />
          <div className="flex-1">
            <label className="etiqueta" htmlFor="alquiler">Alquiler</label>
            <input
              id="alquiler"
              name="concepto_monto"
              className="campo tabular text-right"
              value={alquiler}
              onChange={(e) => setAlquiler(e.target.value)}
              inputMode="decimal"
              required
            />
          </div>
        </div>

        {cargosFijos.length > 0 && (
          <div>
            <div className="etiqueta">Cobros fijos de esta unidad</div>
            <ul className="space-y-2">
              {cargosFijos.map((c) => {
                const elegido = cargosElegidos.includes(c.id);
                return (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 p-2.5 hover:bg-stone-50">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-marca-600"
                        checked={elegido}
                        onChange={(e) =>
                          setCargosElegidos((previos) =>
                            e.target.checked
                              ? [...previos, c.id]
                              : previos.filter((id) => id !== c.id)
                          )
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{c.descripcion}</span>
                        <span className="text-xs text-stone-500">{etiqueta(c.tipo)} · todos los meses</span>
                      </span>
                      <span className="tabular shrink-0 text-sm font-semibold">
                        {formatearMoneda(Number(c.monto), contrato.moneda)}
                      </span>
                      {elegido && (
                        <>
                          <input type="hidden" name="concepto_tipo" value={c.tipo} />
                          <input type="hidden" name="concepto_descripcion" value={c.descripcion} />
                          <input type="hidden" name="concepto_monto" value={c.monto} />
                        </>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {saldoAnterior !== 0 && (
          <div
            className={`rounded-lg border p-3 ${
              saldoAnterior > 0
                ? "border-marca-200 bg-marca-50"
                : "border-orange-200 bg-orange-50"
            }`}
          >
            <input type="hidden" name="concepto_tipo" value="saldo_anterior" />
            <input
              type="hidden"
              name="concepto_descripcion"
              value={saldoAnterior > 0 ? "Saldo a favor del mes anterior" : "Deuda del mes anterior"}
            />
            <input type="hidden" name="concepto_monto" value={renglonSaldo} />
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className={saldoAnterior > 0 ? "text-marca-800" : "text-orange-900"}>
                {saldoAnterior > 0 ? "Saldo a favor del mes anterior" : "Deuda del mes anterior"}
              </span>
              <span className={`tabular font-semibold ${saldoAnterior > 0 ? "text-marca-800" : "text-orange-900"}`}>
                {formatearMoneda(renglonSaldo, contrato.moneda)}
              </span>
            </div>
          </div>
        )}

        {punitorios.monto > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <input type="hidden" name="concepto_tipo" value="punitorios" />
            <input
              type="hidden"
              name="concepto_descripcion"
              value={`Punitorios por ${punitorios.dias} días de atraso`}
            />
            <input type="hidden" name="concepto_monto" value={punitorios.monto} />
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-amber-900">
                Punitorios · {punitorios.dias} días de atraso
              </span>
              <span className="tabular font-semibold text-amber-900">
                {formatearMoneda(punitorios.monto, contrato.moneda)}
              </span>
            </div>
          </div>
        )}

        {gastosPendientes.length > 0 && (
          <div>
            <div className="etiqueta">Gastos a cargo del inquilino</div>
            <ul className="space-y-2">
              {gastosPendientes.map((g) => {
                const elegido = gastosElegidos.includes(g.id);
                return (
                  <li key={g.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 p-2.5 hover:bg-stone-50">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-marca-600"
                        checked={elegido}
                        onChange={(e) =>
                          setGastosElegidos((previos) =>
                            e.target.checked
                              ? [...previos, g.id]
                              : previos.filter((id) => id !== g.id)
                          )
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{g.descripcion}</span>
                        <span className="text-xs text-stone-500">
                          {etiqueta(g.tipo)} · {formatearFecha(g.fecha)}
                        </span>
                      </span>
                      <span className="tabular shrink-0 text-sm font-semibold">
                        {formatearMoneda(Number(g.monto), contrato.moneda)}
                      </span>
                      {elegido && (
                        <>
                          <input type="hidden" name="gasto_id" value={g.id} />
                          <input type="hidden" name="concepto_tipo" value={g.tipo} />
                          <input type="hidden" name="concepto_descripcion" value={g.descripcion} />
                          <input type="hidden" name="concepto_monto" value={g.monto} />
                        </>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {extras.map((extra) => (
          <div key={extra.id} className="grid gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-[8rem_1fr_9rem_auto]">
            <select
              name="concepto_tipo"
              className="campo"
              value={extra.tipo}
              onChange={(e) =>
                setExtras((previos) =>
                  previos.map((x) => (x.id === extra.id ? { ...x, tipo: e.target.value } : x))
                )
              }
            >
              {TIPOS_CONCEPTO.filter((t) => t !== "alquiler" && t !== "punitorios").map((t) => (
                <option key={t} value={t}>{etiqueta(t)}</option>
              ))}
            </select>
            <input
              name="concepto_descripcion"
              className="campo"
              placeholder="Detalle"
              value={extra.descripcion}
              onChange={(e) =>
                setExtras((previos) =>
                  previos.map((x) => (x.id === extra.id ? { ...x, descripcion: e.target.value } : x))
                )
              }
            />
            <input
              name="concepto_monto"
              className="campo tabular text-right"
              placeholder="0"
              inputMode="decimal"
              value={extra.monto}
              onChange={(e) =>
                setExtras((previos) =>
                  previos.map((x) => (x.id === extra.id ? { ...x, monto: e.target.value } : x))
                )
              }
            />
            <button
              type="button"
              className="rounded-lg px-3 text-sm text-stone-500 hover:bg-stone-100"
              onClick={() => setExtras((previos) => previos.filter((x) => x.id !== extra.id))}
            >
              Quitar
            </button>
          </div>
        ))}

        <button
          type="button"
          className="boton-secundario"
          onClick={() => {
            setExtras((previos) => [
              ...previos,
              { id: proximoId, tipo: "otro", descripcion: "", monto: "" },
            ]);
            setProximoId((n) => n + 1);
          }}
        >
          Agregar concepto
        </button>
      </section>

      <input type="hidden" name="saldo_anterior" value={saldoAnterior} />

      <section className="tarjeta space-y-4 border-marca-200 bg-marca-50">
        <div className="flex items-center justify-between gap-4">
          <span className="font-titulo text-lg font-bold">Total del recibo</span>
          <span className="tabular font-titulo text-2xl font-bold text-marca-700">
            {formatearMoneda(total, contrato.moneda)}
          </span>
        </div>

        <div>
          <label className="etiqueta" htmlFor="pagado">Cuánto entregó</label>
          <input
            id="pagado"
            name="pagado"
            className="campo tabular text-right"
            inputMode="decimal"
            placeholder={String(total)}
            value={pagado}
            onChange={(e) => setPagado(e.target.value)}
          />
          <p className="mt-1 text-xs text-stone-500">
            Dejalo vacío si pagó justo. Si pagó de más o de menos, escribí lo
            que entregó y la diferencia se arrastra al mes que viene.
          </p>
        </div>

        {saldoResultante !== 0 && (
          <div
            className={`rounded-lg border p-3 text-sm ${
              saldoResultante > 0
                ? "border-marca-300 bg-white text-marca-800"
                : "border-orange-300 bg-white text-orange-900"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>
                {saldoResultante > 0
                  ? "Le queda a favor para el mes que viene"
                  : "Queda debiendo"}
              </span>
              <span className="tabular font-semibold">
                {formatearMoneda(Math.abs(saldoResultante), contrato.moneda)}
              </span>
            </div>
          </div>
        )}
      </section>

      <div>
        <label className="etiqueta" htmlFor="notas">Notas (no salen en el recibo)</label>
        <textarea id="notas" name="notas" rows={2} className="campo" />
      </div>

      <button type="submit" className="boton w-full">
        Emitir recibo
      </button>
      <p className="text-center text-xs text-stone-500">
        Una vez emitido, el recibo no se edita. Si hay un error, se anula y se emite otro.
      </p>
    </form>
  );
}
