import { sumarMeses } from "@/lib/fechas";
import { frecuenciaDe, siguienteVencimiento } from "@/lib/periodos";
import type { Frecuencia, Modalidad, PrestamoConCliente } from "@/lib/types";

/** Un préstamo cuyo vencimiento guardado no coincide con sus cobros. */
export type Desfase = {
  prestamoId: string;
  cliente: string;
  modalidad: Modalidad;
  frecuencia: Frecuencia;
  /** La fecha que tiene guardada hoy. */
  guardado: string;
  /** La que le corresponde según los cobros registrados. */
  esperado: string;
  /** Cuántos períodos de más tiene. Negativo si le faltan. */
  periodos: number;
  /**
   * La fecha guardada cae justo en un vencimiento del plan. Cuando es `false`
   * no es un corrimiento: es una fecha puesta a mano, que puede estar bien.
   */
  enGrilla: boolean;
  cuotasPagadas: number;
  cuotasTotal: number | null;
  /**
   * En los planes la fecha se deduce con certeza: primer vencimiento un período
   * después del inicio, y uno más por cada cuota cobrada. En el interés mensual
   * hay que suponer que el plazo original era de un mes, así que puede dar un
   * falso aviso si lo pactaste a dos o tres.
   */
  seguro: boolean;
};

/**
 * La fecha de vencimiento que le corresponde a un préstamo por sus cobros.
 *
 * Es la cuenta que hace la app cada vez que registra un pago. Repetirla desde
 * cero sirve para detectar los préstamos que quedaron corridos —los que
 * perdieron el paso cuando borrar un cobro no revertía el vencimiento.
 */
export function vencimientoEsperado(prestamo: PrestamoConCliente): string {
  const pagos = prestamo.pagos ?? [];

  if (prestamo.modalidad === "mensual") {
    const intereses = pagos.filter((pago) => pago.tipo === "interes").length;
    return sumarMeses(prestamo.fecha_inicio, 1 + intereses);
  }

  const frecuencia = frecuenciaDe(prestamo);
  const cuotas = pagos.filter((pago) => pago.tipo === "cuota").length;

  let fecha = prestamo.fecha_inicio;
  for (let i = 0; i < cuotas + 1; i++) {
    fecha = siguienteVencimiento(fecha, frecuencia);
  }
  return fecha;
}

/**
 * Cuántos períodos hay de `desde` a `hasta`, y si `hasta` cae justo en uno.
 *
 * La distinción importa: un préstamo que perdió el paso al borrar un cobro
 * queda **exactamente** sobre otro vencimiento del plan. Una fecha que no cae
 * en ninguno se puso a mano, y decirle «adelantado 4 cuotas» sería inventar un
 * número: se la muestra como lo que es.
 */
function periodosEntre(
  desde: string,
  hasta: string,
  frecuencia: Frecuencia
): { periodos: number; enGrilla: boolean } {
  if (desde === hasta) return { periodos: 0, enGrilla: true };

  const adelante = hasta > desde;
  const [origen, destino] = adelante ? [desde, hasta] : [hasta, desde];

  let fecha = origen;
  for (let pasos = 1; pasos <= 240; pasos++) {
    fecha = siguienteVencimiento(fecha, frecuencia);
    if (fecha === destino) return { periodos: adelante ? pasos : -pasos, enGrilla: true };
    if (fecha > destino) return { periodos: adelante ? pasos : -pasos, enGrilla: false };
  }
  return { periodos: adelante ? 240 : -240, enGrilla: false };
}

/**
 * Los préstamos vigentes cuyo vencimiento no cierra con sus cobros.
 *
 * No los corrige: los muestra. La fecha se puede haber cambiado a mano a
 * propósito —una prórroga, un acuerdo—, así que cada uno se revisa y se decide.
 */
export function revisarVencimientos(prestamos: PrestamoConCliente[]): Desfase[] {
  const desfasados: Desfase[] = [];

  for (const prestamo of prestamos) {
    if (prestamo.estado !== "vigente") continue;

    const esperado = vencimientoEsperado(prestamo);
    if (esperado === prestamo.fecha_vencimiento) continue;

    const frecuencia = frecuenciaDe(prestamo);
    const distancia = periodosEntre(esperado, prestamo.fecha_vencimiento, frecuencia);
    desfasados.push({
      prestamoId: prestamo.id,
      cliente: prestamo.cliente?.nombre ?? "Sin nombre",
      modalidad: prestamo.modalidad,
      frecuencia,
      guardado: prestamo.fecha_vencimiento,
      esperado,
      periodos: distancia.periodos,
      enGrilla: distancia.enGrilla,
      cuotasPagadas: (prestamo.pagos ?? []).filter((p) => p.tipo === "cuota").length,
      cuotasTotal: prestamo.cuotas_total,
      seguro: prestamo.modalidad !== "mensual",
    });
  }

  return desfasados.sort(
    (a, b) => Math.abs(b.periodos) - Math.abs(a.periodos) || a.cliente.localeCompare(b.cliente)
  );
}
