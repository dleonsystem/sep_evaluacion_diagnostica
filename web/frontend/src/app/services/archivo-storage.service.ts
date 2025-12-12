import { Injectable } from '@angular/core';

interface RegistroArchivo {
  nombre: string;
  tamano: number;
  fechaGuardado: string;
  ruta: string;
  contenidoBase64: string;
}

interface ResultadoGuardado {
  ruta: string;
  fechaGuardado: Date;
  tamano: number;
  modo: 'sistema-archivos' | 'descarga';
}

type FileSystemFileHandle = {
  name?: string;
  createWritable: () => Promise<{ write: (data: BufferSource | Blob) => Promise<void>; close: () => Promise<void> }>;
};

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description?: string; accept: Record<string, string[]> }[];
}

type FileSystemAccessWindow = Window & {
  showSaveFilePicker?: (options: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
};

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

    const guardado = await this.intentarGuardarEnDisco(archivo, rutaDestino);

    return guardado;
  }

  private async intentarGuardarEnDisco(archivo: File, rutaDestino: string): Promise<ResultadoGuardado> {
    const windowAccess = window as FileSystemAccessWindow;

    if (typeof windowAccess.showSaveFilePicker === 'function') {
      try {
        const resultado = await this.guardarConFileSystemAccess(windowAccess, archivo, rutaDestino);
        return resultado;
      } catch (error) {
        console.warn('No se pudo usar el File System Access API, se usará descarga directa.', error);
      }
    }

    return this.descargarArchivo(archivo, rutaDestino);
  }

  private async guardarConFileSystemAccess(
    windowAccess: FileSystemAccessWindow,
    archivo: File,
    rutaDestino: string
  ): Promise<ResultadoGuardado> {
    const handle = await windowAccess.showSaveFilePicker?.({
      suggestedName: rutaDestino,
      types: [
        {
          description: 'Archivos de Excel (.xlsx)',
          accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
          }
        }
      ]
    });

    if (!handle) {
      throw new Error('No se pudo abrir el selector de archivos.');
    }

    const writable = await handle.createWritable();
    await writable.write(await archivo.arrayBuffer());
    await writable.close();

    return {
      ruta: handle.name ?? rutaDestino,
      fechaGuardado: new Date(),
      tamano: archivo.size,
      modo: 'sistema-archivos'
    };
  }

  private descargarArchivo(archivo: File, rutaDestino: string): ResultadoGuardado {
    const enlace = document.createElement('a');
    const url = URL.createObjectURL(archivo);
    enlace.href = url;
    enlace.download = rutaDestino;
    enlace.style.display = 'none';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);

    return {
      ruta: rutaDestino,
      fechaGuardado: new Date(),
      tamano: archivo.size,
      modo: 'descarga'
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
