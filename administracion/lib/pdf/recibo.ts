import { PDFDocument, rgb } from "pdf-lib";
import { A4, MARGEN, GRIS, LINEA, TINTA, VERDE, cargarTipografias, encabezado, marcaDeAgua, pie } from "@/lib/pdf/marca";
import { formatearMoneda } from "@/lib/dinero";
import { formatearFecha, nombreDelPeriodo } from "@/lib/fechas";
import { etiqueta } from "@/lib/types";

export type DatosRecibo = {
  numero: number;
  periodo: string;
  fechaPago: string;
  vencimiento: string;
  medioPago: string;
  moneda: "ARS" | "USD";
  total: number;
  inquilino: string;
  documentoInquilino: string | null;
  propiedad: string;
  propietario: string;
  conceptos: { tipo: string; descripcion: string | null; monto: number }[];
  // Primera emisión: sin leyenda. De la segunda en adelante: DUPLICADO.
  esDuplicado: boolean;
  anulado: boolean;
};

export async function generarRecibo(datos: DatosRecibo): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Recibo ${datos.numero} — ${datos.inquilino}`);
  pdf.setProducer("Administración de alquileres — Lamelas & Chaumont");

  const pagina = pdf.addPage(A4);
  const fuentes = await cargarTipografias(pdf);
  const [ancho] = A4;

  marcaDeAgua(
    pagina,
    fuentes,
    datos.anulado ? "ANULADO" : datos.esDuplicado ? "DUPLICADO" : null
  );

  let y = encabezado(pagina, fuentes, `RECIBO N.º ${datos.numero}`);

  // ---- a quién y por qué ----
  pagina.drawText("Recibí de", { x: MARGEN, y, size: 8, font: fuentes.texto, color: GRIS });
  y -= 15;
  pagina.drawText(datos.inquilino, {
    x: MARGEN, y, size: 13, font: fuentes.textoNegrita, color: TINTA,
  });
  if (datos.documentoInquilino) {
    pagina.drawText(datos.documentoInquilino, {
      x: MARGEN + fuentes.textoNegrita.widthOfTextAtSize(datos.inquilino, 13) + 10,
      y, size: 9, font: fuentes.texto, color: GRIS,
    });
  }

  y -= 26;
  const filas: [string, string][] = [
    ["Inmueble", datos.propiedad],
    ["Propietario", datos.propietario],
    ["Período", nombreDelPeriodo(datos.periodo)],
    ["Vencimiento", formatearFecha(datos.vencimiento)],
    ["Fecha de pago", formatearFecha(datos.fechaPago)],
    ["Forma de pago", etiqueta(datos.medioPago)],
  ];

  for (const [rotulo, valor] of filas) {
    pagina.drawText(rotulo, { x: MARGEN, y, size: 9, font: fuentes.texto, color: GRIS });
    pagina.drawText(valor, {
      x: MARGEN + 95, y, size: 9.5, font: fuentes.texto, color: TINTA,
    });
    y -= 15;
  }

  // ---- detalle ----
  y -= 12;
  pagina.drawRectangle({
    x: MARGEN, y: y - 4, width: ancho - MARGEN * 2, height: 20,
    color: rgb(0.96, 0.97, 0.96),
  });
  pagina.drawText("CONCEPTO", {
    x: MARGEN + 8, y: y + 3, size: 8, font: fuentes.textoNegrita, color: GRIS,
  });
  pagina.drawText("IMPORTE", {
    x: ancho - MARGEN - 8 - fuentes.textoNegrita.widthOfTextAtSize("IMPORTE", 8),
    y: y + 3, size: 8, font: fuentes.textoNegrita, color: GRIS,
  });
  y -= 24;

  for (const concepto of datos.conceptos) {
    const titulo = etiqueta(concepto.tipo);
    pagina.drawText(titulo, { x: MARGEN + 8, y, size: 10, font: fuentes.texto, color: TINTA });

    if (concepto.descripcion && concepto.descripcion !== titulo) {
      pagina.drawText(concepto.descripcion.slice(0, 70), {
        x: MARGEN + 8, y: y - 11, size: 8, font: fuentes.texto, color: GRIS,
      });
    }

    const importe = formatearMoneda(concepto.monto, datos.moneda);
    pagina.drawText(importe, {
      x: ancho - MARGEN - 8 - fuentes.texto.widthOfTextAtSize(importe, 10),
      y, size: 10, font: fuentes.texto, color: TINTA,
    });

    y -= concepto.descripcion && concepto.descripcion !== titulo ? 26 : 18;

    pagina.drawLine({
      start: { x: MARGEN, y: y + 6 }, end: { x: ancho - MARGEN, y: y + 6 },
      thickness: 0.4, color: LINEA,
    });
  }

  // ---- total ----
  y -= 10;
  pagina.drawRectangle({
    x: MARGEN, y: y - 10, width: ancho - MARGEN * 2, height: 34,
    color: rgb(0.93, 0.97, 0.94),
  });
  pagina.drawText("TOTAL RECIBIDO", {
    x: MARGEN + 10, y: y + 3, size: 11, font: fuentes.textoNegrita, color: TINTA,
  });
  const total = formatearMoneda(datos.total, datos.moneda);
  pagina.drawText(total, {
    x: ancho - MARGEN - 10 - fuentes.textoNegrita.widthOfTextAtSize(total, 15),
    y: y, size: 15, font: fuentes.textoNegrita, color: VERDE,
  });

  // ---- firma ----
  y -= 90;
  pagina.drawLine({
    start: { x: ancho - MARGEN - 190, y }, end: { x: ancho - MARGEN, y },
    thickness: 0.6, color: LINEA,
  });
  pagina.drawText("Firma y sello", {
    x: ancho - MARGEN - 190, y: y - 12, size: 8, font: fuentes.texto, color: GRIS,
  });

  pie(
    pagina,
    fuentes,
    datos.anulado
      ? "Este recibo fue anulado y no acredita pago alguno."
      : "Este recibo acredita el pago de los conceptos detallados. Conservalo como comprobante."
  );

  return pdf.save();
}
