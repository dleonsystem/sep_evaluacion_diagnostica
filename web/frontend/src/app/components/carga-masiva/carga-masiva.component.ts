import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ExcelValidationService, ResultadoValidacion } from '../../services/excel-validation.service';
import {
  ArchivoDuplicadoError,
  ArchivoStorageService,
  ResultadoGuardado
} from '../../services/archivo-storage.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

interface SelectedFile {
  name: string;
  sizeKb: number;
  lastModified: Date;
}

interface ResultadoExito {
  mensaje: string;
  fechaDisponible: Date;
  credenciales: { usuario: string; contrasena: string };
  totalAlumnos: number;
}

@Component({
  selector: 'app-carga-masiva',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './carga-masiva.component.html',
  styleUrl: './carga-masiva.component.scss'
})
export class CargaMasivaComponent implements OnInit {
  readonly extensionesPermitidas = ['.xlsx'];
  readonly pesoMaximoMb = 10;

  archivoSeleccionado: SelectedFile | null = null;
  archivoOriginal: File | null = null;
  estado: 'idle' | 'validando' | 'exito' | 'error' = 'idle';
  errores: string[] = [];
  advertencias: string[] = [];
  resultadoExito: ResultadoExito | null = null;
  mensajeInformativo: string | null = null;
  guardando = false;
  rutaGuardado: string | null = null;
  errorGuardado: string | null = null;
  modoGuardado: 'localStorage' | null = null;
  notaGuardado: string | null = null;

  constructor(
    private readonly excelValidationService: ExcelValidationService,
    private readonly archivoStorageService: ArchivoStorageService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.requiereLoginParaNuevaCarga()) {
      void this.router.navigate(['/login'], { queryParams: { redirect: '/carga-masiva' } });
      return;
    }
  }

  async onArchivoSeleccionado(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const file = input.files?.[0];

    this.resetMensajes();

    if (this.authService.requiereLoginParaNuevaCarga()) {
      await Swal.fire({
        icon: 'info',
        title: 'Inicia sesión',
        text: 'Ya registraste un envío. Inicia sesión para cargar un nuevo archivo.',
        confirmButtonText: 'Ir a login'
      });
      void this.router.navigate(['/login'], { queryParams: { redirect: '/carga-masiva' } });
      this.limpiarSeleccion(input);
      return;
    }

    if (!file) {
      return;
    }

    const extensionValida = this.extensionesPermitidas.some((extension) =>
      file.name.toLowerCase().endsWith(extension)
    );

    if (!extensionValida) {
      this.estado = 'error';
      this.errores = ['Formato no permitido. Usa únicamente archivos .xlsx'];
      input.value = '';
      return;
    }

    const tamanioMb = file.size / (1024 * 1024);
    if (tamanioMb > this.pesoMaximoMb) {
      this.estado = 'error';
      this.errores = [`El archivo supera los ${this.pesoMaximoMb} MB permitidos.`];
      input.value = '';
      return;
    }

    this.archivoSeleccionado = {
      name: file.name,
      sizeKb: parseFloat((file.size / 1024).toFixed(2)),
      lastModified: new Date(file.lastModified)
    };
    this.archivoOriginal = file;

    this.estado = 'validando';
    this.mensajeInformativo = 'Validando tu archivo...';

    try {
      const buffer = await file.arrayBuffer();
      const resultado = await this.excelValidationService.validarPreescolar(buffer);
      this.procesarResultado(resultado);
    } catch (error) {
      this.estado = 'error';
      this.errores = [
        error instanceof Error
          ? error.message
          : 'No se pudo validar el archivo. Inténtalo de nuevo.'
      ];
    }
  }

  limpiarSeleccion(input: HTMLInputElement): void {
    input.value = '';
    this.resetMensajes();
  }

  async guardarArchivo(): Promise<void> {
    if (!this.archivoOriginal || this.estado !== 'exito') {
      this.errorGuardado = 'Primero valida correctamente tu archivo para poder guardarlo.';
      await Swal.fire({
        icon: 'warning',
        title: 'Validación pendiente',
        text: this.errorGuardado
      });
      return;
    }

    this.guardando = true;
    this.errorGuardado = null;
    this.rutaGuardado = null;
    this.modoGuardado = null;
    this.notaGuardado = null;

    try {
      const resultado = await this.archivoStorageService.guardarArchivoPreescolar(this.archivoOriginal);
      await this.mostrarConfirmacionGuardado(resultado, 'guardado');
    } catch (error) {
      if (error instanceof ArchivoDuplicadoError) {
        const confirmacion = await Swal.fire({
          icon: 'question',
          title: 'Archivo ya existe',
          text: 'Ya tienes una copia con el mismo contenido. ¿Quieres sustituirla?',
          showCancelButton: true,
          confirmButtonText: 'Sí, sustituir',
          cancelButtonText: 'Cancelar'
        });

        if (confirmacion.isConfirmed) {
          try {
            const resultadoReemplazo = await this.archivoStorageService.guardarArchivoPreescolar(
              this.archivoOriginal,
              { forzarReemplazo: true }
            );
            await this.mostrarConfirmacionGuardado(resultadoReemplazo, 'reemplazo');
            return;
          } catch (reemplazoError) {
            this.errorGuardado =
              reemplazoError instanceof Error
                ? reemplazoError.message
                : 'No se pudo sustituir el archivo guardado.';
          }
        }

        return;
      }

      this.errorGuardado =
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el archivo localmente. Inténtalo de nuevo.';
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text: this.errorGuardado
      });
    } finally {
      this.guardando = false;
    }
  }

  private procesarResultado(resultado: ResultadoValidacion): void {
    this.errores = resultado.errores;
    this.advertencias = resultado.advertencias;

    if (!resultado.ok || !resultado.esc) {
      this.estado = 'error';
      this.mensajeInformativo = null;
      return;
    }

    if (!this.authService.coincidenCredenciales(resultado.esc.cct, resultado.esc.correo)) {
      this.estado = 'error';
      this.mensajeInformativo = null;
      this.errores = [
        ...this.errores,
        'El CCT y el correo deben coincidir con los registrados en tu primer envío.'
      ];
      return;
    }

    try {
      this.authService.registrarCredenciales(resultado.esc.cct, resultado.esc.correo);
    } catch (error) {
      this.estado = 'error';
      this.mensajeInformativo = null;
      this.errores = [
        ...this.errores,
        error instanceof Error
          ? error.message
          : 'No pudimos validar tus credenciales. Usa el CCT y correo originales.'
      ];
      return;
    }

    const fechaDisponible = this.calcularFechaDisponible();
    this.estado = 'exito';
    this.mensajeInformativo = 'Tu archivo ha sido validado correctamente.';
    this.resultadoExito = {
      mensaje: `Podrás consultar tus resultados a partir del día: ${fechaDisponible.toLocaleDateString()}`,
      fechaDisponible,
      credenciales: {
        usuario: resultado.esc.cct,
        contrasena: resultado.esc.correo
      },
      totalAlumnos: resultado.alumnos?.length ?? 0
    };
  }

  private calcularFechaDisponible(): Date {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 4);
    return fecha;
  }

  private resetMensajes(): void {
    this.estado = 'idle';
    this.archivoSeleccionado = null;
    this.errores = [];
    this.advertencias = [];
    this.resultadoExito = null;
    this.mensajeInformativo = null;
    this.archivoOriginal = null;
    this.guardando = false;
    this.rutaGuardado = null;
    this.errorGuardado = null;
    this.modoGuardado = null;
  }

  private async mostrarConfirmacionGuardado(
    resultado: ResultadoGuardado,
    tipo: 'guardado' | 'reemplazo'
  ): Promise<void> {
    this.rutaGuardado = resultado.rutaVirtual;
    this.modoGuardado = resultado.modo;
    this.notaGuardado = resultado.nota;
    this.mensajeInformativo =
      'El archivo se conservó en el almacenamiento local del navegador. Copia el archivo a assets/archivos/preescolar/ en tu proyecto si lo necesitas.';

    await Swal.fire({
      icon: 'success',
      title: tipo === 'reemplazo' ? 'Archivo sustituido' : 'Archivo guardado',
      text:
        tipo === 'reemplazo'
          ? 'Se reemplazó la copia previa con la nueva versión.'
          : 'Se guardó una copia en el almacenamiento local del navegador.',
      footer: this.rutaGuardado ? `Ruta sugerida: ${this.rutaGuardado}` : undefined
    });
  }
}
