/**
 * Fechas como texto "YYYY-MM-DD", sin horas ni zona horaria.
 *
 * Un prestamo que arranca el 7/8 arranca el 7/8 en cualquier lado. Si se
 * guardaran como Date, Argentina (UTC-3) mostraria el dia anterior, porque
 * `new Date("2026-08-07")` se interpreta como medianoche UTC.
 */

/** Fecha de hoy segun el reloj del dispositivo, como "YYYY-MM-DD". */
export function hoyISO(): string {
  const ahora = new Date();
  return [
    ahora.getFullYear(),
    String(ahora.getMonth() + 1).padStart(2, "0"),
    String(ahora.getDate()).padStart(2, "0"),
  ].join("-");
}

function partes(iso: string): [number, number, number] {
  const [a, m, d] = iso.split("-").map(Number);
  return [a, m, d];
}

/**
 * Suma meses calendario. Si el dia no existe en el mes destino, cae en el
 * ultimo dia de ese mes: 31/1 + 1 mes = 28/2 (o 29/2 en bisiesto).
 */
export function sumarMeses(iso: string, meses: number): string {
  const [anio, mes, dia] = partes(iso);
  const total = (anio * 12 + (mes - 1)) + meses;
  const anioDestino = Math.floor(total / 12);
  const mesDestino = (total % 12) + 1;
  const ultimoDia = new Date(Date.UTC(anioDestino, mesDestino, 0)).getUTCDate();
  const diaDestino = Math.min(dia, ultimoDia);
  return [
    String(anioDestino).padStart(4, "0"),
    String(mesDestino).padStart(2, "0"),
    String(diaDestino).padStart(2, "0"),
  ].join("-");
}

/** Dias de `desde` a `hasta`. Negativo si `hasta` ya paso. */
export function diasEntre(desde: string, hasta: string): number {
  const [a1, m1, d1] = partes(desde);
  const [a2, m2, d2] = partes(hasta);
  const ms = Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1);
  return Math.round(ms / 86_400_000);
}

/** "2026-08-07" -> "07/08/2026" */
export function formatFecha(iso: string): string {
  const [anio, mes, dia] = partes(iso);
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${anio}`;
}

/** "2026-08-07" -> "7/8", como en la planilla. */
export function formatFechaCorta(iso: string): string {
  const [, mes, dia] = partes(iso);
  return `${dia}/${mes}`;
}
