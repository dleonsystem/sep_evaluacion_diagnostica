import { Injectable } from '@angular/core';

interface PdfExitoPayload {
  correo: string;
  contrasena: string;
  fechaDisponible: string;
  alumnosValidados: number;
  cct: string;
  fechaValidacion: string;
}

interface PdfErroresPayload {
  correo: string;
  errores: string[];
  advertencias?: string[];
  archivo: string;
}

@Injectable({ providedIn: 'root' })
export class MockPdfService {
  private readonly probabilidadFalloRed = 0.2;
  private readonly demoraMs = 900;

  async generarPdfExito(payload: PdfExitoPayload, simularFallo = true): Promise<Blob> {
    await this.simularLlamada(simularFallo);
    const contenido = this.armarContenidoExito(payload);
    return this.crearPdf(contenido);
  }

  async generarPdfErrores(payload: PdfErroresPayload, simularFallo = true): Promise<Blob> {
    await this.simularLlamada(simularFallo);
    const contenido = this.armarContenidoErrores(payload);
    return this.crearPdf(contenido);
  }

  descargarPdf(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  private async simularLlamada(simularFallo: boolean): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.demoraMs));
    const fallo = simularFallo && Math.random() < this.probabilidadFalloRed;
    if (fallo) {
      throw new Error('Fallo de red simulado. Intenta nuevamente.');
    }
  }

  private crearPdf(contenido: string[]): Blob {
    const lineas = contenido.map((linea) => this.sanitizarLinea(linea));
    const encoder = new TextEncoder();
    const lineHeight = 16;
    const fontSize = 12;
    const margenX = 72;
    const margenY = 760;
    const texto = lineas
      .map((linea, index) => {
        const textoEscapado = this.escaparTextoPdf(linea);
        if (index === 0) {
          return `(${textoEscapado}) Tj`;
        }
        return `T*\n(${textoEscapado}) Tj`;
      })
      .join('\n');

    const stream = `BT\n/F1 ${fontSize} Tf\n${lineHeight} TL\n${margenX} ${margenY} Td\n${texto}\nET\n`;
    const objects = [
      `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
      `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
      `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
      `5 0 obj\n<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream\nendobj\n`
    ];

    const partes: Uint8Array[] = [];
    const offsets: number[] = [0];
    let offset = 0;

    const pushTexto = (texto: string): void => {
      const data = encoder.encode(texto);
      partes.push(data);
      offset += data.length;
    };

    pushTexto('%PDF-1.4\n');
    objects.forEach((obj) => {
      offsets.push(offset);
      pushTexto(obj);
    });

    const xrefOffset = offset;
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((objOffset) => {
      xref += `${objOffset.toString().padStart(10, '0')} 00000 n \n`;
    });
    pushTexto(xref);
    pushTexto(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

    return new Blob(partes, { type: 'application/pdf' });
  }

  private armarContenidoExito(payload: PdfExitoPayload): string[] {
    return [
      'Archivo validado correctamente.',
      `Fecha disponible para resultados: ${payload.fechaDisponible}`,
      `Usuario (CCT): ${payload.cct}`,
      `Contraseña (correo validado): ${payload.correo}`,
      `Marca de tiempo de validación: ${payload.fechaValidacion}`,
      `Total de alumnos validados: ${payload.alumnosValidados}`,
      'Este PDF sustituye temporalmente al emitido por FastAPI.'
    ];
  }

  private armarContenidoErrores(payload: PdfErroresPayload): string[] {
    const errores = payload.errores.length
      ? payload.errores.map((error, idx) => `${idx + 1}. ${error}`)
      : ['Sin detalles'];
    const advertencias = (payload.advertencias ?? []).map((adv) => `⚠️ ${adv}`);
    return [
      `El archivo ${payload.archivo} no pasó la validación.`,
      `Correo capturado: ${payload.correo || 'N/D'}`,
      'Errores detectados:',
      ...errores,
      ...(advertencias.length ? ['Advertencias:', ...advertencias] : []),
      'Corrige los puntos anteriores y vuelve a cargar el archivo.'
    ];
  }

  private sanitizarLinea(texto: string): string {
    return texto.replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
  }

  private escaparTextoPdf(texto: string): string {
    return texto.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }
}
