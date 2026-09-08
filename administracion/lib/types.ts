export type Rol = "operador" | "admin";
export type Moneda = "ARS" | "USD";
export type Indice = "ICL" | "IPC" | "UVA" | "CASA_PROPIA" | "FIJO" | "SIN_AJUSTE";
export type TipoPunitorio = "porcentaje_diario" | "monto_fijo_diario" | "ninguno";
export type FormaCobro = "transferencia" | "efectivo";
export type EstadoContrato = "activo" | "finalizado" | "rescindido";
export type ACargoDe = "propietario" | "inquilino";
export type EstadoLiquidacion = "borrador" | "emitida" | "pagada" | "anulada";

export const INDICES: { valor: Indice; etiqueta: string; ayuda: string }[] = [
  { valor: "ICL", etiqueta: "ICL", ayuda: "Índice para Contratos de Locación del BCRA. Serie diaria." },
  { valor: "IPC", etiqueta: "IPC", ayuda: "Índice de Precios al Consumidor del INDEC. Mensual." },
  { valor: "UVA", etiqueta: "UVA", ayuda: "Unidad de Valor Adquisitivo del BCRA. Serie diaria." },
  { valor: "CASA_PROPIA", etiqueta: "Casa Propia", ayuda: "Coeficiente Casa Propia. Mensual." },
  { valor: "FIJO", etiqueta: "Porcentaje fijo", ayuda: "Un porcentaje pactado en el contrato." },
  { valor: "SIN_AJUSTE", etiqueta: "Sin ajuste", ayuda: "El alquiler no se actualiza." },
];

export const TIPOS_PROPIEDAD = [
  "departamento", "casa", "ph", "monoambiente", "duplex",
  "local", "oficina", "galpon", "cochera", "terreno", "otro",
] as const;

export const TIPOS_GASTO = [
  "expensas", "abl", "luz", "gas", "agua", "reparacion",
  "seguro", "honorarios_profesionales", "impuesto", "otro",
] as const;

export const TIPOS_CONCEPTO = [
  "alquiler", "expensas", "abl", "luz", "gas", "agua",
  "punitorios", "reparacion", "ajuste_manual", "saldo_anterior", "otro",
] as const;

export type TipoConcepto = (typeof TIPOS_CONCEPTO)[number];

// Cobros fijos que se repiten todos los meses además del alquiler.
export const TIPOS_CARGO = ["expensas", "abl", "luz", "gas", "agua", "otro"] as const;
export type TipoCargo = (typeof TIPOS_CARGO)[number];

export const PRIORIDADES = ["alta", "normal", "baja"] as const;
export type Prioridad = (typeof PRIORIDADES)[number];

// Etiquetas legibles para las pantallas y los PDF.
export const ETIQUETAS: Record<string, string> = {
  saldo_anterior: "Saldo del mes anterior",
  alta: "Alta",
  normal: "Normal",
  baja: "Baja",
  pendiente: "Pendiente",
  hecha: "Hecha",
  departamento: "Departamento",
  casa: "Casa",
  ph: "PH",
  monoambiente: "Monoambiente",
  duplex: "Dúplex",
  local: "Local",
  oficina: "Oficina",
  galpon: "Galpón",
  cochera: "Cochera",
  terreno: "Terreno",
  otro: "Otro",
  expensas: "Expensas",
  abl: "ABL / Municipal",
  luz: "Luz",
  gas: "Gas",
  agua: "Agua",
  reparacion: "Reparación",
  seguro: "Seguro",
  honorarios_profesionales: "Honorarios profesionales",
  impuesto: "Impuesto",
  alquiler: "Alquiler",
  punitorios: "Punitorios",
  ajuste_manual: "Ajuste",
  transferencia: "Transferencia",
  efectivo: "Efectivo",
  cheque: "Cheque",
  deposito: "Depósito",
  activo: "Activo",
  finalizado: "Finalizado",
  rescindido: "Rescindido",
  alquilado: "Alquilado",
  disponible: "Disponible",
  en_refaccion: "En refacción",
  retirado: "Retirado",
  borrador: "Borrador",
  emitida: "Emitida",
  pagada: "Pagada",
  anulada: "Anulada",
  propietario: "Propietario",
  inquilino: "Inquilino",
  vivienda: "Vivienda",
  comercial: "Comercial",
  mixto: "Mixto",
};

export function etiqueta(valor: string | null | undefined): string {
  if (!valor) return "—";
  return ETIQUETAS[valor] ?? valor;
}
