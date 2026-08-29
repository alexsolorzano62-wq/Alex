"use client";

import { useState } from "react";

export function FormularioPagoLiquidacion({
  accion, id, formaCobro, hoy,
}: {
  accion: (formData: FormData) => Promise<void>;
  id: string;
  formaCobro: string;
  hoy: string;
}) {
  const [metodo, setMetodo] = useState(formaCobro);

  return (
    <form action={accion} className="mt-3 space-y-4">
      <input type="hidden" name="id" value={id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="etiqueta" htmlFor="metodo_pago">Cómo se le pagó</label>
          <select
            id="metodo_pago"
            name="metodo_pago"
            className="campo"
            value={metodo}
            onChange={(e) => setMetodo(e.target.value)}
          >
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </div>
        <div>
          <label className="etiqueta" htmlFor="fecha_pago">Fecha</label>
          <input id="fecha_pago" name="fecha_pago" type="date" className="campo" defaultValue={hoy} required />
        </div>
      </div>

      {metodo === "transferencia" ? (
        <div>
          <label className="etiqueta" htmlFor="comprobante_url">Comprobante</label>
          <input
            id="comprobante_url"
            name="comprobante_url"
            className="campo"
            placeholder="N.º de operación o enlace al comprobante"
          />
        </div>
      ) : (
        <>
          <div>
            <label className="etiqueta" htmlFor="conformidad">
              Conformidad del propietario <span className="text-marca-600">*</span>
            </label>
            <input
              id="conformidad"
              name="conformidad"
              className="campo"
              placeholder="Ej.: Recibió en mano en la oficina, firmó el duplicado"
              required
            />
            <p className="mt-1 text-xs text-stone-500">
              Es tu respaldo si dentro de dos años alguien dice que no cobró.
            </p>
          </div>
          <div>
            <label className="etiqueta" htmlFor="recibido_por">Quién retiró</label>
            <input id="recibido_por" name="recibido_por" className="campo" placeholder="Si no lo retiró el propietario" />
          </div>
        </>
      )}

      <button type="submit" className="boton">Registrar pago</button>
    </form>
  );
}
