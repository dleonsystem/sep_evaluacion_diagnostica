import { Injectable } from '@angular/core';

export interface RegistroArchivoLocal {
  nombre: string;
  cct: string;
  nivel: string;
  fecha: string;
  size: number;
  correo: string;
}

@Injectable({ providedIn: 'root' })
export class ArchivoStorageService {
  private readonly storageKey = 'archivos-preescolar';

  obtenerRegistros(correo: string): RegistroArchivoLocal[] {
    const data = localStorage.getItem(this.storageKey);
    if (!data) return [];

    try {
      const all: RegistroArchivoLocal[] = JSON.parse(data);
      if (!Array.isArray(all)) return [];

      // Filtrar por correo si se proporciona
      const correoNormalizado = this.normalizarCorreo(correo);
      return all.filter(r => this.normalizarCorreo(r.correo) === correoNormalizado);
    } catch {
      return [];
    }
  }

  guardarRegistro(registro: RegistroArchivoLocal): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      let all: RegistroArchivoLocal[] = data ? JSON.parse(data) : [];
      if (!Array.isArray(all)) all = [];

      // Evitar duplicados por nombre y CCT
      const existe = all.some(r => r.nombre === registro.nombre && r.cct === registro.cct && r.correo === registro.correo);
      if (!existe) {
        all.unshift(registro); // Agregar al inicio
        localStorage.setItem(this.storageKey, JSON.stringify(all));
      }
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
    }
  }

  normalizarCorreo(correo: string): string {
    return (correo ?? '').trim().toLowerCase();
  }
}
