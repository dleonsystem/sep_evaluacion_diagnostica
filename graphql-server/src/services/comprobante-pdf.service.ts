import path from 'path';
import pdfmake from 'pdfmake';

type PdfDocument = {
  getBuffer(): Promise<Buffer>;
};

type PdfMakeInstance = {
  createPdf(docDefinition: Record<string, unknown>, options?: Record<string, unknown>): PdfDocument;
  setFonts(fonts: Record<string, Record<string, string>>): void;
  setUrlAccessPolicy(callback: (url: string) => boolean): void;
};

const pdfmakeInstance = pdfmake as unknown as PdfMakeInstance;

let fontsConfigured = false;

function ensurePdfFonts(): void {
  if (fontsConfigured) {
    return;
  }

  const fontsBasePath = path.resolve(process.cwd(), 'node_modules/pdfmake/fonts/Roboto');

  pdfmakeInstance.setFonts({
    Roboto: {
      normal: path.join(fontsBasePath, 'Roboto-Regular.ttf'),
      bold: path.join(fontsBasePath, 'Roboto-Medium.ttf'),
      italics: path.join(fontsBasePath, 'Roboto-Italic.ttf'),
      bolditalics: path.join(fontsBasePath, 'Roboto-MediumItalic.ttf'),
    },
  });
  // El método setUrlAccessPolicy no está disponible en la versión de Node de pdfmake ^0.3.x
  // pdfmakeInstance.setUrlAccessPolicy(() => false);

  fontsConfigured = true;
}

export interface ComprobantePdfData {
  consecutivo: string;
  fechaCarga: Date | string;
  archivoOriginal: string;
  hashArchivo: string;
  cct: string;
  email: string;
  generadoEn?: Date;
}

export class ComprobantePdfService {
  async generarBase64(data: ComprobantePdfData): Promise<string> {
    ensurePdfFonts();

    const fechaRecepcion = this.formatearFecha(data.fechaCarga);
    const fechaGeneracion = this.formatearFecha(data.generadoEn ?? new Date());

    const docDefinition = {
      info: {
        title: `Comprobante_${data.consecutivo}.pdf`,
        author: 'SEP - Evaluacion Diagnostica',
        subject: 'Comprobante de recepcion EIA',
        keywords: 'SEP,EIA,comprobante,recepcion',
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
        color: '#1f2937',
      },
      content: [
        {
          canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 42, color: '#611232' }],
          margin: [0, 0, 0, 14],
        },
        {
          text: 'COMPROBANTE DE RECEPCION EIA',
          color: '#ffffff',
          bold: true,
          fontSize: 16,
          absolutePosition: { x: 48, y: 48 },
        },
        {
          text: 'Secretaria de Educacion Publica',
          color: '#ffffff',
          fontSize: 10,
          absolutePosition: { x: 48, y: 68 },
        },
        {
          text: 'Este documento certifica la recepcion del archivo en la plataforma SiRVER.',
          margin: [0, 26, 0, 18],
          lineHeight: 1.3,
        },
        {
          table: {
            widths: [180, '*'],
            body: [
              [this.celdaEtiqueta('Folio / Consecutivo'), this.celdaValor(data.consecutivo)],
              [this.celdaEtiqueta('Fecha de recepcion'), this.celdaValor(fechaRecepcion)],
              [this.celdaEtiqueta('Fecha de emision'), this.celdaValor(fechaGeneracion)],
              [this.celdaEtiqueta('CCT'), this.celdaValor(data.cct)],
              [this.celdaEtiqueta('Usuario'), this.celdaValor(data.email)],
              [this.celdaEtiqueta('Archivo recibido'), this.celdaValor(data.archivoOriginal)],
              [this.celdaEtiqueta('Hash SHA-256'), this.celdaValor(data.hashArchivo, true)],
            ],
          },
          layout: {
            fillColor: (
              rowIndex: number,
              _node: { table: { body: unknown[][] } },
              columnIndex: number
            ) => {
              if (columnIndex === 0) {
                return '#f6eddc';
              }

              return rowIndex % 2 === 0 ? '#ffffff' : '#fafafa';
            },
            hLineColor: () => '#d1d5db',
            vLineColor: () => '#d1d5db',
            paddingTop: () => 8,
            paddingBottom: () => 8,
            paddingLeft: () => 10,
            paddingRight: () => 10,
          },
        },
        {
          text: 'Validez operativa: el comprobante confirma la recepcion del archivo y su trazabilidad dentro del sistema.',
          margin: [0, 18, 0, 6],
          italics: true,
          lineHeight: 1.3,
        },
        {
          text: 'Para seguimiento posterior, conserva este PDF junto con el folio asignado.',
          color: '#4b5563',
          lineHeight: 1.3,
        },
      ],
      pageMargins: [40, 40, 40, 48],
    };

    const document = pdfmakeInstance.createPdf(docDefinition);
    const buffer = await document.getBuffer();
    return buffer.toString('base64');
  }

  private celdaEtiqueta(texto: string) {
    return {
      text: texto,
      bold: true,
      color: '#13322e',
    };
  }

  private celdaValor(texto: string, monospace = false) {
    return {
      text: texto,
      fontSize: monospace ? 9 : 10,
      font: 'Roboto',
      noWrap: false,
    };
  }

  private formatearFecha(value: Date | string): string {
    const fecha = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(fecha.getTime())) {
      return 'Fecha no disponible';
    }

    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'America/Mexico_City',
    }).format(fecha);
  }
}

export const comprobantePdfService = new ComprobantePdfService();
