import { formatFecha } from "@/lib/fechas";
import { descripcionPlan, plata, porcentaje, tasaMostrada, textoVencimiento } from "@/lib/format";
import type { ResumenPrestamo } from "@/lib/calc";
import type { Pago, Prestamo } from "@/lib/types";

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
  { clave: "forma_pago", descripcion: "«16 cuotas semanales de $27.900» / «$60.000 por mes»" },
  { clave: "saldo", descripcion: "Lo que le queda por pagar" },
  { clave: "cuotas_restantes", descripcion: "Cuántas cuotas le faltan" },
  { clave: "pago", descripcion: "El importe del pago (solo en el comprobante)" },
  { clave: "total", descripcion: "Igual que el saldo. Ojo: es tu número interno" },
  { clave: "vence", descripcion: "Fecha de vencimiento" },
  { clave: "dias", descripcion: "«faltan 19 días» / «vencido hace 3 días»" },
  { clave: "prestado", descripcion: "Monto que le prestaste" },
  { clave: "capital", descripcion: "Capital que sigue debiendo hoy" },
  { clave: "interes", descripcion: "Interés. Ojo: es tu número interno" },
  { clave: "tasa", descripcion: "La tasa. Ojo: es tu número interno" },
  { clave: "plan", descripcion: "«30% mensual» o «3 cuotas de $85.370». Muestra la tasa" },
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
Forma de pago: {forma_pago}
Abonadas: {cuotas_pagadas} de {cuotas}
Próximo vencimiento: {vence} ({dias})`;

export const PLANTILLA_COMPROBANTE = `Hola {cliente} 👋
Recibimos tu pago ✅

Importe abonado: {pago}
Fecha: {fecha}
Te quedan {cuotas_restantes} cuotas de {cuota}
Saldo: {saldo}
Próximo vencimiento: {vence}`;

export const PLANTILLA_PRESTAMO_NUEVO = `Hola {cliente} 👋
Prestamo confirmado ✅:

Importe: {prestado}
Forma de pago: {forma_pago}
Primer vencimiento: {vence}`;

/**
 * Reemplaza cada {etiqueta} por su valor.
 *
 * Una etiqueta mal escrita se deja tal cual, a propósito: así se ve el error en
 * la vista previa en vez de aparecer un hueco silencioso en el mensaje.
 */
export function aplicarPlantilla(plantilla: string, variables: Variables): string {
  // Un renglón con una etiqueta sin dato se va entero: en un préstamo con
  // interés mensual no hay cuotas, y "Abonadas: 0 de " no se le manda a nadie.
  const utiles = plantilla.split("\n").filter((linea) => {
    const etiquetas = [...linea.matchAll(/\{(\w+)\}/g)].map((coincidencia) => coincidencia[1]);
    return !etiquetas.some((clave) => clave in variables && variables[clave] === "");
  });

  const texto = utiles
    .join("\n")
    .replace(/\{(\w+)\}/g, (original, clave: string) =>
      clave in variables ? variables[clave] : original
    );

  // Si al sacar renglones quedaron huecos dobles, se juntan en uno.
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
  hoy: string,
  /** El pago recién registrado, para el comprobante. */
  pago?: Pago | null
): Variables {
  const esMensual = prestamo.modalidad === "mensual";
  const tasa = tasaMostrada(prestamo);

  const restantes =
    datos.cuotasTotal != null ? datos.cuotasTotal - datos.cuotasPagadas : null;

  // Cómo paga, sin decir la tasa ni el total: eso es información tuya.
  const formaPago = esMensual
    ? `${plata(datos.interes)} por mes`
    : `${datos.cuotasTotal} cuotas ${prestamo.modalidad === "semanal" ? "semanales" : "mensuales"} de ${plata(datos.cuotaMonto ?? 0)}`;

  return {
    cliente: nombreCliente,
    forma_pago: formaPago,
    saldo: plata(datos.aDevolver),
    cuotas_restantes: restantes != null ? String(Math.max(0, restantes)) : "",
    pago: pago ? plata(pago.monto) : "",
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
    // En un préstamo con interés mensual no hay cuotas que contar.
    cuotas_pagadas: esMensual ? "" : String(datos.cuotasPagadas),
    inicio: formatFecha(prestamo.fecha_inicio),
    fecha: pago ? formatFecha(pago.fecha) : formatFecha(hoy),
    observacion: prestamo.observacion ?? "",
  };
}

/**
 * Datos de muestra para la vista previa de /ajustes, con los números de la
 * planilla: un préstamo con interés mensual y uno en cuotas.
 */
export const EJEMPLOS: { nombre: string; variables: Variables }[] = [
  {
    nombre: "Plan semanal",
    variables: {
      cliente: "Miriam Marquez",
      forma_pago: "16 cuotas semanales de $27.900",
      saldo: "$418.500",
      cuotas_restantes: "15",
      pago: "$27.900",
      total: "$418.500",
      vence: "01/09/2026",
      dias: "faltan 7 días",
      prestado: "$200.000",
      capital: "$200.000",
      interes: "$246.400",
      tasa: "123,2%",
      plan: "16 semanas de $27.900",
      cuota: "$27.900",
      cuotas: "16",
      cuotas_pagadas: "1",
      inicio: "18/08/2026",
      fecha: "25/08/2026",
      observacion: "",
    },
  },
  {
    nombre: "Interés mensual",
    variables: {
      cliente: "Willy Marquez",
      forma_pago: "$125.000 por mes",
      saldo: "$625.000",
      // Un préstamo con interés mensual no tiene cuotas: estas etiquetas van
      // vacías y se llevan su renglón entero.
      cuotas_restantes: "",
      pago: "$125.000",
      total: "$625.000",
      vence: "15/09/2026",
      dias: "faltan 28 días",
      prestado: "$500.000",
      capital: "$500.000",
      interes: "$125.000",
      tasa: "25%",
      plan: "25% mensual",
      cuota: "",
      cuotas: "",
      cuotas_pagadas: "",
      inicio: "16/08/2026",
      fecha: "18/08/2026",
      observacion: "",
    },
  },
];
