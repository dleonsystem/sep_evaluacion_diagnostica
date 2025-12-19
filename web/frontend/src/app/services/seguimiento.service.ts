import { Inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, delay, map, of, throwError } from 'rxjs';

export interface ResumenSolicitudes {
  total: number;
  validadas: number;
  enProceso: number;
  conObservaciones: number;
}

export type EstadoValidacion = 'validado' | 'en-proceso' | 'pendiente' | 'error';

export interface ValidacionDetalle {
  nombre: string;
  estado: EstadoValidacion;
  comentario?: string;
  actualizado: Date;
}

export type EstadoDescarga = 'completada' | 'en-proceso' | 'error';

export interface DescargaReciente {
  cct: string;
  archivo: string;
  fecha: Date;
  estado: EstadoDescarga;
  reintentos: number;
}

export interface SeguimientoSnapshot {
  actualizado: Date;
  resumenSolicitudes: ResumenSolicitudes;
  validaciones: ValidacionDetalle[];
  descargasRecientes: DescargaReciente[];
}

export interface SeguimientoFiltro {
  cct?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  simularError?: boolean;
}

export interface SeguimientoDataSource {
  consultarSeguimiento(filtro: SeguimientoFiltro): Observable<SeguimientoSnapshot>;
}

export const SEGUIMIENTO_DATASOURCE = new InjectionToken<SeguimientoDataSource>('SEGUIMIENTO_DATASOURCE');

@Injectable({ providedIn: 'root' })
export class SeguimientoService {
  constructor(@Inject(SEGUIMIENTO_DATASOURCE) private readonly dataSource: SeguimientoDataSource) {}

  consultarSeguimiento(filtro: SeguimientoFiltro): Observable<SeguimientoSnapshot> {
    return this.dataSource.consultarSeguimiento(filtro);
  }
}

@Injectable({ providedIn: 'root' })
export class MockSeguimientoDataSource implements SeguimientoDataSource {
  // TODO: Sustituir la URL por el endpoint real cuando esté disponible.
  private readonly apiUrl = '/api/seguimiento';

  constructor(_http: HttpClient) {}

  consultarSeguimiento(filtro: SeguimientoFiltro): Observable<SeguimientoSnapshot> {
    if (filtro.simularError) {
      return throwError(() => new Error('Fallo simulado en la consulta de seguimiento.')).pipe(delay(400));
    }

    const descargas: DescargaReciente[] = [
      { cct: '09A1234A', archivo: 'ed_ciclo_2024.zip', fecha: new Date('2024-09-25T10:30:00'), estado: 'completada', reintentos: 0 },
      { cct: '15B5678B', archivo: 'catalogos_actualizados.xlsx', fecha: new Date('2024-09-26T08:15:00'), estado: 'en-proceso', reintentos: 1 },
      { cct: '21C9012C', archivo: 'validaciones_parciales.csv', fecha: new Date('2024-09-26T09:40:00'), estado: 'error', reintentos: 2 },
      { cct: '09A1234A', archivo: 'ed_ciclo_2024_v2.zip', fecha: new Date('2024-09-27T12:05:00'), estado: 'completada', reintentos: 0 },
      { cct: '30D3456D', archivo: 'reportes_validacion.pdf', fecha: new Date('2024-09-27T13:50:00'), estado: 'en-proceso', reintentos: 0 }
    ];

    const filtradas = descargas.filter((descarga) => {
      const coincideCct = !filtro.cct || descarga.cct.toLowerCase().includes(filtro.cct.toLowerCase());
      const fecha = descarga.fecha.getTime();
      const despuesDe = filtro.fechaInicio?.getTime();
      const antesDe = filtro.fechaFin?.getTime();

      if (despuesDe && fecha < despuesDe) {
        return false;
      }

      if (antesDe && fecha > antesDe) {
        return false;
      }

      return coincideCct;
    });

    const resumen: ResumenSolicitudes = {
      total: 186,
      validadas: 144,
      enProceso: 32,
      conObservaciones: 10
    };

    const validaciones: ValidacionDetalle[] = [
      { nombre: 'Integridad de datos', estado: 'validado', comentario: 'Sin hallazgos', actualizado: new Date('2024-09-26T08:45:00') },
      { nombre: 'Consistencia de claves', estado: 'en-proceso', comentario: 'Se recalculan CCT duplicadas', actualizado: new Date('2024-09-26T09:10:00') },
      { nombre: 'Estructura de archivos', estado: 'validado', comentario: 'Cumple con el layout', actualizado: new Date('2024-09-26T07:55:00') },
      { nombre: 'Reglas de negocio', estado: 'pendiente', comentario: 'Esperando catálogos definitivos', actualizado: new Date('2024-09-25T17:20:00') }
    ];

    const snapshot: SeguimientoSnapshot = {
      actualizado: new Date(),
      resumenSolicitudes: resumen,
      validaciones,
      descargasRecientes: filtradas
    };

    // Simulación de llamada HTTP: return this.http.get<SeguimientoSnapshot>(`${this.apiUrl}`, { params: ... })
    return of(snapshot).pipe(delay(450), map((valor) => ({ ...valor })));
  }
}

export const seguimientoProviders = [
  {
    provide: SEGUIMIENTO_DATASOURCE,
    useExisting: MockSeguimientoDataSource
  }
];
