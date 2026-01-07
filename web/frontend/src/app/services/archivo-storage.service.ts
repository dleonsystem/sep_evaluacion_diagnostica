import { Injectable } from '@angular/core';

export interface RegistroArchivo {
  nombre: string;
  tamano: number;
  fechaGuardado: string;
  ruta: string;
  contenidoBase64: string;
  hash: string;
  claveEstable: string;
  cct?: string;
  correo?: string;
  nivel?: string;
  estatus?: 'asignado' | 'pendiente';
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
    parametros?: { forzarReemplazo?: boolean; cct?: string; correo?: string; email?: string },
    opciones?: { forzarReemplazo?: boolean }
  ): Promise<ResultadoGuardado> {
    const rutaDestino = `assets/archivos/preescolar/${archivo.name}`;
    const buffer = await archivo.arrayBuffer();
    const hash = await this.calcularHash(buffer);
    const contenido = this.arrayBufferABase64(buffer);
    const emailNormalizado = this.normalizarCorreo(parametros?.correo ?? parametros?.email ?? '');
    const registrosPorCorreo = this.obtenerMapaRegistros();
    const registros = [...(registrosPorCorreo[emailNormalizado] ?? [])];
    const forzarReemplazo = opciones?.forzarReemplazo ?? parametros?.forzarReemplazo ?? false;

    const hashesActualizados = await this.agregarHashesFaltantes(registros);
    if (hashesActualizados) {
      registrosPorCorreo[emailNormalizado] = registros;
      localStorage.setItem(this.storageKey, JSON.stringify(registrosPorCorreo));
    }

    const fechaGuardado = new Date().toISOString();
    const claveEstable = this.construirClaveEstable({
      cct: parametros?.cct,
      correo: emailNormalizado,
      nombre: archivo.name,
      fechaGuardado
    });
    const registro: RegistroArchivo = {
      nombre: archivo.name,
      tamano: archivo.size,
      fechaGuardado,
      ruta: rutaDestino,
      contenidoBase64: contenido,
      hash,
      claveEstable,
      cct: parametros?.cct,
      correo: emailNormalizado || undefined,
      nivel: 'preescolar'
    };

    const duplicado = registros.find(
      (registroGuardado) => registroGuardado.hash === hash && registroGuardado.cct === registro.cct
    );

    if (duplicado) {
      if (!forzarReemplazo) {
        throw new ArchivoDuplicadoError(duplicado);
      }

      const registrosSinDuplicado = registros.filter(
        (registroGuardado) => !(registroGuardado.hash === hash && registroGuardado.cct === registro.cct)
      );

      registrosPorCorreo[emailNormalizado] = [registro, ...registrosSinDuplicado].slice(0, 5);
      localStorage.setItem(this.storageKey, JSON.stringify(registrosPorCorreo));

      return {
        rutaVirtual: rutaDestino,
        fechaGuardado: new Date(),
        tamano: archivo.size,
        modo: 'localStorage',
        nota:
          'Se reemplazó el archivo previo porque el contenido es idéntico. Se mantuvo la última versión en localStorage para moverla manualmente.'
      };
    }

    registrosPorCorreo[emailNormalizado] = [registro, ...registros].slice(0, 5);
    localStorage.setItem(this.storageKey, JSON.stringify(registrosPorCorreo));

    return {
      rutaVirtual: rutaDestino,
      fechaGuardado: new Date(),
      tamano: archivo.size,
      modo: 'localStorage',
      nota:
        'El navegador no puede escribir en el sistema de archivos del proyecto. Se mantuvo una copia en localStorage para moverla manualmente.'
    };
  }

  obtenerRegistros(email?: string | null): RegistroArchivo[] {
    if (!email) {
      return [];
    }

    const registros = this.obtenerMapaRegistros();
    const correoNormalizado = this.normalizarCorreo(email);
    return registros[correoNormalizado] ?? [];
  }

  obtenerTodosRegistros(): RegistroArchivo[] {
    const registrosPorCorreo = this.obtenerMapaRegistros();
    const registros = Object.values(registrosPorCorreo).flat();

    return registros.sort((a, b) => b.fechaGuardado.localeCompare(a.fechaGuardado));
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
    const correo = this.normalizarCorreo(registroAEliminar.correo ?? '');
    if (!correo) {
      return;
    }

    const registrosPorCorreo = this.obtenerMapaRegistros();
    const registrosActualizados = (registrosPorCorreo[correo] ?? []).filter(
      (registro) =>
        !(
          registro.nombre === registroAEliminar.nombre &&
          registro.fechaGuardado === registroAEliminar.fechaGuardado
        )
    );

    registrosPorCorreo[correo] = registrosActualizados;
    localStorage.setItem(this.storageKey, JSON.stringify(registrosPorCorreo));
  }

  private async agregarHashesFaltantes(registros: RegistroArchivo[]): Promise<boolean> {
    let actualizado = false;

    for (const registro of registros) {
      if (!registro.hash) {
        const buffer = this.base64AArrayBuffer(registro.contenidoBase64);
        registro.hash = await this.calcularHash(buffer);
        actualizado = true;
      }

      if (!registro.claveEstable) {
        registro.claveEstable = this.construirClaveEstable({
          cct: registro.cct,
          correo: registro.correo,
          nombre: registro.nombre,
          fechaGuardado: registro.fechaGuardado
        });
        actualizado = true;
      }
    }

    return actualizado;
  }

  private obtenerMapaRegistros(): Record<string, RegistroArchivo[]> {
    const guardados = localStorage.getItem(this.storageKey);

    if (!guardados) {
      return {};
    }

    try {
      const registros = JSON.parse(guardados) as Record<string, RegistroArchivo[]>;
      return registros ?? {};
    } catch (error) {
      console.error('No se pudieron leer los registros almacenados', error);
      return {};
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

  private construirClaveEstable(params: {
    cct?: string;
    correo?: string;
    nombre: string;
    fechaGuardado: string;
  }): string {
    const cct = (params.cct ?? '').trim();
    const correo = this.normalizarCorreo(params.correo ?? '');
    return `${cct}|${correo}|${params.nombre}|${params.fechaGuardado}`;
  }
}
