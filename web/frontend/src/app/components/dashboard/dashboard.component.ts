import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DashboardService, DashboardMetrics } from '../../services/dashboard.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
    metrics: DashboardMetrics | null = null;
    cargandoMetrics = false;
    error: string | null = null;

    constructor(private readonly dashboardService: DashboardService) { }

    ngOnInit(): void {
        this.cargarMetrics();
    }

    async cargarMetrics(): Promise<void> {
        this.cargandoMetrics = true;
        this.error = null;
        try {
            this.metrics = await firstValueFrom(this.dashboardService.getMetrics());
        } catch (error) {
            console.error('Error cargando métricas:', error);
            this.error = 'No se pudieron cargar las estadísticas. Por favor, intenta de nuevo más tarde.';
        } finally {
            this.cargandoMetrics = false;
        }
    }
}
