"use client";

import { useState } from "react";
import { FormularioContrato } from "@/components/FormularioContrato";

// Lo que devuelve la lectura del PDF. Los nombres de las partes vienen como
// texto: quien carga elige la propiedad y el inquilino de las listas, porque
// vincular con el registro correcto es una decisión de persona, no de la IA.
type DatosLeidos = {
  inquilino_nombre: string;
  propietario_nombre: string;
  direccion: string;
  piso_depto: string;
  localidad: string;
  fecha_inicio: string;
  fecha_fin: string;
  destino: string;
  moneda: string;
  monto_inicial: number;
  deposito_monto: number;
  dia_vencimiento: number;
  indice: string;
  ajuste_frecuencia_meses: number;
  ajuste_porcentaje_fijo: number;
  punitorio_tipo: string;
  punitorio_valor: number;
  garantes: string;
  observaciones: string;
};

export function NuevoContrato({
  accion, propiedades, inquilinos, propiedadInicial,
}: {
  accion: (formData: FormData) => Promise<void>;
  propiedades: { id: string; direccion: string; piso_depto: string | null }[];
  inquilinos: { id: string; nombre: string }[];
  propiedadInicial?: string;
}) {
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leidos, setLeidos] = useState<DatosLeidos | null>(null);

  async function leerPdf(archivo: File) {
    setLeyendo(true);
    setError(null);

    const cuerpo = new FormData();
    cuerpo.append("contrato", archivo);

    try {
      const respuesta = await fetch("/api/contratos/importar", {
        method: "POST",
        body: cuerpo,
      });
      const json = await respuesta.json();

      if (!respuesta.ok) {
        setError(json.error ?? "No se pudo leer el contrato.");
        return;
      }
      setLeidos(json.datos as DatosLeidos);
    } catch {
      setError("No se pudo contactar al servidor. Probá de nuevo.");
    } finally {
      setLeyendo(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-dashed border-marca-300 bg-marca-50/50 p-4">
        <h2 className="font-titulo text-base font-bold">Cargar desde el PDF</h2>
        <p className="mt-1 text-sm text-stone-600">
          Subí el contrato escaneado y se completan solos los montos, las fechas y
          el índice. Después revisás todo antes de guardar.
        </p>

        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-marca-400 bg-white px-4 py-2 text-sm font-semibold text-marca-800 hover:bg-marca-50">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={leyendo}
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) leerPdf(archivo);
            }}
          />
          {leyendo ? "Leyendo el contrato…" : "Elegir PDF"}
        </label>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {leidos && (
          <div className="mt-3 rounded-lg border border-marca-200 bg-white p-3 text-sm">
            <p className="font-semibold text-marca-800">Datos leídos del contrato</p>
            <p className="mt-1 text-stone-600">
              Inquilino: <strong>{leidos.inquilino_nombre || "no figura"}</strong> ·
              Propietario: <strong>{leidos.propietario_nombre || "no figura"}</strong>
            </p>
            <p className="text-stone-600">
              Inmueble: <strong>{[leidos.direccion, leidos.piso_depto].filter(Boolean).join(" ") || "no figura"}</strong>
            </p>
            <p className="mt-2 text-xs text-stone-500">
              Elegí abajo la propiedad y el inquilino que corresponden. El resto
              de los campos ya quedó completado.
            </p>
          </div>
        )}
      </section>

      <FormularioContrato
        // Al llegar datos nuevos, el formulario se vuelve a montar con ellos.
        key={leidos ? `leido-${leidos.fecha_inicio}-${leidos.monto_inicial}` : "vacio"}
        accion={accion}
        propiedades={propiedades}
        inquilinos={inquilinos}
        propiedadInicial={propiedadInicial}
        sugerencia={
          leidos
            ? {
                fecha_inicio: leidos.fecha_inicio || undefined,
                fecha_fin: leidos.fecha_fin || undefined,
                destino: leidos.destino,
                moneda: leidos.moneda,
                monto_inicial: leidos.monto_inicial || undefined,
                deposito_monto: leidos.deposito_monto || null,
                dia_vencimiento: leidos.dia_vencimiento || 10,
                indice: leidos.indice,
                ajuste_frecuencia_meses: leidos.ajuste_frecuencia_meses || 3,
                ajuste_porcentaje_fijo: leidos.ajuste_porcentaje_fijo || null,
                punitorio_tipo: leidos.punitorio_tipo,
                punitorio_valor: leidos.punitorio_valor || 0,
                garantes: leidos.garantes || null,
                observaciones: leidos.observaciones || null,
              }
            : undefined
        }
      />
    </div>
  );
}
