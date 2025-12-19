import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { finalize, firstValueFrom, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { EstadoCredencialesService } from '../../services/estado-credenciales.service';
import { VersionDisponible, VersionesService } from '../../services/versiones.service';
import { SeguimientoDescargasComponent } from './seguimiento-descargas/seguimiento-descargas.component';

@Component({
  selector: 'app-descargas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SeguimientoDescargasComponent],
  templateUrl: './descargas.component.html',
  styleUrl: './descargas.component.scss'
})
export class DescargasComponent implements OnInit, OnDestroy {
  autenticado = false;
  cargandoVersiones = false;
  autenticando = false;
  error: string | null = null;
  versiones: VersionDisponible[] = [];
  private readonly destroy$ = new Subject<void>();

  readonly accesoForm = new FormGroup({
    correo: new FormControl('', [Validators.required, Validators.email]),
    contrasena: new FormControl('', [Validators.required])
  });

  constructor(
    private readonly authService: AuthService,
    private readonly estadoCredencialesService: EstadoCredencialesService,
    private readonly versionesService: VersionesService
  ) {}

  ngOnInit(): void {
    const estado = this.estadoCredencialesService.obtener();
    if (estado) {
      this.accesoForm.patchValue({ correo: estado.correo, contrasena: estado.contrasena });
    }

    this.autenticado = this.authService.estaAutenticado();
    if (this.autenticado) {
      this.cargarVersiones();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async iniciarSesion(): Promise<void> {
    if (this.accesoForm.invalid) {
      this.accesoForm.markAllAsTouched();
      return;
    }

    const correo = this.accesoForm.controls.correo.value ?? '';
    const contrasena = this.accesoForm.controls.contrasena.value ?? '';

    this.error = null;
    this.autenticando = true;

    try {
      this.authService.iniciarSesion(correo, contrasena);
      this.estadoCredencialesService.actualizar(correo, contrasena);
      this.autenticado = true;
      await Swal.fire({
        icon: 'success',
        title: 'Acceso concedido',
        text: 'Ya puedes descargar las versiones disponibles.',
        timer: 2300,
        timerProgressBar: true
      });
      this.cargarVersiones();
    } catch (error) {
      this.autenticado = false;
      this.error = error instanceof Error ? error.message : 'No fue posible iniciar sesión.';
      await Swal.fire({
        icon: 'error',
        title: 'Credenciales inválidas',
        text: this.error
      });
    } finally {
      this.autenticando = false;
    }
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
