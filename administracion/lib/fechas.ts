// Todas las fechas viajan como texto "YYYY-MM-DD". Nada de objetos Date con
// zona horaria: un contrato que vence el 10 vence el 10 en cualquier huso.

export function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function partes(fechaISO: string): [number, number, number] {
  const [a, m, d] = fechaISO.slice(0, 10).split("-").map(Number);
  return [a, m, d];
}

function armar(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function diasDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

// Suma meses respetando el fin de mes: el 31 de enero más un mes cae el 28
// (o 29) de febrero, no el 3 de marzo.
export function sumarMeses(fechaISO: string, meses: number): string {
  const [anio, mes, dia] = partes(fechaISO);
  const total = (anio * 12 + (mes - 1)) + meses;
  const nuevoAnio = Math.floor(total / 12);
  const nuevoMes = (total % 12) + 1;
  const tope = diasDelMes(nuevoAnio, nuevoMes);
  return armar(nuevoAnio, nuevoMes, Math.min(dia, tope));
}

export function diasEntre(desdeISO: string, hastaISO: string): number {
  const [a1, m1, d1] = partes(desdeISO);
  const [a2, m2, d2] = partes(hastaISO);
  const ms = Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1);
  return Math.round(ms / 86_400_000);
}

// El período de un mes siempre se guarda como su día 1.
export function primerDiaDelMes(fechaISO: string): string {
  const [anio, mes] = partes(fechaISO);
  return armar(anio, mes, 1);
}

// El vencimiento del alquiler de un mes: el día pactado, recortado si ese mes
// es más corto (un contrato que vence el 30 vence el 28 en febrero).
export function vencimientoDelPeriodo(periodoISO: string, diaVencimiento: number): string {
  const [anio, mes] = partes(periodoISO);
  return armar(anio, mes, Math.min(diaVencimiento, diasDelMes(anio, mes)));
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function nombreDelPeriodo(periodoISO: string): string {
  const [anio, mes] = partes(periodoISO);
  return `${MESES[mes - 1]} ${anio}`;
}

export function formatearFecha(fechaISO: string): string {
  const [anio, mes, dia] = partes(fechaISO);
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${anio}`;
}

// ---------------------------------------------------------- días inhábiles --
// El alquiler vence el día pactado, salvo que ese día sea domingo o feriado
// nacional: ahí el vencimiento se corre al día siguiente hábil, y recién desde
// ese día empiezan a contar los punitorios. El sábado no corre nada: se pactó
// así y es día de pago como cualquier otro.

export function diaDeLaSemana(fechaISO: string): number {
  const [anio, mes, dia] = partes(fechaISO);
  return new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay(); // 0 = domingo
}

export function sumarDias(fechaISO: string, dias: number): string {
  const [anio, mes, dia] = partes(fechaISO);
  const d = new Date(Date.UTC(anio, mes - 1, dia + dias));
  return d.toISOString().slice(0, 10);
}

export function esInhabil(fechaISO: string, feriados: ReadonlySet<string>): boolean {
  return diaDeLaSemana(fechaISO) === 0 || feriados.has(fechaISO);
}

// Corre la fecha hacia adelante mientras caiga en domingo o feriado. El tope
// existe por si alguien carga un mes entero de feriados: preferimos devolver
// una fecha rara a colgarnos en un bucle.
export function proximoDiaHabil(
  fechaISO: string,
  feriados: ReadonlySet<string> = new Set()
): string {
  let fecha = fechaISO;
  for (let i = 0; i < 15 && esInhabil(fecha, feriados); i++) {
    fecha = sumarDias(fecha, 1);
  }
  return fecha;
}

// El vencimiento real de un mes: el día pactado, recortado si el mes es más
// corto, y corrido si cae domingo o feriado.
export function vencimientoHabilDelPeriodo(
  periodoISO: string,
  diaVencimiento: number,
  feriados: ReadonlySet<string> = new Set()
): string {
  return proximoDiaHabil(vencimientoDelPeriodo(periodoISO, diaVencimiento), feriados);
}
