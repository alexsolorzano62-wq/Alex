"use client";

import { useState } from "react";
import { Campo, Selector, Area } from "@/components/Ui";
import { INDICES, type Indice } from "@/lib/types";

type Contrato = {
  id: string;
  propiedad_id: string;
  inquilino_id: string;
  garantes: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  destino: string;
  moneda: string;
  monto_inicial: number;
  monto_actual: number;
  deposito_monto: number | null;
  dia_vencimiento: number;
  honorarios_porcentaje: number;
  indice: string;
  ajuste_frecuencia_meses: number;
  ajuste_porcentaje_fijo: number | null;
  punitorio_tipo: string;
  punitorio_valor: number;
  punitorio_dias_gracia: number;
  estado: string;
  observaciones: string | null;
};

export function FormularioContrato({
  accion, contrato, sugerencia, propiedades, inquilinos, propiedadInicial,
}: {
  accion: (formData: FormData) => Promise<void>;
  contrato?: Contrato;
  // Lo que leyó la IA del PDF: rellena los campos para revisar, no para guardar
  // a ciegas. Por eso entra por una prop distinta de un contrato ya guardado.
  sugerencia?: Partial<Contrato>;
  propiedades: { id: string; direccion: string; piso_depto: string | null }[];
  inquilinos: { id: string; nombre: string }[];
  propiedadInicial?: string;
}) {
  const v = contrato ?? sugerencia;
  const [indice, setIndice] = useState<Indice>((v?.indice as Indice) ?? "ICL");
  const [punitorio, setPunitorio] = useState(v?.punitorio_tipo ?? "porcentaje_diario");

  const ayudaIndice = INDICES.find((i) => i.valor === indice)?.ayuda;

  return (
    <form action={accion} className="space-y-6">
      {contrato && <input type="hidden" name="id" value={contrato.id} />}

      <section className="tarjeta space-y-4">
        <h2 className="font-titulo text-lg font-bold">Las partes</h2>
        <Selector
          rotulo="Propiedad"
          nombre="propiedad_id"
          valor={v?.propiedad_id ?? propiedadInicial}
          opciones={propiedades.map((p) => ({
            valor: p.id,
            texto: `${p.direccion}${p.piso_depto ? ` ${p.piso_depto}` : ""}`,
          }))}
          requerido
        />
        <Selector
          rotulo="Inquilino"
          nombre="inquilino_id"
          valor={v?.inquilino_id}
          opciones={inquilinos.map((i) => ({ valor: i.id, texto: i.nombre }))}
          requerido
        />
        <Area
          rotulo="Garantes"
          nombre="garantes"
          valor={v?.garantes}
          filas={2}
        />
      </section>

      <section className="tarjeta space-y-4">
        <h2 className="font-titulo text-lg font-bold">Plazo y destino</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Desde" nombre="fecha_inicio" tipo="date" valor={v?.fecha_inicio} requerido />
          <Campo rotulo="Hasta" nombre="fecha_fin" tipo="date" valor={v?.fecha_fin} requerido />
        </div>
        <Selector
          rotulo="Destino"
          nombre="destino"
          valor={v?.destino}
          opciones={[
            { valor: "vivienda", texto: "Vivienda" },
            { valor: "comercial", texto: "Comercial" },
            { valor: "mixto", texto: "Mixto" },
            { valor: "otro", texto: "Otro" },
          ]}
          ayuda="Si no se pactó plazo, la ley supone 2 años para vivienda y 3 para el resto."
        />
      </section>

      <section className="tarjeta space-y-4">
        <h2 className="font-titulo text-lg font-bold">Plata</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Selector
            rotulo="Moneda"
            nombre="moneda"
            valor={v?.moneda}
            opciones={[
              { valor: "ARS", texto: "Pesos" },
              { valor: "USD", texto: "Dólares" },
            ]}
          />
          <Campo
            rotulo="Alquiler pactado"
            nombre="monto_inicial"
            valor={v?.monto_inicial}
            requerido
            inputMode="decimal"
            ayuda={contrato ? "El monto que se cobra hoy lo mueve el motor de ajustes." : undefined}
          />
          <Campo
            rotulo="Día de vencimiento"
            nombre="dia_vencimiento"
            tipo="number"
            min={1}
            max={28}
            valor={v?.dia_vencimiento ?? 10}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Depósito en garantía" nombre="deposito_monto" valor={v?.deposito_monto} inputMode="decimal" />
          <Campo
            rotulo="Honorarios de administración (%)"
            nombre="honorarios_porcentaje"
            valor={v?.honorarios_porcentaje ?? 8}
            inputMode="decimal"
            requerido
            ayuda="Va del 7 al 10 según el propietario. Queda congelado en cada liquidación."
          />
        </div>
      </section>

      <section className="tarjeta space-y-4">
        <h2 className="font-titulo text-lg font-bold">Ajustes</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="indice">Índice</label>
            <select
              id="indice"
              name="indice"
              className="campo"
              value={indice}
              onChange={(e) => setIndice(e.target.value as Indice)}
            >
              {INDICES.map((i) => (
                <option key={i.valor} value={i.valor}>{i.etiqueta}</option>
              ))}
            </select>
            {ayudaIndice && <p className="mt-1 text-xs text-stone-500">{ayudaIndice}</p>}
          </div>

          {indice !== "SIN_AJUSTE" && (
            <Selector
              rotulo="Cada cuánto"
              nombre="ajuste_frecuencia_meses"
              valor={String(v?.ajuste_frecuencia_meses ?? 3)}
              opciones={[
                { valor: "1", texto: "Todos los meses" },
                { valor: "2", texto: "Cada 2 meses" },
                { valor: "3", texto: "Trimestral" },
                { valor: "4", texto: "Cuatrimestral" },
                { valor: "6", texto: "Semestral" },
                { valor: "12", texto: "Anual" },
              ]}
            />
          )}
        </div>

        {indice === "FIJO" && (
          <Campo
            rotulo="Porcentaje pactado por período (%)"
            nombre="ajuste_porcentaje_fijo"
            valor={v?.ajuste_porcentaje_fijo}
            inputMode="decimal"
            requerido
            ayuda="Ej.: 12 significa que cada período el alquiler sube un 12%."
          />
        )}
      </section>

      <section className="tarjeta space-y-4">
        <h2 className="font-titulo text-lg font-bold">Punitorios</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="etiqueta" htmlFor="punitorio_tipo">Cómo se calculan</label>
            <select
              id="punitorio_tipo"
              name="punitorio_tipo"
              className="campo"
              value={punitorio}
              onChange={(e) => setPunitorio(e.target.value)}
            >
              <option value="porcentaje_diario">Porcentaje diario</option>
              <option value="monto_fijo_diario">Monto fijo por día</option>
              <option value="ninguno">Sin punitorios</option>
            </select>
          </div>

          {punitorio !== "ninguno" && (
            <>
              <Campo
                rotulo={punitorio === "porcentaje_diario" ? "% por día" : "$ por día"}
                nombre="punitorio_valor"
                valor={v?.punitorio_valor}
                inputMode="decimal"
                ayuda={punitorio === "porcentaje_diario" ? "Ej.: 0,1 es un 0,1% diario." : undefined}
              />
              <Campo
                rotulo="Días de gracia"
                nombre="punitorio_dias_gracia"
                tipo="number"
                min={0}
                valor={v?.punitorio_dias_gracia ?? 0}
              />
            </>
          )}
        </div>
      </section>

      <section className="tarjeta space-y-4">
        {contrato && (
          <Selector
            rotulo="Estado"
            nombre="estado"
            valor={contrato.estado}
            opciones={[
              { valor: "activo", texto: "Activo" },
              { valor: "finalizado", texto: "Finalizado" },
              { valor: "rescindido", texto: "Rescindido" },
            ]}
          />
        )}
        <Area rotulo="Observaciones" nombre="observaciones" valor={v?.observaciones} />
      </section>

      <button type="submit" className="boton w-full sm:w-auto">
        {contrato ? "Guardar cambios" : "Crear contrato"}
      </button>
    </form>
  );
}
