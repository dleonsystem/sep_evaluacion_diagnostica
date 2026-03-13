import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, firstValueFrom, Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { MaterialesService, MaterialEvaluacion } from '../../services/materiales.service';
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
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly materialesService: MaterialesService,
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

  async descargar(material: MaterialEvaluacion): Promise<void> {
    this.materialesService.descargarMaterial(material.id).subscribe({
      next: (res) => {
        if (res.success) {
          const byteCharacters = atob(res.contentBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/octet-stream' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = res.fileName;
          a.click();
          window.URL.revokeObjectURL(url);
          
          void Swal.fire({
            icon: 'success',
            title: 'Archivo descargado',
            text: `El archivo ${res.fileName} ha sido descargado correctamente.`,
            confirmButtonText: 'Entendido'
          });
        } else {
          void Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo descargar el archivo.',
            confirmButtonText: 'Entendido'
          });
        }
      },
      error: () => {
        void Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo contactar con el servidor.',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }
}
