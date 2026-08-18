import { formatFecha } from "@/lib/fechas";
import { descripcionPlan, plata, porcentaje, tasaMostrada, textoVencimiento } from "@/lib/format";
import type { ResumenPrestamo } from "@/lib/calc";
import type { Prestamo } from "@/lib/types";

/** Los valores con los que se completa una plantilla. */
export type Variables = Record<string, string>;

/**
 * Las etiquetas que se pueden usar en las plantillas.
 *
 * El orden es el que se muestra en la pantalla de ajustes, así que van primero
 * las que se usan siempre.
 */
export const ETIQUETAS: { clave: string; descripcion: string }[] = [
  { clave: "cliente", descripcion: "Nombre del cliente" },
  { clave: "total", descripcion: "Lo que tiene que pagar hoy" },
  { clave: "vence", descripcion: "Fecha de vencimiento" },
  { clave: "dias", descripcion: "«faltan 19 días» / «vencido hace 3 días»" },
  { clave: "prestado", descripcion: "Monto que le prestaste" },
  { clave: "capital", descripcion: "Capital que sigue debiendo hoy" },
  { clave: "interes", descripcion: "Interés del mes (o del plan)" },
  { clave: "tasa", descripcion: "La tasa, ej. «30%»" },
  { clave: "plan", descripcion: "«30% mensual» o «3 cuotas de $85.370»" },
  { clave: "cuota", descripcion: "Monto de cada cuota" },
  { clave: "cuotas", descripcion: "Cantidad de cuotas" },
  { clave: "cuotas_pagadas", descripcion: "Cuántas cuotas ya pagó" },
  { clave: "inicio", descripcion: "Fecha en que arrancó el préstamo" },
  { clave: "fecha", descripcion: "La fecha de hoy" },
  { clave: "observacion", descripcion: "La observación del préstamo" },
];

export const PLANTILLA_ESTADO_CUENTA = `Hola {cliente} 👋
Tu estado de cuenta al {fecha}:

Monto: {prestado}

*Total a devolver: {total}*
Vencimiento: {vence} ({dias})`;

export const PLANTILLA_PRESTAMO_NUEVO = `Hola {cliente} 👋
Prestamo confirmado ✅:

Importe: {prestado}
*Monto a devolver: {total}*
Fecha de vencimiento: {vence}`;

/**
 * Reemplaza cada {etiqueta} por su valor.
 *
 * Una etiqueta mal escrita se deja tal cual, a propósito: así se ve el error en
 * la vista previa en vez de aparecer un hueco silencioso en el mensaje.
 */
export function aplicarPlantilla(plantilla: string, variables: Variables): string {
  const texto = plantilla.replace(/\{(\w+)\}/g, (original, clave: string) =>
    clave in variables ? variables[clave] : original
  );

  // Si una etiqueta quedó vacía y dejó una línea sola, se junta todo.
  return texto
    .split("\n")
    .filter((linea, i, lineas) => linea.trim() !== "" || lineas[i - 1]?.trim() !== "")
    .join("\n")
    .trim();
}

/** Los datos de un préstamo, listos para completar una plantilla. */
export function variablesDePrestamo(
  prestamo: Prestamo,
  datos: ResumenPrestamo,
  nombreCliente: string,
  hoy: string
): Variables {
  const tasa = tasaMostrada(prestamo);

  return {
    cliente: nombreCliente,
    total: plata(datos.aDevolver),
    vence: formatFecha(prestamo.fecha_vencimiento),
    dias: textoVencimiento(datos.diasParaVencer),
    prestado: plata(prestamo.capital_inicial),
    capital: plata(datos.capital),
    interes: plata(datos.interes),
    tasa: porcentaje(tasa),
    plan: descripcionPlan(prestamo, datos),
    cuota: datos.cuotaMonto ? plata(datos.cuotaMonto) : "",
    cuotas: datos.cuotasTotal ? String(datos.cuotasTotal) : "",
    cuotas_pagadas: String(datos.cuotasPagadas),
    inicio: formatFecha(prestamo.fecha_inicio),
    fecha: formatFecha(hoy),
    observacion: prestamo.observacion ?? "",
  };
}

/**
 * Datos de muestra para la vista previa de /ajustes, con los números de la
 * planilla: un préstamo con interés mensual y uno en cuotas.
 */
export const EJEMPLOS: { nombre: string; variables: Variables }[] = [
  {
    nombre: "Interés mensual",
    variables: {
      cliente: "Miriam Marquez",
      total: "$260.000",
      vence: "06/09/2026",
      dias: "faltan 19 días",
      prestado: "$200.000",
      capital: "$200.000",
      interes: "$60.000",
      tasa: "30%",
      plan: "30% mensual",
      cuota: "",
      cuotas: "",
      cuotas_pagadas: "0",
      inicio: "07/08/2026",
      fecha: "18/08/2026",
      observacion: "",
    },
  },
  {
    nombre: "En cuotas",
    variables: {
      cliente: "Luciana Aparicio",
      total: "$256.110",
      vence: "10/09/2026",
      dias: "faltan 23 días",
      prestado: "$200.000",
      capital: "$200.000",
      interes: "$56.110",
      tasa: "28,06%",
      plan: "3 cuotas de $85.370",
      cuota: "$85.370",
      cuotas: "3",
      cuotas_pagadas: "0",
      inicio: "13/08/2026",
      fecha: "18/08/2026",
      observacion: "3 cuotas de $85.370",
    },
  },
];
