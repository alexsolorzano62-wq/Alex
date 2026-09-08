import { PDFDocument, rgb } from "pdf-lib";
import { A4, MARGEN, GRIS, LINEA, TINTA, VERDE, cargarTipografias, encabezado, marcaDeAgua, pie } from "@/lib/pdf/marca";
import { formatearMoneda } from "@/lib/dinero";
import { formatearFecha, nombreDelPeriodo } from "@/lib/fechas";
import { etiqueta } from "@/lib/types";

export type DatosLiquidacion = {
  numero: number;
  periodo: string;
  moneda: "ARS" | "USD";
  propietario: string;
  documento: string | null;
  totalCobrado: number;
  totalHonorarios: number;
  totalGastos: number;
  totalAjustes: number;
  netoAPagar: number;
  detalle: {
    descripcion: string;
    montoBruto: number;
    honorariosPorcentaje: number | null;
    honorariosMonto: number;
    neto: number;
  }[];
  metodoPago: string | null;
  fechaPago: string | null;
  conformidad: string | null;
  anulada: boolean;
};

export async function generarLiquidacion(datos: DatosLiquidacion): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Liquidación ${datos.numero} — ${datos.propietario}`);

  const pagina = pdf.addPage(A4);
  const fuentes = await cargarTipografias(pdf);
  const [ancho] = A4;
  const derecha = ancho - MARGEN;

  marcaDeAgua(pagina, fuentes, datos.anulada ? "ANULADA" : null);
  let y = encabezado(pagina, fuentes, `LIQUIDACIÓN N.º ${datos.numero}`);

  pagina.drawText("Liquidación a", { x: MARGEN, y, size: 8, font: fuentes.texto, color: GRIS });
  y -= 15;
  pagina.drawText(datos.propietario, {
    x: MARGEN, y, size: 13, font: fuentes.textoNegrita, color: TINTA,
  });

  y -= 20;
  pagina.drawText(`Período: ${nombreDelPeriodo(datos.periodo)}`, {
    x: MARGEN, y, size: 9.5, font: fuentes.texto, color: TINTA,
  });

  // ---- detalle ----
  y -= 26;
  pagina.drawRectangle({
    x: MARGEN, y: y - 4, width: ancho - MARGEN * 2, height: 20,
    color: rgb(0.96, 0.97, 0.96),
  });
  pagina.drawText("DETALLE", { x: MARGEN + 8, y: y + 3, size: 8, font: fuentes.textoNegrita, color: GRIS });
  pagina.drawText("HONORARIOS", { x: derecha - 200, y: y + 3, size: 8, font: fuentes.textoNegrita, color: GRIS });
  const rotuloNeto = "NETO";
  pagina.drawText(rotuloNeto, {
    x: derecha - 8 - fuentes.textoNegrita.widthOfTextAtSize(rotuloNeto, 8),
    y: y + 3, size: 8, font: fuentes.textoNegrita, color: GRIS,
  });
  y -= 22;

  for (const renglon of datos.detalle) {
    pagina.drawText(renglon.descripcion.slice(0, 62), {
      x: MARGEN + 8, y, size: 9, font: fuentes.texto, color: TINTA,
    });

    if (renglon.honorariosPorcentaje != null) {
      const honorarios = `${renglon.honorariosPorcentaje}% · −${formatearMoneda(renglon.honorariosMonto, datos.moneda)}`;
      pagina.drawText(honorarios, {
        x: derecha - 200, y, size: 8, font: fuentes.texto, color: GRIS,
      });
    }

    const neto = formatearMoneda(renglon.neto, datos.moneda);
    pagina.drawText(neto, {
      x: derecha - 8 - fuentes.texto.widthOfTextAtSize(neto, 9),
      y, size: 9,
      font: fuentes.texto,
      color: renglon.neto < 0 ? rgb(0.6, 0.15, 0.1) : TINTA,
    });

    y -= 17;
    pagina.drawLine({
      start: { x: MARGEN, y: y + 6 }, end: { x: derecha, y: y + 6 },
      thickness: 0.4, color: LINEA,
    });
  }

  // ---- totales ----
  y -= 14;
  const totales: [string, number][] = [
    ["Total cobrado", datos.totalCobrado],
    ["Honorarios de administración", -datos.totalHonorarios],
    ["Gastos", -datos.totalGastos],
  ];
  if (datos.totalAjustes !== 0) totales.push(["Ajustes", datos.totalAjustes]);

  for (const [rotulo, monto] of totales) {
    if (monto === 0 && rotulo === "Gastos") continue;
    pagina.drawText(rotulo, { x: derecha - 260, y, size: 9.5, font: fuentes.texto, color: GRIS });
    const texto = formatearMoneda(monto, datos.moneda);
    pagina.drawText(texto, {
      x: derecha - fuentes.texto.widthOfTextAtSize(texto, 9.5),
      y, size: 9.5, font: fuentes.texto, color: TINTA,
    });
    y -= 16;
  }

  y -= 6;
  pagina.drawRectangle({
    x: derecha - 280, y: y - 12, width: 280, height: 34,
    color: rgb(0.93, 0.97, 0.94),
  });
  pagina.drawText("NETO A TRANSFERIR", {
    x: derecha - 270, y: y + 1, size: 10, font: fuentes.textoNegrita, color: TINTA,
  });
  const neto = formatearMoneda(datos.netoAPagar, datos.moneda);
  pagina.drawText(neto, {
    x: derecha - 10 - fuentes.textoNegrita.widthOfTextAtSize(neto, 14),
    y: y - 1, size: 14, font: fuentes.textoNegrita, color: VERDE,
  });

  // ---- constancia del pago ----
  y -= 60;
  if (datos.fechaPago) {
    pagina.drawText(
      `Pagada el ${formatearFecha(datos.fechaPago)} por ${etiqueta(datos.metodoPago ?? "").toLowerCase()}.`,
      { x: MARGEN, y, size: 9, font: fuentes.texto, color: TINTA }
    );
    y -= 14;
    if (datos.conformidad) {
      pagina.drawText(datos.conformidad.slice(0, 95), {
        x: MARGEN, y, size: 8, font: fuentes.texto, color: GRIS,
      });
      y -= 14;
    }
  }

  y -= 40;
  pagina.drawLine({
    start: { x: derecha - 190, y }, end: { x: derecha, y },
    thickness: 0.6, color: LINEA,
  });
  pagina.drawText("Conforme del propietario", {
    x: derecha - 190, y: y - 12, size: 8, font: fuentes.texto, color: GRIS,
  });

  pie(
    pagina,
    fuentes,
    datos.anulada
      ? "Esta liquidación fue anulada."
      : "Los importes de esta liquidación quedaron congelados al emitirse."
  );

  return pdf.save();
}
