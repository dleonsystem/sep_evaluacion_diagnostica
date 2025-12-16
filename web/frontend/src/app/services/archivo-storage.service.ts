import { Injectable } from '@angular/core';

export interface RegistroArchivo {
  nombre: string;
  tamano: number;
  fechaGuardado: string;
  ruta: string;
  contenidoBase64: string;
  hash: string;
  cct?: string;
  correo?: string;
}

export interface ResultadoGuardado {
  rutaVirtual: string;
  fechaGuardado: Date;
  tamano: number;
  modo: 'localStorage';
  nota: string;
}

export class ArchivoDuplicadoError extends Error {
  constructor(public readonly registro: RegistroArchivo) {
    super('Este archivo ya fue guardado anteriormente.');
    this.name = 'ArchivoDuplicadoError';
  }
}

@Injectable({ providedIn: 'root' })
export class ArchivoStorageService {
  private readonly storageKey = 'archivos-preescolar';

  async guardarArchivoPreescolar(
    archivo: File,
    opciones?: { forzarReemplazo?: boolean; cct?: string; correo?: string }
  ): Promise<ResultadoGuardado> {
    const rutaDestino = `assets/archivos/preescolar/${archivo.name}`;
    const buffer = await archivo.arrayBuffer();
    const hash = await this.calcularHash(buffer);
    const contenido = this.arrayBufferABase64(buffer);
    const registro: RegistroArchivo = {
      nombre: archivo.name,
      tamano: archivo.size,
      fechaGuardado: new Date().toISOString(),
      ruta: rutaDestino,
      contenidoBase64: contenido,
      hash,
      cct: opciones?.cct,
      correo: this.normalizarCorreo(opciones?.correo ?? '') || undefined
    };

    const registros = this.obtenerRegistros();
    await this.agregarHashesFaltantes(registros);

    const duplicado = registros.find((registroGuardado) => registroGuardado.hash === hash);

    if (duplicado) {
      if (!opciones?.forzarReemplazo) {
        throw new ArchivoDuplicadoError(duplicado);
      }

      const registrosSinDuplicado = registros.filter((registroGuardado) => registroGuardado.hash !== hash);
      registrosSinDuplicado.unshift(registro);
      localStorage.setItem(this.storageKey, JSON.stringify(registrosSinDuplicado.slice(0, 5)));

      return {
        rutaVirtual: rutaDestino,
        fechaGuardado: new Date(),
        tamano: archivo.size,
        modo: 'localStorage',
        nota:
          'Se reemplazó el archivo previo porque el contenido es idéntico. Se mantuvo la última versión en localStorage para moverla manualmente.'
      };
    }

    registros.unshift(registro);
    localStorage.setItem(this.storageKey, JSON.stringify(registros.slice(0, 5)));

    return {
      rutaVirtual: rutaDestino,
      fechaGuardado: new Date(),
      tamano: archivo.size,
      modo: 'localStorage',
      nota:
        'El navegador no puede escribir en el sistema de archivos del proyecto. Se mantuvo una copia en localStorage para moverla manualmente.'
    };
  }

  obtenerRegistros(): RegistroArchivo[] {
    const guardados = localStorage.getItem(this.storageKey);
    if (!guardados) {
      return [];
    }

    try {
      const registros = JSON.parse(guardados) as RegistroArchivo[];
      return Array.isArray(registros) ? registros : [];
    } catch (error) {
      console.warn('No se pudieron leer los archivos guardados localmente', error);
      return [];
    }
  }

  descargarRegistro(registro: RegistroArchivo): void {
    const blob = this.base64ABlob(registro.contenidoBase64);
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = registro.nombre;
    enlace.style.display = 'none';

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  }

  eliminarRegistro(registroAEliminar: RegistroArchivo): void {
    const registrosActualizados = this.obtenerRegistros().filter(
      (registro) =>
        !(
          registro.nombre === registroAEliminar.nombre &&
          registro.fechaGuardado === registroAEliminar.fechaGuardado
        )
    );

    localStorage.setItem(this.storageKey, JSON.stringify(registrosActualizados));
  }

  private async agregarHashesFaltantes(registros: RegistroArchivo[]): Promise<void> {
    let actualizado = false;

    for (const registro of registros) {
      if (!registro.hash) {
        const buffer = this.base64AArrayBuffer(registro.contenidoBase64);
        registro.hash = await this.calcularHash(buffer);
        actualizado = true;
      }
    }

    if (actualizado) {
      localStorage.setItem(this.storageKey, JSON.stringify(registros));
    }
  }

  private arrayBufferABase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary);
  }

  private base64AArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
  }

  private async calcularHash(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  private base64ABlob(base64: string): Blob {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new Blob([bytes]);
  }

  private normalizarCorreo(correo: string): string {
    return (correo ?? '').trim().toLowerCase();
  }
}
