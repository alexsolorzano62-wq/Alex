// La plata se redondea a dos decimales una sola vez, al final de cada cuenta.
// Redondear en pasos intermedios es lo que hace que una liquidación cierre
// con dos pesos de diferencia contra la suma de los recibos.
export function redondear(monto: number): number {
  // El +Number.EPSILON corrige los casos donde el binario deja 1.005 como
  // 1.00499999… y el redondeo normal se iría para abajo.
  return Math.round((monto + Number.EPSILON) * 100) / 100;
}

export function formatearMoneda(monto: number, moneda: "ARS" | "USD" = "ARS"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 2,
  }).format(monto);
}

// Para los totales de pantalla, donde los centavos son ruido.
export function formatearCorto(monto: number, moneda: "ARS" | "USD" = "ARS"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(monto);
}
