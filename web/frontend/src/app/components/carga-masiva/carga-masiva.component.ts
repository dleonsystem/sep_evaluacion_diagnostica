import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ExcelValidationService, ResultadoValidacion } from '../../services/excel-validation.service';
import {
  ArchivoDuplicadoError,
  ArchivoStorageService,
  ResultadoGuardado
} from '../../services/archivo-storage.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { EscDatos } from '../../services/excel-validation.service';

interface ResultadoExito {
  mensaje: string;
  fechaDisponible: Date;
  credenciales: { usuario: string; contrasena: string; esNueva: boolean };
  totalAlumnos: number;
}

interface ResultadoArchivo {
  archivo: {
    name: string;
    sizeKb: number;
    lastModified: Date;
  };
  archivoOriginal: File;
  estado: 'idle' | 'validando' | 'exito' | 'error';
  errores: string[];
  advertencias: string[];
  resultadoExito: ResultadoExito | null;
  mensajeInformativo: string | null;
  escDatos: EscDatos | null;
  guardando: boolean;
  guardado: boolean;
  rutaGuardado: string | null;
  errorGuardado: string | null;
  modoGuardado: 'localStorage' | null;
  notaGuardado: string | null;
}

interface CredencialesMostradas {
  usuario: string;
  contrasena: string;
  esNueva: boolean;
}

@Component({
  selector: 'app-carga-masiva',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './carga-masiva.component.html',
  styleUrl: './carga-masiva.component.scss'
})
export class CargaMasivaComponent implements OnInit {
  readonly extensionesPermitidas = ['.xlsx'];
  readonly pesoMaximoMb = 10;
  readonly correoPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  readonly correoControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email, Validators.pattern(this.correoPattern)]
  });

  resultados: ResultadoArchivo[] = [];
  sesionActiva = false;
  correoSesion: string | null = null;
  tieneCredenciales = false;
  credencialesMostradas: CredencialesMostradas | null = null;
  trackByArchivo = (_: number, item: ResultadoArchivo): string =>
    `${item.archivo.name}-${item.archivo.lastModified.getTime()}`;

  get hayErrores(): boolean {
    return this.resultados.some((resultado) => resultado.estado === 'error');
  }

  constructor(
    private readonly excelValidationService: ExcelValidationService,
    private readonly archivoStorageService: ArchivoStorageService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  @HostListener('window:storage')
  onStorageChange(): void {
    this.actualizarEstadoSesion();
  }

  async cerrarSesion(): Promise<void> {
    this.authService.cerrarSesion();
    this.actualizarEstadoSesion();
    await Swal.fire({
      icon: 'success',
      title: 'Sesión cerrada',
      text: 'Puedes iniciar sesión nuevamente cuando quieras cargar otro archivo.'
    });
  }

  ngOnInit(): void {
    this.actualizarEstadoSesion();
  }

  async onArchivoSeleccionado(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivos = input.files ? Array.from(input.files) : [];

    if (!this.correoControl.valid) {
      this.correoControl.markAllAsTouched();
      await Swal.fire({
        icon: 'warning',
        title: 'Correo requerido',
        text: 'Ingresa un correo electrónico válido antes de cargar tu archivo.'
      });
      this.limpiarSeleccion(input);
      return;
    }

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

    if (!archivos.length) {
      return;
    }

    for (const archivo of archivos) {
      await this.procesarArchivo(archivo);
    }

    input.value = '';
  }

  private async procesarArchivo(file: File): Promise<void> {
    const fechaDisponible = this.calcularFechaDisponible();

    const resultadoArchivo: ResultadoArchivo = {
      archivo: {
        name: file.name,
        sizeKb: parseFloat((file.size / 1024).toFixed(2)),
        lastModified: new Date(file.lastModified)
      },
      archivoOriginal: file,
      estado: 'validando',
      errores: [],
      advertencias: [],
      resultadoExito: null,
      mensajeInformativo: 'Validando tu archivo con el correo ingresado...',
      escDatos: null,
      guardando: false,
      guardado: false,
      rutaGuardado: null,
      errorGuardado: null,
      modoGuardado: null,
      notaGuardado: null
    };

    this.resultados = [resultadoArchivo, ...this.resultados];

    const extensionValida = this.extensionesPermitidas.some((extension) =>
      file.name.toLowerCase().endsWith(extension)
    );

    if (!extensionValida) {
      resultadoArchivo.estado = 'error';
      resultadoArchivo.mensajeInformativo = null;
      resultadoArchivo.errores = ['Formato no permitido. Usa únicamente archivos .xlsx'];
      return;
    }

    const tamanioMb = file.size / (1024 * 1024);
    if (tamanioMb > this.pesoMaximoMb) {
      resultadoArchivo.estado = 'error';
      resultadoArchivo.mensajeInformativo = null;
      resultadoArchivo.errores = [`El archivo supera los ${this.pesoMaximoMb} MB permitidos.`];
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const resultado = await this.excelValidationService.validarPreescolar(buffer);
      await this.procesarResultado(resultado, resultadoArchivo);
    } catch (error) {
      resultadoArchivo.estado = 'error';
      resultadoArchivo.mensajeInformativo = null;
      resultadoArchivo.errores = [
        error instanceof Error
          ? error.message
          : 'No se pudo validar el archivo. Inténtalo de nuevo.'
      ];
      return;
    }
  }

  async guardarArchivo(resultado: ResultadoArchivo): Promise<void> {
    if (!this.correoControl.valid) {
      this.correoControl.markAllAsTouched();
      resultado.errorGuardado = 'Agrega un correo electrónico válido para continuar con la carga.';
      await Swal.fire({
        icon: 'warning',
        title: 'Correo requerido',
        text: resultado.errorGuardado
      });
      return;
    }

    if (resultado.estado !== 'exito') {
      resultado.errorGuardado = 'Primero valida correctamente tu archivo para poder guardarlo.';
      await Swal.fire({
        icon: 'warning',
        title: 'Validación pendiente',
        text: resultado.errorGuardado
      });
      return;
    }

    resultado.guardando = true;
    resultado.errorGuardado = null;
    resultado.rutaGuardado = null;
    resultado.modoGuardado = null;
    resultado.notaGuardado = null;

    try {
      const guardado = await this.archivoStorageService.guardarArchivoPreescolar(resultado.archivoOriginal, {
        cct: resultado.escDatos?.cct,
        correo: this.correoControl.value
      });
      await this.mostrarConfirmacionGuardado(guardado, 'guardado', resultado);
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
              resultado.archivoOriginal,
              {
                forzarReemplazo: true,
                cct: resultado.escDatos?.cct,
                correo: this.correoControl.value
              }
            );
            await this.mostrarConfirmacionGuardado(resultadoReemplazo, 'reemplazo', resultado);
            return;
          } catch (reemplazoError) {
            resultado.errorGuardado =
              reemplazoError instanceof Error
                ? reemplazoError.message
                : 'No se pudo sustituir el archivo guardado.';
          }
        }

        return;
      }

      resultado.errorGuardado =
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el archivo localmente. Inténtalo de nuevo.';
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text: resultado.errorGuardado
      });
    } finally {
      resultado.guardando = false;
    }
  }

  private async procesarResultado(
    resultado: ResultadoValidacion,
    resultadoArchivo: ResultadoArchivo
  ): Promise<void> {
    resultadoArchivo.errores = resultado.errores;
    resultadoArchivo.advertencias = resultado.advertencias;
    resultadoArchivo.escDatos = resultado.esc ?? null;

    if (!resultado.ok || !resultado.esc) {
      resultadoArchivo.estado = 'error';
      resultadoArchivo.mensajeInformativo = null;
      return;
    }

    if (!this.authService.coincidenCredenciales(resultado.esc.cct, resultado.esc.correo)) {
      resultadoArchivo.estado = 'error';
      resultadoArchivo.mensajeInformativo = null;
      resultadoArchivo.errores = [
        ...resultadoArchivo.errores,
        'El CCT y el correo deben coincidir con los registrados en tu primer envío.'
      ];
      return;
    }

    const correoFormulario = this.correoControl.value.trim().toLowerCase();
    const correoEnArchivo = (resultado.esc.correo ?? '').trim().toLowerCase();

    if (correoFormulario !== correoEnArchivo) {
      resultadoArchivo.estado = 'error';
      resultadoArchivo.mensajeInformativo = null;
      resultadoArchivo.errores = [
        ...resultadoArchivo.errores,
        'El correo capturado debe coincidir con el que aparece en la hoja ESC del archivo.'
      ];
      return;
    }

    let habiaCredenciales = false;
    let nuevasCredenciales: { contrasena: string; esNueva: boolean } | null = null;

    try {
      habiaCredenciales = !!this.authService.obtenerCredenciales();
      nuevasCredenciales = this.authService.registrarCredenciales(resultado.esc.cct, resultado.esc.correo);
    } catch (error) {
      resultadoArchivo.estado = 'error';
      resultadoArchivo.mensajeInformativo = null;
      resultadoArchivo.errores = [
        ...resultadoArchivo.errores,
        error instanceof Error
          ? error.message
          : 'No pudimos validar tus credenciales. Usa el CCT y correo originales.'
      ];
      return;
    }

    resultadoArchivo.estado = 'exito';
    resultadoArchivo.mensajeInformativo =
      'Validación exitosa. Podrás consultar tus resultados a partir del día: ' +
      fechaDisponible.toLocaleDateString();
    resultadoArchivo.resultadoExito = {
      mensaje: `Podrás consultar tus resultados a partir del día: ${fechaDisponible.toLocaleDateString()}`,
      fechaDisponible,
      credenciales: {
        usuario: resultado.esc.correo,
        contrasena: nuevasCredenciales?.contrasena ?? '',
        esNueva: (nuevasCredenciales?.esNueva ?? false) && !habiaCredenciales
      },
      totalAlumnos: resultado.alumnos?.length ?? 0
    };

    this.credencialesMostradas = {
      usuario: resultadoArchivo.resultadoExito.credenciales.usuario,
      contrasena: resultadoArchivo.resultadoExito.credenciales.contrasena,
      esNueva: resultadoArchivo.resultadoExito.credenciales.esNueva
    };

    this.actualizarEstadoSesion();
  }

  private calcularFechaDisponible(): Date {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 4);
    return fecha;
  }

  onEliminarResultado(resultado: ResultadoArchivo): void {
    this.resultados = this.resultados.filter((item) => item !== resultado);
  }

  limpiarSeleccion(input: HTMLInputElement): void {
    input.value = '';
    this.resultados = [];
  }

  private async mostrarConfirmacionGuardado(
    resultado: ResultadoGuardado,
    tipo: 'guardado' | 'reemplazo',
    resultadoArchivo: ResultadoArchivo
  ): Promise<void> {
    resultadoArchivo.rutaGuardado = resultado.rutaVirtual;
    resultadoArchivo.modoGuardado = resultado.modo;
    resultadoArchivo.notaGuardado = resultado.nota;
    resultadoArchivo.guardado = true;
    resultadoArchivo.mensajeInformativo =
      'El archivo se conservó en el almacenamiento local del navegador. Copia el archivo a assets/archivos/preescolar/ en tu proyecto si lo necesitas.';

    const esReemplazo = tipo === 'reemplazo';

    await Swal.fire({
      icon: 'success',
      title: esReemplazo ? 'Archivo sustituido' : 'Archivo guardado',
      text: esReemplazo
        ? 'Se reemplazó la copia previa con la nueva versión.'
        : 'Se guardó una copia en el almacenamiento local del navegador.',
      footer: resultadoArchivo.rutaGuardado ? `Ruta sugerida: ${resultadoArchivo.rutaGuardado}` : undefined
    });
  }

  private actualizarEstadoSesion(): void {
    const credenciales = this.authService.obtenerCredenciales();
    this.sesionActiva = this.authService.estaAutenticado();
    this.tieneCredenciales = !!credenciales;
    this.correoSesion = credenciales?.correo ?? null;

    if (!this.credencialesMostradas && credenciales) {
      this.credencialesMostradas = {
        usuario: credenciales.correo,
        contrasena: credenciales.contrasena,
        esNueva: false
      };
    }

    if (this.sesionActiva && credenciales?.correo && !this.correoControl.value.trim()) {
      this.correoControl.setValue(credenciales.correo);
    }
  }
}
