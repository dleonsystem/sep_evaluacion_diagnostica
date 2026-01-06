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

interface PdfContenido {
  titulo: string;
  lineas: string[];
  notas?: string[];
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

  private crearPdf(contenido: PdfContenido): Blob {
    const encoder = new TextEncoder();
    const titulo = this.sanitizarLinea(contenido.titulo);
    const lineas = contenido.lineas.map((linea) => this.sanitizarLinea(linea));
    const notas = (contenido.notas ?? []).map((nota) => this.sanitizarLinea(nota));
    const textoLineas = [...lineas, '', ...notas].filter((linea, index, arr) => {
      if (linea !== '') {
        return true;
      }
      return index < arr.length - 1 && arr[index + 1] !== '';
    });

    const contenidoTexto = this.construirTextoPdf(textoLineas, 72, 720, 12, 18);
    const encabezado = [
      'q',
      '0.38 0.07 0.20 rg',
      '0 756 612 36 re',
      'f',
      'Q',
      'BT',
      '/F1 16 Tf',
      '1 1 1 rg',
      '72 770 Td',
      `(${this.escaparTextoPdf(titulo)}) Tj`,
      'ET'
    ].join('\n');

    const stream = `${encabezado}\n${contenidoTexto}\n`;
    const streamBytes = this.encodeLatin1(stream);
    const objects: Uint8Array[] = [];

    const pushObject = (texto: string): void => {
      objects.push(encoder.encode(texto));
    };

    pushObject(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
    pushObject(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);
    pushObject(
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
    );
    pushObject(
      `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`
    );

    const contenidoHeader = encoder.encode(`5 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`);
    const contenidoFooter = encoder.encode(`\nendstream\nendobj\n`);
    const contenidoObject = this.concatBytes([contenidoHeader, streamBytes, contenidoFooter]);
    objects.push(contenidoObject);

    const partes: Uint8Array[] = [];
    const offsets: number[] = [0];
    let offset = 0;

    const pushBytes = (bytes: Uint8Array): void => {
      partes.push(bytes);
      offset += bytes.length;
    };

    pushBytes(encoder.encode('%PDF-1.4\n'));
    objects.forEach((obj) => {
      offsets.push(offset);
      pushBytes(obj);
    });

    const xrefOffset = offset;
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((objOffset) => {
      xref += `${objOffset.toString().padStart(10, '0')} 00000 n \n`;
    });
    pushBytes(encoder.encode(xref));
    pushBytes(
      encoder.encode(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`)
    );

    return new Blob(partes, { type: 'application/pdf' });
  }

  private armarContenidoExito(payload: PdfExitoPayload): PdfContenido {
    return {
      titulo: 'Comprobante de validación',
      lineas: [
        'Archivo validado correctamente.',
        `Fecha disponible para resultados: ${payload.fechaDisponible}`,
        `CCT: ${payload.cct}`,
        `Usuario (correo registrado): ${payload.correo}`,
        `Contraseña generada: ${payload.contrasena}`,
        `Marca de tiempo de validación: ${payload.fechaValidacion}`,
        `Total de alumnos validados: ${payload.alumnosValidados}`
      ],
      notas: ['Este PDF sustituye temporalmente al emitido por FastAPI.']
    };
  }

  private armarContenidoErrores(payload: PdfErroresPayload): PdfContenido {
    const errores = payload.errores.length
      ? payload.errores.map((error, idx) => `${idx + 1}. ${error}`)
      : ['Sin detalles'];
    const advertencias = (payload.advertencias ?? []).map((adv) => `⚠️ ${adv}`);
    return {
      titulo: 'Reporte de errores',
      lineas: [
        `El archivo ${payload.archivo} no pasó la validación.`,
        `Correo capturado: ${payload.correo || 'N/D'}`,
        'Errores detectados:',
        ...errores,
        ...(advertencias.length ? ['Advertencias:', ...advertencias] : [])
      ],
      notas: ['Corrige los puntos anteriores y vuelve a cargar el archivo.']
    };
  }

  private sanitizarLinea(texto: string): string {
    return texto.normalize('NFC').replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
  }

  private escaparTextoPdf(texto: string): string {
    return texto.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  private construirTextoPdf(
    lineas: string[],
    margenX: number,
    margenY: number,
    fontSize: number,
    lineHeight: number
  ): string {
    const segmentos = lineas.map((linea) => this.escaparTextoPdf(linea));
    const piezas: string[] = [];
    piezas.push('BT');
    piezas.push(`/F1 ${fontSize} Tf`);
    piezas.push('0 0 0 rg');
    piezas.push(`${lineHeight} TL`);
    piezas.push(`${margenX} ${margenY} Td`);
    segmentos.forEach((segmento, index) => {
      if (index === 0) {
        if (segmento) {
          piezas.push(`(${segmento}) Tj`);
        }
        return;
      }
      piezas.push('T*');
      if (segmento) {
        piezas.push(`(${segmento}) Tj`);
      }
    });
    piezas.push('ET');
    return piezas.join('\n');
  }

  private encodeLatin1(texto: string): Uint8Array {
    const bytes = new Uint8Array(texto.length);
    for (let i = 0; i < texto.length; i += 1) {
      const code = texto.charCodeAt(i);
      bytes[i] = code <= 255 ? code : 63;
    }
    return bytes;
  }

  private concatBytes(partes: Uint8Array[]): Uint8Array {
    const total = partes.reduce((sum, parte) => sum + parte.length, 0);
    const resultado = new Uint8Array(total);
    let offset = 0;
    partes.forEach((parte) => {
      resultado.set(parte, offset);
      offset += parte.length;
    });
    return resultado;
  }

  private escaparTextoPdf(texto: string): string {
    return texto.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  private construirTextoPdf(
    lineas: string[],
    margenX: number,
    margenY: number,
    fontSize: number,
    lineHeight: number
  ): string {
    const segmentos = lineas.map((linea) => this.escaparTextoPdf(linea));
    const piezas: string[] = [];
    piezas.push('BT');
    piezas.push(`/F1 ${fontSize} Tf`);
    piezas.push('0 0 0 rg');
    piezas.push(`${lineHeight} TL`);
    piezas.push(`${margenX} ${margenY} Td`);
    segmentos.forEach((segmento, index) => {
      if (index === 0) {
        if (segmento) {
          piezas.push(`(${segmento}) Tj`);
        }
        return;
      }
      piezas.push('T*');
      if (segmento) {
        piezas.push(`(${segmento}) Tj`);
      }
    });
    piezas.push('ET');
    return piezas.join('\n');
  }

  private encodeLatin1(texto: string): Uint8Array {
    const bytes = new Uint8Array(texto.length);
    for (let i = 0; i < texto.length; i += 1) {
      const code = texto.charCodeAt(i);
      bytes[i] = code <= 255 ? code : 63;
    }
    return bytes;
  }

  private concatBytes(partes: Uint8Array[]): Uint8Array {
    const total = partes.reduce((sum, parte) => sum + parte.length, 0);
    const resultado = new Uint8Array(total);
    let offset = 0;
    partes.forEach((parte) => {
      resultado.set(parte, offset);
      offset += parte.length;
    });
    return resultado;
  }
}
