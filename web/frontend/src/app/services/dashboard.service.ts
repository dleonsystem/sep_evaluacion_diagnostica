import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { GraphqlService } from './graphql.service';
import { GET_DASHBOARD_METRICS } from '../operations/query';

export interface DashboardMetrics {
    totalUsuarios: number;
    usuariosActivos: number;
    totalTickets: number;
    ticketsAbiertos: number;
    ticketsResueltos: number;
    totalSolicitudes: number;
    solicitudesValidadas: number;
    totalCCTs: number;
    tendenciaCargas: Array<{ fecha: string; cantidad: number }>;
    distribucionNivel: Array<{ label: string; cantidad: number; porcentaje: number }>;
    eficienciaSoporte: {
        tiempoPromedioRespuestaHoras: number;
        tasaResolucion: number;
    };
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
    constructor(private readonly graphqlService: GraphqlService) { }

    getMetrics(): Observable<DashboardMetrics> {
        return this.graphqlService
            .execute<{ getDashboardMetrics: DashboardMetrics }>(GET_DASHBOARD_METRICS)
            .pipe(
                map((res) => {
                    if (res.errors) throw new Error(res.errors[0].message);
                    if (!res.data?.getDashboardMetrics) throw new Error('No se pudieron obtener las métricas');
                    return res.data.getDashboardMetrics;
                }),
            );
    }
}
