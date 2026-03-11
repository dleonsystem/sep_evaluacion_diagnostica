import { Injectable } from '@angular/core';

export interface RegistroArchivoLocal {
  nombre: string;
  cct: string;
  nivel: string;
  fecha: string;
  size: number;
  correo: string;
}

/**
 * @deprecated El almacenamiento local ha sido desactivado a favor de la persistencia en Servidor (BD) y SFTP.
 * Este servicio se mantiene temporalmente para evitar errores de compilación durante la transición.
 */
@Injectable({ providedIn: 'root' })
export class ArchivoStorageService {
  obtenerRegistros(correo: string): RegistroArchivoLocal[] {
    // Ya no se utilizan registros locales
    return [];
  }

  guardarRegistro(registro: RegistroArchivoLocal): void {
    // Deprecated: No guardar nada localmente
    console.warn('Uso de ArchivoStorageService.guardarRegistro ignorado: La persistencia ahora es vía Servidor/SFTP.');
  }
}
