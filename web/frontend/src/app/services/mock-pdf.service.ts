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
  hashArchivo?: string; // Sello Digital (Issue #260)
}

export interface GrupoErrores {
  hoja: string;
  ubicaciones: Array<{
    titulo: string;
    items: string[];
  }>;
}

interface PdfErroresPayload {
  correo: string;
  erroresAgrupados: GrupoErrores[];
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

      const pagesList = pdfDoc.getPages();
      const firstPageTemplate = pagesList[0];
      const { width, height } = firstPageTemplate.getSize();

      // Embeber la primera página (limpia) para usarla como fondo en todas las páginas del reporte
      const [backgroundPage] = await pdfDoc.embedPages([firstPageTemplate]);

      // Crear la primera página real del reporte que usaremos para dibujar
      let currentPage = pdfDoc.addPage([width, height]);
      currentPage.drawPage(backgroundPage, { x: 0, y: 0, width, height });

      if (esExito) {
        const p = payload as PdfExitoPayload;
        const xLabel = 100; // Posición de las etiquetas
        const xValue = 220; // Posición de los datos
        let yPos = height - 165;

        const configLabel = { size: 10, font: fontBold, color: rgb(0, 0, 0) };
        const configVal = { size: 10, font: fontRegular, color: rgb(0, 0, 0) };

        // --- IMPRESIÓN DE DATOS CON ETIQUETAS ---
        currentPage.drawText('CCT:', { x: xLabel, y: yPos, ...configLabel });
        currentPage.drawText(p.cct || '', { x: xValue, y: yPos, ...configVal });

        yPos -= 20;
        currentPage.drawText('Correo electrónico:', { x: xLabel, y: yPos, ...configLabel });
        currentPage.drawText(p.correo || '', { x: xValue, y: yPos, ...configVal });

        yPos -= 20;
        currentPage.drawText('Fecha de validación:', { x: xLabel, y: yPos, ...configLabel });
        currentPage.drawText(p.fechaValidacion || '', { x: xValue, y: yPos, ...configVal });

        yPos -= 20;
        currentPage.drawText('Estudiantes validados:', { x: 170, y: yPos, size: 11, font: fontBold });
        currentPage.drawText(`${p.alumnosValidados}`, { x: 370, y: yPos, size: 11, font: fontRegular });

        // --- SELLO DIGITAL (HASH) ---
        if (p.hashArchivo) {
          yPos -= 30;
          currentPage.drawText('Sello Digital (SHA256):', { x: 170, y: yPos, size: 11, font: fontBold });
          currentPage.drawText(p.hashArchivo.substring(0, 32), { x: 370, y: yPos, size: 8, font: fontRegular });
          yPos -= 12;
          currentPage.drawText(p.hashArchivo.substring(32), { x: 370, y: yPos, size: 8, font: fontRegular });
        }

        // --- CONTRASEÑA ---
        if (p.contrasena && p.contrasena !== '********') {
          yPos = height - 350;
          currentPage.drawText('CONTRASEÑA DE ACCESO:', {
            x: 160, y: yPos, size: 12, font: fontBold, color: rgb(0.41, 0.11, 0.2)
          });

          yPos -= 30;
          currentPage.drawText(p.contrasena, {
            x: 190, y: yPos, size: 22, font: fontBold, color: rgb(0.41, 0.11, 0.2)
          });
        } else {
          // Si es un usuario logueado o ya tiene credenciales previas
          yPos = height - 350;
          currentPage.drawText('SU CONTRASEÑA ES LA QUE YA TIENE REGISTRADA EN EL SISTEMA', {
            x: 100, y: yPos, size: 12, font: fontBold, color: rgb(0.41, 0.11, 0.2)
          });
          yPos -= 30; // mantener el espaciado
        }

        // --- NOTA FINAL ---
        yPos -= 60;
        currentPage.drawText(`Sus resultados estarán disponibles el: ${p.fechaDisponible}`, {
          x: 130, y: yPos, size: 11, font: fontBold
        });
      } else {
        const p = payload as PdfErroresPayload;
        const lineSpacing = 12;

        const dibujarCabecera = () => {
          currentPage.drawText('REPORTE DE INCONSISTENCIAS DETECTADAS', {
            x: 120, y: height - 120, size: 14, font: fontBold, color: rgb(0.41, 0.11, 0.2)
          });
          currentPage.drawText(`Archivo: ${p.archivo}`, { x: 120, y: height - 150, size: 10, font: fontBold });
        };

        // Función auxiliar para manejar el salto de página con fondo institucional
        const manejarSaltoPagina = async () => {
          if (yPos < 70) {
            currentPage = pdfDoc.addPage([width, height]);
            currentPage.drawPage(backgroundPage, { x: 0, y: 0, width, height });
            dibujarCabecera();
            yPos = height - 180;
            return true;
          }
          return false;
        };

        // Dibujar cabecera en la primera página
        dibujarCabecera();
        let yPos = height - 180;
        const marginX = 80;

        for (const grupo of p.erroresAgrupados) {
          await manejarSaltoPagina();

          const tituloHoja = grupo.hoja === 'General' ? 'General' : `Hoja ${grupo.hoja}`;
          currentPage.drawText(tituloHoja, { x: marginX, y: yPos, size: 9, font: fontBold });
          yPos -= lineSpacing + 2;

          for (const ubicacion of grupo.ubicaciones) {
            await manejarSaltoPagina();

            currentPage.drawText(ubicacion.titulo, { x: marginX + 10, y: yPos, size: 8, font: fontBold, color: rgb(0, 0.4, 0.4) });
            yPos -= lineSpacing;

            for (const item of ubicacion.items) {
              await manejarSaltoPagina();

              // Dibujar punto y texto (con wrap manual simple si es muy largo)
              const text = `• ${item}`;
              const maxLength = 100;
              if (text.length > maxLength) {
                 currentPage.drawText(text.substring(0, maxLength), { x: marginX + 20, y: yPos, size: 8, font: fontRegular });
                 yPos -= lineSpacing;
                 currentPage.drawText(text.substring(maxLength), { x: marginX + 28, y: yPos, size: 8, font: fontRegular });
              } else {
                 currentPage.drawText(text, { x: marginX + 20, y: yPos, size: 8, font: fontRegular });
              }
              yPos -= lineSpacing;
            }
            yPos -= 4; // Espacio entre ubicaciones
          }
          yPos -= 8; // Espacio entre grupos
        }
      }


      pdfDoc.removePage(0); // Eliminar la hoja original de la plantilla para que no aparezca al inicio
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
