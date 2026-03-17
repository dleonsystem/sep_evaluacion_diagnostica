import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, firstValueFrom, Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { MaterialesService, MaterialEvaluacion } from '../../services/materiales.service';
import { ReportesService, SchoolReport } from '../../services/reportes.service';
import { SeguimientoDescargasComponent } from './seguimiento-descargas/seguimiento-descargas.component';

@Component({
  selector: 'app-descargas',
  standalone: true,
  imports: [CommonModule, SeguimientoDescargasComponent],
  templateUrl: './descargas.component.html',
  styleUrl: './descargas.component.scss'
})
export class DescargasComponent implements OnInit, OnDestroy {
  autenticado = false;
  cargandoVersiones = false;
  error: string | null = null;
  materiales: MaterialEvaluacion[] = [];
  reportes: SchoolReport[] = [];
  cargandoReportes = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly materialesService: MaterialesService,
    private readonly reportesService: ReportesService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.autenticado = this.authService.estaAutenticado();
    if (!this.autenticado) {
      void this.router.navigate(['/login']);
      return;
    }

    this.cargarVersiones();
    this.cargarReportes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarVersiones(): void {
    this.error = null;
    this.cargandoVersiones = true;
    this.materialesService
      .getMateriales()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargandoVersiones = false;
        })
      )
      .subscribe({
        next: (materiales) => (this.materiales = materiales),
        error: () => {
          this.error = 'No se pudieron obtener los materiales. Intenta más tarde.';
        }
      });
  }

  cargarReportes(): void {
    const creds = this.authService.obtenerCredenciales();
    if (!creds?.cct) return;

    this.cargandoReportes = true;
    this.reportesService.getSchoolReports(creds.cct)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.cargandoReportes = false)
      )
      .subscribe({
        next: (reportes) => this.reportes = reportes,
        error: () => logger.error('Error cargando reportes de escuela')
      });
  }

  async descargarReporte(reporte: SchoolReport): Promise<void> {
    if (!reporte.solicitudId) return;

    this.reportesService.descargarReporte(reporte.solicitudId, reporte.nombre).subscribe({
      next: (res) => {
        if (res.success) {
          this.procesarDescarga(res.contentBase64, res.fileName);
        } else {
          void Swal.fire('Error', 'No se pudo descargar el reporte.', 'error');
        }
      },
      error: () => void Swal.fire('Error', 'Fallo de conexión al descargar reporte.', 'error')
    });
  }

  private procesarDescarga(base64: string, fileName: string): void {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    
    void Swal.fire({
      icon: 'success',
      title: 'Archivo descargado',
      text: `El archivo ${fileName} ha sido descargado correctamente.`,
      timer: 2000,
      showConfirmButton: false
    });
  }

  async descargar(material: MaterialEvaluacion): Promise<void> {
    this.materialesService.descargarMaterial(material.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.procesarDescarga(res.contentBase64, res.fileName);
        } else {
          void Swal.fire('Error', 'No se pudo descargar el material.', 'error');
        }
      },
      error: () => void Swal.fire('Error', 'Fallo de conexión.', 'error')
    });
  }
}

// Add logger mock if not available or import
const logger = { error: (...args: any[]) => console.error(...args) };
