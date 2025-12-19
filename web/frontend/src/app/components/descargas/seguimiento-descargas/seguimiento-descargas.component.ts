import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize, Subject, takeUntil } from 'rxjs';
import { SeguimientoFiltro, SeguimientoService, SeguimientoSnapshot } from '../../../services/seguimiento.service';

@Component({
  selector: 'app-seguimiento-descargas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './seguimiento-descargas.component.html',
  styleUrl: './seguimiento-descargas.component.scss'
})
export class SeguimientoDescargasComponent implements OnInit, OnDestroy {
  filtroForm = new FormGroup({
    cct: new FormControl<string | null>(''),
    fechaInicio: new FormControl<string>(''),
    fechaFin: new FormControl<string>(''),
    simularFallo: new FormControl<boolean>(false)
  });

  resumen: SeguimientoSnapshot | null = null;
  cargando = false;
  error: string | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly seguimientoService: SeguimientoService) {}

  ngOnInit(): void {
    this.consultar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  consultar(): void {
    const filtro = this.construirFiltro();
    this.cargando = true;
    this.error = null;

    this.seguimientoService
      .consultarSeguimiento(filtro)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargando = false;
        })
      )
      .subscribe({
        next: (resumen) => {
          this.resumen = resumen;
        },
        error: () => {
          this.error = filtro.simularError
            ? 'Se simuló un fallo para validar la vista de reintentos.'
            : 'No fue posible obtener el seguimiento. Intenta nuevamente.';
        }
      });
  }

  private construirFiltro(): SeguimientoFiltro {
    const { cct, fechaInicio, fechaFin, simularFallo } = this.filtroForm.value;

    return {
      cct: cct?.trim() || undefined,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin) : undefined,
      simularError: simularFallo ?? false
    };
  }
}
