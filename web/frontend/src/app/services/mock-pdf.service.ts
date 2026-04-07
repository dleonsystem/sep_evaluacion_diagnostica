import { Injectable } from '@angular/core';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface PdfExitoPayload {
  correo: string;
  contrasena: string;
  fechaDisponible: string;
  alumnosValidados: number;
  cct: string;
  fechaValidacion: string;
  consecutivo: string; // Trazabilidad CU-04v2
}

interface PdfErroresPayload {
  correo: string;
  errores: string[];
  advertencias?: string[];
  archivo: string;
}

@Injectable({ providedIn: 'root' })
export class MockPdfService {
  private readonly demoraMs = 500;

  /**
   * Genera el PDF de Éxito usando la plantilla
   */
  async generarPdfExito(payload: PdfExitoPayload, simularFallo = false): Promise<Blob> {
    return this.generarPdfDesdePlantilla(true, payload);
  }

  /**
   * Genera el PDF de Errores usando la plantilla
   */
  async generarPdfErrores(payload: PdfErroresPayload, simularFallo = false): Promise<Blob> {
    return this.generarPdfDesdePlantilla(false, payload);
  }

  /**
   * Lógica centralizada para dibujar sobre el PDF
   */
  private async generarPdfDesdePlantilla(esExito: boolean, payload: any): Promise<Blob> {
    // Pausa estética para el spinner
    await new Promise((resolve) => setTimeout(resolve, this.demoraMs));

    try {
      const response = await fetch('assets/templates/plantilla_eia.pdf');
      if (!response.ok) throw new Error('No se encontró la plantilla en assets/templates/');

      const buffer = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer);

      // Fuentes estándar
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { height } = firstPage.getSize();

      if (esExito) {
        const p = payload as PdfExitoPayload;
        const xLabel = 100; // Posición de las etiquetas
        const xValue = 220; // Posición de los datos
        let yPos = height - 165;

        const configLabel = { size: 10, font: fontBold, color: rgb(0, 0, 0) };
        const configVal = { size: 10, font: fontRegular, color: rgb(0, 0, 0) };

        // --- IMPRESIÓN DE DATOS CON ETIQUETAS ---
        firstPage.drawText('CCT:', { x: xLabel, y: yPos, ...configLabel });
        firstPage.drawText(p.cct || '', { x: xValue, y: yPos, ...configVal });

        yPos -= 20;
        firstPage.drawText('Correo electrónico:', { x: xLabel, y: yPos, ...configLabel });
        firstPage.drawText(p.correo || '', { x: xValue, y: yPos, ...configVal });

        yPos -= 20;
        firstPage.drawText('Fecha de validación:', { x: xLabel, y: yPos, ...configLabel });
        firstPage.drawText(p.fechaValidacion || '', { x: xValue, y: yPos, ...configVal });

        yPos -= 20;
        firstPage.drawText('Alumnos validados:', { x: xLabel, y: yPos, ...configLabel });
        firstPage.drawText((p.alumnosValidados || 0).toString(), { x: xValue, y: yPos, ...configVal });

        // --- BLOQUE DE CONTRASEÑA ---
        if (p.contrasena && p.contrasena !== '********') {
          yPos = height - 350;
          firstPage.drawText('CONTRASEÑA DE ACCESO:', {
            x: 160, y: yPos, size: 12, font: fontBold, color: rgb(0.41, 0.11, 0.2)
          });

          yPos -= 30;
          firstPage.drawText(p.contrasena, {
            x: 190, y: yPos, size: 22, font: fontBold, color: rgb(0.41, 0.11, 0.2)
          });
        } else {
          // Si es un usuario logueado o ya tiene credenciales previas
          yPos = height - 350;
          firstPage.drawText('SU CONTRASEÑA ES LA QUE YA TIENE REGISTRADA EN EL SISTEMA', {
            x: 100, y: yPos, size: 12, font: fontBold, color: rgb(0.41, 0.11, 0.2)
          });
          yPos -= 30; // mantener el espaciado
        }

        // --- NOTA FINAL ---
        yPos -= 60;
        firstPage.drawText(`Sus resultados estarán disponibles el: ${p.fechaDisponible}`, {
          x: 130, y: yPos, size: 11, font: fontBold
        });

      } else {
        // --- CASO DE ERRORES/INCONSISTENCIAS ---
        const p = payload as PdfErroresPayload;

        firstPage.drawText('REPORTE DE INCONSISTENCIAS DETECTADAS', {
          x: 120, y: height - 150, size: 14, font: fontBold, color: rgb(0.41, 0.11, 0.2)
        });

        firstPage.drawText(`Archivo: ${p.archivo}`, { x: 120, y: height - 180, size: 10, font: fontBold });

        let yPos = height - 210;
        // Listar los primeros 20 errores
        p.errores.slice(0, 20).forEach(err => {
          firstPage.drawText(`• ${err.substring(0, 95)}`, { x: 120, y: yPos, size: 8, font: fontRegular });
          yPos -= 12;
        });
      }

      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });

    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    }
  }

  /**
   * Método para descargar el archivo en el navegador
   */
  descargarPdf(blob: Blob, nombre: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre.toLowerCase().endsWith('.pdf') ? nombre : `${nombre}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
