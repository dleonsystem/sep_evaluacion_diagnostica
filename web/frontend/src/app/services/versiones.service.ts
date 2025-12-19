import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, Observable, of } from 'rxjs';

export interface VersionDisponible {
  numero: number;
  nombre: string;
  fechaPublicacion: Date;
  urlDescarga: string;
}

@Injectable({ providedIn: 'root' })
export class VersionesService {
  // TODO: Reemplazar la URL base por el endpoint real cuando el backend esté disponible.
  private readonly apiBaseUrl = '/api/versiones';

  constructor(private readonly http: HttpClient) {}

  obtenerVersiones(): Observable<VersionDisponible[]> {
    // Simulación de respuesta del repositorio externo. Sustituir por:
    // return this.http.get<VersionDisponible[]>(`${this.apiBaseUrl}`);
    const versiones: VersionDisponible[] = [
      {
        numero: 1,
        nombre: 'Versión de inicio de ciclo',
        fechaPublicacion: new Date('2024-08-15'),
        urlDescarga: 'https://repositorio.externoligas/descargas/version-1.zip'
      },
      {
        numero: 2,
        nombre: 'Actualización de catálogos',
        fechaPublicacion: new Date('2024-09-01'),
        urlDescarga: 'https://repositorio.externoligas/descargas/version-2.zip'
      },
      {
        numero: 3,
        nombre: 'Ajustes de validación y reporte',
        fechaPublicacion: new Date('2024-09-18'),
        urlDescarga: 'https://repositorio.externoligas/descargas/version-3.zip'
      }
    ];

    return of(versiones).pipe(delay(450));
  }

  registrarDescarga(_version: VersionDisponible): Observable<boolean> {
    // Preparado para registrar descargas en el backend real.
    // return this.http.post<boolean>(`${this.apiBaseUrl}/descargas`, { version: version.numero });
    return of(true).pipe(delay(200));
  }
}
