import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import {
  A4, GRIS, LINEA, TINTA, VERDE,
  cargarTipografias, dibujarIsotipo, lineaDeCorte, marcaDeAguaEnBanda,
  type Tipografias,
} from "@/lib/pdf/marca";
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

// La hoja A4 se parte al medio y el recibo se imprime dos veces: uno queda
// para el inquilino y el otro, firmado, para la inmobiliaria. Así el cierre
// del mes gasta la mitad de papel y no hay que juntar dos impresiones.
const ALTO_MITAD = A4[1] / 2;
const MARGEN = 40;

const COPIAS = [
  { rotulo: "ORIGINAL — PARA EL INQUILINO", baseY: ALTO_MITAD },
  { rotulo: "COPIA — PARA LA INMOBILIARIA", baseY: 0 },
];

// Cuántos conceptos entran cómodos en media hoja. Si un recibo trae más, los
// últimos se agrupan en un renglón en vez de pisarse contra el total.
const MAX_CONCEPTOS = 8;

function dibujarMitad(
  pagina: PDFPage,
  fuentes: Tipografias,
  datos: DatosRecibo,
  baseY: number,
  rotuloCopia: string
) {
  const [ancho] = A4;
  const derecha = ancho - MARGEN;
  let y = baseY + ALTO_MITAD - 26;

  marcaDeAguaEnBanda(
    pagina,
    fuentes,
    datos.anulado ? "ANULADO" : datos.esDuplicado ? "DUPLICADO" : null,
    baseY,
    ALTO_MITAD
  );

  // ---------------------------------------------------------- encabezado --
  dibujarIsotipo(pagina, MARGEN, y - 16, 24);

  pagina.drawText("LAMELAS & CHAUMONT", {
    x: MARGEN + 46, y: y - 4, size: 12.5, font: fuentes.tituloNegrita, color: TINTA,
  });
  pagina.drawText("I N M O B I L I A R I A", {
    x: MARGEN + 47, y: y - 14, size: 6, font: fuentes.titulo, color: GRIS,
  });

  const numero = `RECIBO N.º ${datos.numero}`;
  pagina.drawText(numero, {
    x: derecha - fuentes.textoNegrita.widthOfTextAtSize(numero, 11),
    y: y - 4, size: 11, font: fuentes.textoNegrita, color: VERDE,
  });
  pagina.drawText(rotuloCopia, {
    x: derecha - fuentes.texto.widthOfTextAtSize(rotuloCopia, 6.5),
    y: y - 14, size: 6.5, font: fuentes.texto, color: GRIS,
  });

  y -= 24;
  pagina.drawLine({
    start: { x: MARGEN, y }, end: { x: derecha, y },
    thickness: 1, color: VERDE,
  });

  // ------------------------------------------------------------- partes --
  y -= 18;
  const yPartes = y;

  pagina.drawText("Recibí de", { x: MARGEN, y, size: 7, font: fuentes.texto, color: GRIS });
  pagina.drawText(datos.inquilino, {
    x: MARGEN, y: y - 14, size: 11.5, font: fuentes.textoNegrita, color: TINTA,
  });
  if (datos.documentoInquilino) {
    pagina.drawText(datos.documentoInquilino, {
      x: MARGEN, y: y - 25, size: 7.5, font: fuentes.texto, color: GRIS,
    });
  }
  pagina.drawText(datos.propiedad, {
    x: MARGEN, y: y - 38, size: 9, font: fuentes.texto, color: TINTA,
  });
  pagina.drawText(`Propietario: ${datos.propietario}`, {
    x: MARGEN, y: y - 49, size: 7.5, font: fuentes.texto, color: GRIS,
  });

  // Columna derecha con los datos del período.
  const xRotulo = 350;
  const xValor = 448;
  let yDato = yPartes;
  const datosPeriodo: [string, string][] = [
    ["Período", nombreDelPeriodo(datos.periodo)],
    ["Vencimiento", formatearFecha(datos.vencimiento)],
    ["Fecha de pago", formatearFecha(datos.fechaPago)],
    ["Forma de pago", etiqueta(datos.medioPago)],
  ];

  for (const [rotulo, valor] of datosPeriodo) {
    pagina.drawText(rotulo, { x: xRotulo, y: yDato, size: 7.5, font: fuentes.texto, color: GRIS });
    pagina.drawText(valor, { x: xValor, y: yDato, size: 8.5, font: fuentes.texto, color: TINTA });
    yDato -= 13;
  }

  // ------------------------------------------------------------ detalle --
  y -= 68;
  pagina.drawRectangle({
    x: MARGEN, y: y - 3, width: derecha - MARGEN, height: 15,
    color: rgb(0.955, 0.965, 0.955),
  });
  pagina.drawText("CONCEPTO", {
    x: MARGEN + 7, y: y + 2, size: 7, font: fuentes.textoNegrita, color: GRIS,
  });
  const rotuloImporte = "IMPORTE";
  pagina.drawText(rotuloImporte, {
    x: derecha - 7 - fuentes.textoNegrita.widthOfTextAtSize(rotuloImporte, 7),
    y: y + 2, size: 7, font: fuentes.textoNegrita, color: GRIS,
  });
  y -= 17;

  const visibles = datos.conceptos.slice(0, MAX_CONCEPTOS);
  const resto = datos.conceptos.slice(MAX_CONCEPTOS);

  for (const concepto of visibles) {
    const titulo = etiqueta(concepto.tipo);
    const detalle =
      concepto.descripcion && concepto.descripcion !== titulo
        ? ` — ${concepto.descripcion}`
        : "";

    pagina.drawText(`${titulo}${detalle}`.slice(0, 62), {
      x: MARGEN + 7, y, size: 8.5, font: fuentes.texto, color: TINTA,
    });

    const importe = formatearMoneda(concepto.monto, datos.moneda);
    pagina.drawText(importe, {
      x: derecha - 7 - fuentes.texto.widthOfTextAtSize(importe, 8.5),
      y, size: 8.5, font: fuentes.texto, color: TINTA,
    });

    y -= 14;
    pagina.drawLine({
      start: { x: MARGEN, y: y + 5 }, end: { x: derecha, y: y + 5 },
      thickness: 0.3, color: LINEA,
    });
  }

  if (resto.length > 0) {
    const suma = resto.reduce((total, c) => total + c.monto, 0);
    pagina.drawText(`Otros ${resto.length} conceptos`, {
      x: MARGEN + 7, y, size: 8.5, font: fuentes.texto, color: TINTA,
    });
    const importe = formatearMoneda(suma, datos.moneda);
    pagina.drawText(importe, {
      x: derecha - 7 - fuentes.texto.widthOfTextAtSize(importe, 8.5),
      y, size: 8.5, font: fuentes.texto, color: TINTA,
    });
    y -= 14;
  }

  // -------------------------------------------------------------- total --
  const yTotal = baseY + 78;
  pagina.drawRectangle({
    x: MARGEN, y: yTotal - 8, width: derecha - MARGEN, height: 28,
    color: rgb(0.925, 0.965, 0.935),
  });
  pagina.drawText("TOTAL RECIBIDO", {
    x: MARGEN + 9, y: yTotal + 2, size: 9.5, font: fuentes.textoNegrita, color: TINTA,
  });
  const total = formatearMoneda(datos.total, datos.moneda);
  pagina.drawText(total, {
    x: derecha - 9 - fuentes.textoNegrita.widthOfTextAtSize(total, 13),
    y: yTotal, size: 13, font: fuentes.textoNegrita, color: VERDE,
  });

  // -------------------------------------------------------------- firma --
  const yFirma = baseY + 46;
  pagina.drawLine({
    start: { x: derecha - 170, y: yFirma }, end: { x: derecha, y: yFirma },
    thickness: 0.5, color: LINEA,
  });
  pagina.drawText("Firma y sello", {
    x: derecha - 170, y: yFirma - 10, size: 7, font: fuentes.texto, color: GRIS,
  });

  pagina.drawText(
    datos.anulado
      ? "Este recibo fue anulado y no acredita pago alguno."
      : "Acredita el pago de los conceptos detallados. Conservalo como comprobante.",
    { x: MARGEN, y: yFirma - 10, size: 7, font: fuentes.texto, color: GRIS }
  );
}

export async function generarRecibo(datos: DatosRecibo): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Recibo ${datos.numero} — ${datos.inquilino}`);
  pdf.setProducer("Administración de alquileres — Lamelas & Chaumont");

  const pagina = pdf.addPage(A4);
  const fuentes = await cargarTipografias(pdf);

  for (const copia of COPIAS) {
    dibujarMitad(pagina, fuentes, datos, copia.baseY, copia.rotulo);
  }

  lineaDeCorte(pagina, fuentes, ALTO_MITAD);

  return pdf.save();
}
