/** "$200.000", como en la planilla: sin centavos. */
export function plata(monto: number): string {
  return `$${Math.round(monto).toLocaleString("es-AR")}`;
}

/** "30%" o "28,06%" — sin decimales cuando es un numero redondo. */
export function porcentaje(tasa: number): string {
  const redondeado = Math.round(tasa * 100) / 100;
  return `${redondeado.toLocaleString("es-AR")}%`;
}

/** "faltan 19 dias", "vence hoy", "vencido hace 3 dias". */
export function textoVencimiento(dias: number): string {
  if (dias === 0) return "vence hoy";
  if (dias === 1) return "vence mañana";
  if (dias > 1) return `faltan ${dias} días`;
  if (dias === -1) return "vencido hace 1 día";
  return `vencido hace ${Math.abs(dias)} días`;
}
