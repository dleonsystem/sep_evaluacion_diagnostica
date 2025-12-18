import { Injectable } from '@angular/core';

interface PdfExitoPayload {
  correo: string;
  contrasena: string;
  fechaDisponible: string;
  alumnosValidados: number;
  cct: string;
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

  private crearPdf(contenido: string): Blob {
    const cuerpo = this.sanitizar(contenido);
    return new Blob([cuerpo], { type: 'application/pdf' });
  }

  private armarContenidoExito(payload: PdfExitoPayload): string {
    return `PDF SIMULADO\n\n` +
      `Comprobante de envío exitoso\n` +
      `CCT: ${payload.cct}\n` +
      `Correo: ${payload.correo}\n` +
      `Contraseña generada: ${payload.contrasena}\n` +
      `Fecha disponible: ${payload.fechaDisponible}\n` +
      `Total de alumnos validados: ${payload.alumnosValidados}\n` +
      `Este PDF sustituye temporalmente al emitido por FastAPI.`;
  }

  private armarContenidoErrores(payload: PdfErroresPayload): string {
    const errores = payload.errores.map((error, idx) => `${idx + 1}. ${error}`).join('\n');
    const advertencias = (payload.advertencias ?? []).map((adv) => `⚠️ ${adv}`).join('\n');
    return `PDF SIMULADO\n\n` +
      `El archivo ${payload.archivo} no pasó la validación.\n` +
      `Correo capturado: ${payload.correo || 'N/D'}\n` +
      `Errores detectados:\n${errores || 'Sin detalles'}\n` +
      (advertencias ? `\nAdvertencias:\n${advertencias}\n` : '') +
      `Corrige los puntos anteriores y vuelve a cargar el archivo.`;
  }

  private sanitizar(texto: string): string {
    return texto.replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
  }
}
