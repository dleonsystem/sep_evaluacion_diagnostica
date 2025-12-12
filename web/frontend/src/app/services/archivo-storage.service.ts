import { Injectable } from '@angular/core';

interface RegistroArchivo {
  nombre: string;
  tamano: number;
  fechaGuardado: string;
  ruta: string;
  contenidoBase64: string;
}

interface ResultadoGuardado {
  rutaVirtual: string;
  fechaGuardado: Date;
  tamano: number;
  modo: 'localStorage';
  nota: string;
}

@Injectable({ providedIn: 'root' })
export class ArchivoStorageService {
  private readonly storageKey = 'archivos-preescolar';

  async guardarArchivoPreescolar(archivo: File): Promise<ResultadoGuardado> {
    const rutaDestino = `assets/archivos/preescolar/${archivo.name}`;
    const contenido = await this.convertirA64(archivo);
    const registro: RegistroArchivo = {
      nombre: archivo.name,
      tamano: archivo.size,
      fechaGuardado: new Date().toISOString(),
      ruta: rutaDestino,
      contenidoBase64: contenido
    };

    const registros = this.obtenerRegistros();
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

  private async convertirA64(archivo: File): Promise<string> {
    const buffer = await archivo.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';

    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary);
  }
}
