import { PDFDocument, PDFFont, PDFPage, StandardFonts, degrees, rgb } from "pdf-lib";

export const VERDE = rgb(0.102, 0.607, 0.243);   // el verde del logo
export const TINTA = rgb(0.09, 0.13, 0.12);
export const GRIS = rgb(0.45, 0.45, 0.44);
export const LINEA = rgb(0.85, 0.85, 0.84);

export const A4: [number, number] = [595.28, 841.89];
export const MARGEN = 48;

export type Tipografias = {
  titulo: PDFFont;
  tituloNegrita: PDFFont;
  texto: PDFFont;
  textoNegrita: PDFFont;
};

export async function cargarTipografias(pdf: PDFDocument): Promise<Tipografias> {
  const [titulo, tituloNegrita, texto, textoNegrita] = await Promise.all([
    pdf.embedFont(StandardFonts.TimesRoman),
    pdf.embedFont(StandardFonts.TimesRomanBold),
    pdf.embedFont(StandardFonts.Helvetica),
    pdf.embedFont(StandardFonts.HelveticaBold),
  ]);
  return { titulo, tituloNegrita, texto, textoNegrita };
}

// El isotipo del logo, dibujado en vectores para que salga nítido a cualquier
// tamaño y el PDF siga pesando poco.
export function dibujarIsotipo(pagina: PDFPage, x: number, y: number, alto: number) {
  const escala = alto / 60;
  const torres = [
    { dx: 0, alto: 34 },
    { dx: 10, alto: 46 },
    { dx: 20, alto: 54 },
    { dx: 30, alto: 46 },
    { dx: 40, alto: 34 },
  ];

  for (const torre of torres) {
    pagina.drawRectangle({
      x: x + torre.dx * escala,
      y: y + 10 * escala,
      width: 6 * escala,
      height: torre.alto * escala,
      color: VERDE,
    });
  }

  // La base en rombo.
  pagina.drawLine({
    start: { x: x - 8 * escala, y: y + 10 * escala },
    end: { x: x + 23 * escala, y: y - 2 * escala },
    thickness: 1.6 * escala,
    color: VERDE,
  });
  pagina.drawLine({
    start: { x: x + 23 * escala, y: y - 2 * escala },
    end: { x: x + 54 * escala, y: y + 10 * escala },
    thickness: 1.6 * escala,
    color: VERDE,
  });
}

export function encabezado(
  pagina: PDFPage,
  fuentes: Tipografias,
  subtitulo: string
): number {
  const [ancho, alto] = A4;
  const y = alto - MARGEN;

  dibujarIsotipo(pagina, MARGEN, y - 30, 34);

  pagina.drawText("LAMELAS & CHAUMONT", {
    x: MARGEN + 62,
    y: y - 14,
    size: 16,
    font: fuentes.tituloNegrita,
    color: TINTA,
  });
  pagina.drawText("I N M O B I L I A R I A", {
    x: MARGEN + 63,
    y: y - 27,
    size: 7.5,
    font: fuentes.titulo,
    color: GRIS,
  });

  pagina.drawText(subtitulo, {
    x: ancho - MARGEN - fuentes.textoNegrita.widthOfTextAtSize(subtitulo, 10),
    y: y - 14,
    size: 10,
    font: fuentes.textoNegrita,
    color: VERDE,
  });

  pagina.drawLine({
    start: { x: MARGEN, y: y - 42 },
    end: { x: ancho - MARGEN, y: y - 42 },
    thickness: 1.2,
    color: VERDE,
  });

  return y - 70;
}

// La marca de agua: el nombre de la inmobiliaria repetido en diagonal, muy
// tenue. Si el documento es una reimpresión, se agrega la leyenda DUPLICADO
// bien visible, para que no se presente dos veces como si fueran dos pagos.
export function marcaDeAgua(
  pagina: PDFPage,
  fuentes: Tipografias,
  leyenda: string | null
) {
  const [ancho, alto] = A4;

  for (let fila = 0; fila < 6; fila++) {
    for (let columna = 0; columna < 3; columna++) {
      pagina.drawText("LAMELAS & CHAUMONT", {
        x: 20 + columna * 210,
        y: 90 + fila * 135,
        size: 15,
        font: fuentes.tituloNegrita,
        color: VERDE,
        opacity: 0.05,
        rotate: degrees(30),
      });
    }
  }

  if (leyenda) {
    const tamano = 62;
    const anchoTexto = fuentes.tituloNegrita.widthOfTextAtSize(leyenda, tamano);
    pagina.drawText(leyenda, {
      x: (ancho - anchoTexto * 0.78) / 2,
      y: alto / 2 - 120,
      size: tamano,
      font: fuentes.tituloNegrita,
      color: rgb(0.7, 0.15, 0.1),
      opacity: 0.16,
      rotate: degrees(38),
    });
  }
}

export function pie(pagina: PDFPage, fuentes: Tipografias, texto: string) {
  const [ancho] = A4;
  pagina.drawLine({
    start: { x: MARGEN, y: MARGEN + 26 },
    end: { x: ancho - MARGEN, y: MARGEN + 26 },
    thickness: 0.5,
    color: LINEA,
  });
  pagina.drawText(texto, {
    x: MARGEN,
    y: MARGEN + 12,
    size: 7.5,
    font: fuentes.texto,
    color: GRIS,
  });
}
