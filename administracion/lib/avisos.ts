import { formatearMoneda } from "@/lib/dinero";
import { formatearFecha, nombreDelPeriodo } from "@/lib/fechas";
import type { Moneda } from "@/lib/types";

// ---------------------------------------------------------------------------
// Los textos de los avisos.
//
// Son funciones puras y viven acá y no adentro de las pantallas para que se
// puedan leer todos juntos: el tono de lo que la inmobiliaria le manda a sus
// inquilinos es una decisión del negocio, no un detalle de implementación.
//
// Cortos, en segunda persona y sin saludos de formulario. Lo que la persona
// necesita saber está en las primeras dos líneas, porque WhatsApp muestra eso
// en la notificación.
// ---------------------------------------------------------------------------

export type TipoAviso = "vencimiento" | "aumento" | "liquidacion" | "recibo";

export const ETIQUETA_AVISO: Record<TipoAviso, string> = {
  vencimiento: "Recordatorio de pago",
  aumento: "Aviso de aumento",
  liquidacion: "Liquidación lista",
  recibo: "Envío del recibo",
};

const FIRMA = "Lamelas & Chaumont Inmobiliaria";

export function avisoDeVencimiento(datos: {
  inquilino: string;
  direccion: string;
  periodo: string;
  vencimiento: string;
  monto: number;
  moneda: Moneda;
  diasDeAtraso: number;
}): string {
  const { inquilino, direccion, periodo, vencimiento, monto, moneda, diasDeAtraso } = datos;
  const nombre = inquilino.split(" ")[0];

  // Antes del vencimiento es un recordatorio; después, un aviso de atraso. El
  // mismo texto para los dos casos sonaría mal en uno de los dos.
  const encabezado =
    diasDeAtraso > 0
      ? `Hola ${nombre}, el alquiler de ${nombreDelPeriodo(periodo)} venció el ${formatearFecha(vencimiento)} y todavía figura impago.`
      : `Hola ${nombre}, te recordamos que el alquiler de ${nombreDelPeriodo(periodo)} vence el ${formatearFecha(vencimiento)}.`;

  const cuerpo = [
    encabezado,
    "",
    `${direccion}`,
    `Importe: ${formatearMoneda(monto, moneda)}`,
  ];

  if (diasDeAtraso > 0) {
    cuerpo.push(
      "",
      `Van ${diasDeAtraso} ${diasDeAtraso === 1 ? "día" : "días"} de atraso. Si ya lo pagaste, avisanos y lo registramos.`
    );
  }

  cuerpo.push("", FIRMA);
  return cuerpo.join("\n");
}

export function avisoDeAumento(datos: {
  inquilino: string;
  direccion: string;
  montoAnterior: number;
  montoNuevo: number;
  moneda: Moneda;
  desde: string;
  indice: string;
}): string {
  const { inquilino, direccion, montoAnterior, montoNuevo, moneda, desde, indice } = datos;
  const nombre = inquilino.split(" ")[0];

  const porQue =
    indice === "FIJO"
      ? "por el porcentaje de actualización que fija el contrato"
      : `por la actualización según ${indice}, que es el índice que fija el contrato`;

  return [
    `Hola ${nombre}, te avisamos que a partir de ${formatearFecha(desde)} el alquiler de ${direccion} pasa a ${formatearMoneda(montoNuevo, moneda)}.`,
    "",
    `Venía siendo ${formatearMoneda(montoAnterior, moneda)}. El cambio es ${porQue}.`,
    "",
    "Cualquier duda, escribinos.",
    "",
    FIRMA,
  ].join("\n");
}

export function avisoDeLiquidacion(datos: {
  propietario: string;
  periodo: string;
  neto: number;
  moneda: Moneda;
  unidades: number;
  metodoPago: string | null;
}): string {
  const { propietario, periodo, neto, moneda, unidades, metodoPago } = datos;
  const nombre = propietario.split(" ")[0];

  const cierre =
    metodoPago === "efectivo"
      ? "Cuando quieras pasás por la oficina a retirarlo."
      : "En las próximas horas hacemos la transferencia.";

  return [
    `Hola ${nombre}, ya está la liquidación de ${nombreDelPeriodo(periodo)}.`,
    "",
    `${unidades} ${unidades === 1 ? "unidad" : "unidades"} · te corresponden ${formatearMoneda(neto, moneda)}`,
    "",
    cierre,
    "Te paso el detalle adjunto.",
    "",
    FIRMA,
  ].join("\n");
}

export function avisoDeRecibo(datos: {
  inquilino: string;
  direccion: string;
  periodo: string;
  total: number;
  moneda: Moneda;
  numero: number;
}): string {
  const { inquilino, direccion, periodo, total, moneda, numero } = datos;
  const nombre = inquilino.split(" ")[0];

  return [
    `Hola ${nombre}, recibimos el pago del alquiler de ${nombreDelPeriodo(periodo)} de ${direccion}.`,
    "",
    `Recibo N.º ${numero} · ${formatearMoneda(total, moneda)}`,
    "",
    "Te lo paso adjunto. Gracias.",
    "",
    FIRMA,
  ].join("\n");
}
