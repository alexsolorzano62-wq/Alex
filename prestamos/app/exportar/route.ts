import { traerClientes, traerPagos, traerPrestamos } from "@/lib/datos";
import { numerarCuotas, resumen } from "@/lib/calc";
import { hoyISO } from "@/lib/fechas";
import { descripcionPlan } from "@/lib/format";

/**
 * Baja los datos como CSV, para tener una copia a mano y poder abrirla en Excel.
 *
 * Separador `;` y BOM al principio: es lo que hace que Excel en español abra el
 * archivo en columnas y muestre bien los acentos, en vez de una sola columna
 * con caracteres rotos.
 */
function csv(filas: (string | number)[][]): string {
  const escapar = (valor: string | number) => {
    const texto = String(valor ?? "");
    return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  return "﻿" + filas.map((fila) => fila.map(escapar).join(";")).join("\r\n");
}

export async function GET(request: Request) {
  const que = new URL(request.url).searchParams.get("que") ?? "prestamos";
  const hoy = hoyISO();

  let nombre: string;
  let filas: (string | number)[][];

  if (que === "clientes") {
    nombre = "clientes";
    const clientes = await traerClientes();
    filas = [
      ["Nombre", "WhatsApp", "Notas", "Alta"],
      ...clientes.map((c) => [c.nombre, c.telefono ?? "", c.notas ?? "", c.created_at.slice(0, 10)]),
    ];
  } else if (que === "cobros") {
    nombre = "cobros";
    const pagos = await traerPagos();

    // Los cobros vienen de todos los préstamos, así que se numeran por préstamo.
    const porPrestamo = new Map<string, typeof pagos>();
    for (const pago of pagos) {
      const id = pago.prestamo?.id ?? pago.prestamo_id;
      porPrestamo.set(id, [...(porPrestamo.get(id) ?? []), pago]);
    }
    const numeros = new Map<string, number>();
    for (const delPrestamo of porPrestamo.values()) {
      for (const [id, numero] of numerarCuotas(delPrestamo)) numeros.set(id, numero);
    }

    filas = [
      ["Fecha", "Cliente", "Tipo", "Cuota", "Monto", "Nota"],
      ...pagos.map((p) => [
        p.fecha,
        p.prestamo?.cliente?.nombre ?? "",
        p.tipo,
        numeros.get(p.id) ?? "",
        p.monto,
        p.nota ?? "",
      ]),
    ];
  } else {
    nombre = "prestamos";
    const prestamos = await traerPrestamos();
    filas = [
      ["Cliente", "Modalidad", "Prestado", "Plan", "A devolver", "Cobrado", "Inicio", "Vence", "Estado", "Cuotas atrasadas", "Observación"],
      ...prestamos.map((prestamo) => {
        const datos = resumen(prestamo, prestamo.pagos ?? [], hoy);
        return [
          prestamo.cliente?.nombre ?? "",
          prestamo.modalidad,
          prestamo.capital_inicial,
          descripcionPlan(prestamo, datos),
          datos.aDevolver,
          datos.cobrado,
          prestamo.fecha_inicio,
          prestamo.fecha_vencimiento,
          prestamo.estado,
          datos.cuotasAtrasadas,
          prestamo.observacion ?? "",
        ];
      }),
    ];
  }

  return new Response(csv(filas), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}-${hoy}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
