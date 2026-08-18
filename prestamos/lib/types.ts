/** Como se devuelve la plata. */
export type Modalidad =
  /** Interes mensual: paga el interes y renueva otro mes, o salda el capital. */
  | "mensual"
  /** Plan cerrado en N cuotas mensuales fijas. */
  | "cuotas"
  /** Plan cerrado en N cuotas semanales, según la lista de precios. */
  | "semanal";

export type EstadoPrestamo = "vigente" | "pagado" | "cancelado";

export type TipoPago =
  /** Pago del interes del mes: el capital queda igual y se renueva. */
  | "interes"
  /** Entrega a cuenta del capital. */
  | "capital"
  /** Pago de una cuota de un plan. */
  | "cuota"
  /** Salda todo lo que debia. */
  | "total";

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  notas: string | null;
  created_at: string;
};

export type Prestamo = {
  id: string;
  cliente_id: string;
  modalidad: Modalidad;
  /** Lo que se presto originalmente. Nunca cambia: sirve de referencia. */
  capital_inicial: number;
  /** Capital que sigue debiendo hoy. Baja con entregas, sube si capitaliza. */
  capital_actual: number;
  /** En "mensual" es la tasa por mes. En los planes, la tasa total del plan. */
  tasa_mensual: number;
  fecha_inicio: string;
  fecha_vencimiento: string;
  /** Solo en los planes. En "semanal", `cuotas_total` es la cantidad de semanas. */
  cuotas_total: number | null;
  cuota_monto: number | null;
  total_a_devolver: number | null;
  estado: EstadoPrestamo;
  observacion: string | null;
  created_at: string;
};

export type Pago = {
  id: string;
  prestamo_id: string;
  fecha: string;
  monto: number;
  tipo: TipoPago;
  nota: string | null;
  created_at: string;
};

/** Un prestamo con los datos del cliente y los pagos ya resueltos. */
export type PrestamoConCliente = Prestamo & {
  cliente: Pick<Cliente, "id" | "nombre" | "telefono">;
  pagos: Pago[];
};

export type Ajustes = {
  owner_id: string;
  plantilla_estado_cuenta: string | null;
  plantilla_prestamo_nuevo: string | null;
  plantilla_comprobante: string | null;
  actualizado_at: string;
};
