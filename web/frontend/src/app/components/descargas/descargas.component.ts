import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, firstValueFrom, Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { VersionDisponible, VersionesService } from '../../services/versiones.service';
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
  versiones: VersionDisponible[] = [];
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly versionesService: VersionesService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.autenticado = this.authService.estaAutenticado();
    if (!this.autenticado) {
      void this.router.navigate(['/login']);
      return;
    }

    this.cargarVersiones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarVersiones(): void {
    this.error = null;
    this.cargandoVersiones = true;
    this.versionesService
      .obtenerVersiones()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargandoVersiones = false;
        })
      )
      .subscribe({
        next: (versiones) => (this.versiones = versiones),
        error: () => {
          this.error = 'No se pudieron obtener las versiones. Intenta más tarde.';
        }
      });
  }

  async descargar(version: VersionDisponible): Promise<void> {
    await firstValueFrom(this.versionesService.registrarDescarga(version).pipe(takeUntil(this.destroy$)));

    await Swal.fire({
      icon: 'info',
      title: 'Descarga simulada',
      text: 'La descarga se abrirá cuando el backend real esté disponible.',
      confirmButtonText: 'Entendido'
    });

    window.open(version.urlDescarga, '_blank');
  }
}
