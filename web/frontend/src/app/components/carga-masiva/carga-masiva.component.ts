import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  ExcelValidationService,
  ResultadoValidacion,
  TipoArchivoCarga
} from '../../services/excel-validation.service';
import {
  ArchivoDuplicadoError,
  ArchivoStorageService,
  ResultadoGuardado
} from '../../services/archivo-storage.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { EscDatos } from '../../services/excel-validation.service';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { EstadoCredencialesService } from '../../services/estado-credenciales.service';
import { MockPdfService } from '../../services/mock-pdf.service';
import { UsuariosService } from '../../services/usuarios.service';
import { EvaluacionesService } from '../../services/evaluaciones.service';

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
  erroresAgrupados: GrupoErrores[];
  advertencias: string[];
  resultadoExito: ResultadoExito | null;
  mensajeInformativo: string | null;
  tipoDetectado: TipoArchivoCarga | null;
  escDatos: EscDatos | null;
  guardando: boolean;
  guardado: boolean;
  rutaGuardado: string | null;
  errorGuardado: string | null;
  modoGuardado: 'localStorage' | null;
  notaGuardado: string | null;
  pdfEstado: 'idle' | 'generando' | 'descargando' | 'listo' | 'error';
  pdfMensaje: string | null;
  pdfError: string | null;
  pdfNombre: string | null;
  pdfTipo: 'exito' | 'error' | null;
}

interface GrupoErrores {
  hoja: string;
  ubicaciones: Array<{
    titulo: string;
    items: string[];
  }>;
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
export class CargaMasivaComponent implements OnInit, OnDestroy {
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
  credencialesAsociadas = false;
  contrasenaAsociada: string | null = null;
  guardandoTodo = false;
  trackByArchivo = (_: number, item: ResultadoArchivo): string =>
    `${item.archivo.name}-${item.archivo.lastModified.getTime()}`;

  private readonly destroy$ = new Subject<void>();

  get hayErrores(): boolean {
    return this.resultados.some((resultado) => resultado.estado === 'error');
  }

  get mostrarCargaMasiva(): boolean {
    return this.resultados.length > 2;
  }

  get resultadosValidosSinGuardar(): ResultadoArchivo[] {
    return this.resultados.filter((resultado) => resultado.estado === 'exito' && !resultado.guardado);
  }

  get puedeCargarTodo(): boolean {
    return this.correoControl.valid && this.resultadosValidosSinGuardar.length > 0 && !this.guardandoTodo;
  }

  constructor(
    private readonly excelValidationService: ExcelValidationService,
    private readonly archivoStorageService: ArchivoStorageService,
    private readonly authService: AuthService,
    private readonly estadoCredencialesService: EstadoCredencialesService,
    private readonly mockPdfService: MockPdfService,
    private readonly usuariosService: UsuariosService,
    private readonly evaluacionesService: EvaluacionesService,
    private readonly router: Router
  ) { }

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
    this.inicializarEstadoCredenciales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      erroresAgrupados: [],
      advertencias: [],
      resultadoExito: null,
      mensajeInformativo: 'Validando tu archivo con el correo ingresado...',
      tipoDetectado: null,
      escDatos: null,
      guardando: false,
      guardado: false,
      rutaGuardado: null,
      errorGuardado: null,
      modoGuardado: null,
      notaGuardado: null,
      pdfEstado: 'idle',
      pdfMensaje: null,
      pdfError: null,
      pdfNombre: null,
      pdfTipo: null
    };

    this.resultados = [resultadoArchivo, ...this.resultados];

    const extensionValida = this.extensionesPermitidas.some((extension) =>
      file.name.toLowerCase().endsWith(extension)
    );

    if (!extensionValida) {
      this.actualizarErrores(resultadoArchivo, ['Formato no permitido. Usa únicamente archivos .xlsx']);
      await this.finalizarConError(resultadoArchivo);
      return;
    }

    const tamanioMb = file.size / (1024 * 1024);
    if (tamanioMb > this.pesoMaximoMb) {
      this.actualizarErrores(resultadoArchivo, [`El archivo supera los ${this.pesoMaximoMb} MB permitidos.`]);
      await this.finalizarConError(resultadoArchivo);
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const deteccion = await this.excelValidationService.detectarNivelConDetalle(buffer);
      resultadoArchivo.tipoDetectado = deteccion.nivel;

      if (!deteccion.nivel) {
        resultadoArchivo.mensajeInformativo = 'No se reconoció el nivel del archivo.';
        this.actualizarErrores(
          resultadoArchivo,
          deteccion.mensajesError.length
            ? deteccion.mensajesError
            : [
              'No se reconoció el formato. Verifica que sea una plantilla válida de Preescolar, Primaria o Secundaria.'
            ]
        );
        await this.finalizarConError(resultadoArchivo);
        return;
      }

      resultadoArchivo.mensajeInformativo = `Archivo detectado: ${this.obtenerEtiquetaTipo(deteccion.nivel)}. Validando reglas específicas...`;
      const resultado = await this.validarPorTipo(deteccion.nivel, buffer);
      await this.procesarResultado(resultado, resultadoArchivo);
    } catch (error) {
      this.actualizarErrores(resultadoArchivo, [
        error instanceof Error
          ? error.message
          : 'No se pudo validar el archivo. Inténtalo de nuevo.'
      ]);
      await this.finalizarConError(resultadoArchivo);
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
      // --- INTEGRACIÓN CON BACKEND ---
      resultado.mensajeInformativo = 'Subiendo información a la base de datos...';
      const base64 = await this.fileToBase64(resultado.archivoOriginal);
      const respuestaApi = await firstValueFrom(
        this.evaluacionesService.subirExcel({
          archivoBase64: base64,
          nombreArchivo: resultado.archivo.name,
          cicloEscolar: '2025-2026'
        })
      );

      if (!respuestaApi.success) {
        throw new Error(respuestaApi.message);
      }
      // -------------------------------

      const guardado = await this.archivoStorageService.guardarArchivoPreescolar(resultado.archivoOriginal, {
        cct: resultado.escDatos?.cct,
        correo: this.correoControl.value,
        nivel: resultado.tipoDetectado ?? undefined
      });
      await this.mostrarConfirmacionGuardado(guardado, 'guardado', resultado);
      const credencialesListas = await this.registrarUsuarioYCredenciales(resultado);
      if (!credencialesListas) {
        return;
      }
      if (resultado.escDatos && resultado.resultadoExito && resultado.pdfTipo !== 'exito') {
        await this.generarPdfExito(
          resultado,
          resultado.escDatos,
          resultado.resultadoExito.fechaDisponible,
          resultado.resultadoExito.totalAlumnos
        );
      }
    } catch (error) {
      if (error instanceof ArchivoDuplicadoError) {
        const confirmacion = await Swal.fire({
          icon: 'question',
          title: 'Archivo ya existe',
          text: `Ya tienes una copia del archivo "${resultado.archivo.name}" con el mismo contenido. ¿Quieres sustituirla?`,
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
                correo: this.correoControl.value,
                nivel: resultado.tipoDetectado ?? undefined
              }
            );
            await this.mostrarConfirmacionGuardado(resultadoReemplazo, 'reemplazo', resultado);
            const credencialesListas = await this.registrarUsuarioYCredenciales(resultado);
            if (!credencialesListas) {
              return;
            }
            if (resultado.escDatos && resultado.resultadoExito && resultado.pdfTipo !== 'exito') {
              await this.generarPdfExito(
                resultado,
                resultado.escDatos,
                resultado.resultadoExito.fechaDisponible,
                resultado.resultadoExito.totalAlumnos
              );
            }
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

  private async registrarUsuarioYCredenciales(resultado: ResultadoArchivo): Promise<boolean> {
    if (!resultado.escDatos || !resultado.resultadoExito) {
      resultado.errorGuardado = 'No se encontró la información de la escuela para registrar tus credenciales.';
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo registrar',
        text: resultado.errorGuardado
      });
      return false;
    }

    const credencialesExistentes = this.authService.obtenerCredenciales();

    if (credencialesExistentes) {
      resultado.resultadoExito.credenciales = {
        usuario: credencialesExistentes.correo,
        contrasena: credencialesExistentes.contrasena,
        esNueva: false
      };
      this.credencialesMostradas = {
        usuario: credencialesExistentes.correo,
        contrasena: credencialesExistentes.contrasena,
        esNueva: false
      };
      this.estadoCredencialesService.actualizar(
        credencialesExistentes.correo,
        credencialesExistentes.contrasena
      );
      this.actualizarEstadoSesion();
      return true;
    }

    const contrasenaGenerada = this.authService.generarContrasenaTemporal();

    try {
      await firstValueFrom(
        this.usuariosService.crearUsuario({
          email: resultado.escDatos.correo,
          rol: 'RESPONSABLE_CCT',
          clavesCCT: [resultado.escDatos.cct],
          password: contrasenaGenerada
        })
      );
    } catch (error) {
      resultado.errorGuardado =
        error instanceof Error
          ? error.message
          : 'No pudimos registrar el usuario en el sistema. Intenta nuevamente.';
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo registrar',
        text: resultado.errorGuardado
      });
      return false;
    }

    try {
      const nuevasCredenciales = this.authService.registrarCredenciales(
        resultado.escDatos.cct,
        resultado.escDatos.correo,
        contrasenaGenerada
      );
      this.estadoCredencialesService.actualizar(
        resultado.escDatos.correo,
        nuevasCredenciales.contrasena
      );
      resultado.resultadoExito.credenciales = {
        usuario: resultado.escDatos.correo,
        contrasena: nuevasCredenciales.contrasena,
        esNueva: nuevasCredenciales.esNueva
      };
      this.credencialesMostradas = {
        usuario: resultado.escDatos.correo,
        contrasena: nuevasCredenciales.contrasena,
        esNueva: nuevasCredenciales.esNueva
      };
      this.actualizarEstadoSesion();
      return true;
    } catch (error) {
      resultado.errorGuardado =
        error instanceof Error
          ? error.message
          : 'No pudimos registrar tus credenciales. Intenta nuevamente.';
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo registrar',
        text: resultado.errorGuardado
      });
      return false;
    }
  }

  async guardarTodo(): Promise<void> {
    if (!this.correoControl.valid) {
      this.correoControl.markAllAsTouched();
      await Swal.fire({
        icon: 'warning',
        title: 'Correo requerido',
        text: 'Agrega un correo electrónico válido antes de guardar tus archivos.'
      });
      return;
    }

    if (!this.resultadosValidosSinGuardar.length) {
      await Swal.fire({
        icon: 'info',
        title: 'Sin archivos listos',
        text: 'No hay archivos validados correctamente para guardar.'
      });
      return;
    }

    this.guardandoTodo = true;

    try {
      for (const resultado of this.resultadosValidosSinGuardar) {
        await this.guardarArchivo(resultado);
      }
    } finally {
      this.guardandoTodo = false;
    }
  }

  private async procesarResultado(
    resultado: ResultadoValidacion,
    resultadoArchivo: ResultadoArchivo
  ): Promise<void> {
    this.actualizarErrores(resultadoArchivo, resultado.errores);
    resultadoArchivo.advertencias = resultado.advertencias;
    resultadoArchivo.escDatos = resultado.esc ?? null;

    if (!resultado.ok || !resultado.esc) {
      resultadoArchivo.mensajeInformativo = this.construirMensajeDeteccion(
        resultadoArchivo.tipoDetectado,
        resultadoArchivo.errores[0]
      );
      await this.finalizarConError(resultadoArchivo);
      return;
    }

    const fechaDisponible = this.calcularFechaDisponible();
    const credencialesValidas = this.authService.coincidenCredenciales(
      resultado.esc.cct,
      resultado.esc.correo
    );

    if (!credencialesValidas) {
      this.agregarErrores(resultadoArchivo, [
        'Ya existe un acceso asociado a otro CCT o correo. Usa las credenciales originales.'
      ]);
      await this.finalizarConError(resultadoArchivo);
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
        contrasena: '',
        esNueva: false
      },
      totalAlumnos: resultado.alumnos?.length ?? 0
    };
  }

  private validarPorTipo(tipo: TipoArchivoCarga, buffer: ArrayBuffer): Promise<ResultadoValidacion> {
    switch (tipo) {
      case 'preescolar':
        return this.excelValidationService.validarPreescolar(buffer);
      case 'primaria':
        return this.excelValidationService.validarPrimaria(buffer);
      case 'secundaria':
        return this.excelValidationService.validarSecundaria(buffer);
      default:
        return Promise.resolve({
          ok: false,
          errores: ['No se pudo determinar el tipo de archivo para validarlo.'],
          advertencias: []
        });
    }
  }

  private calcularFechaDisponible(): Date {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 4);
    return fecha;
  }

  onEliminarResultado(resultado: ResultadoArchivo): void {
    this.resultados = this.resultados.filter((item) => item !== resultado);
  }

  limpiarResultados(): void {
    this.resultados = [];
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
      'El archivo se conservó en el almacenamiento local del navegador. Copia el archivo a ' +
      `${this.obtenerRutaReferencia(resultadoArchivo.tipoDetectado)} en tu proyecto si lo necesitas.`;

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

    this.establecerCredencialesMostradas();

    if (credenciales?.correo && !this.correoControl.value.trim()) {
      this.correoControl.setValue(credenciales.correo);
    }
  }

  private inicializarEstadoCredenciales(): void {
    const credencialesGuardadas = this.estadoCredencialesService.obtener();

    if (credencialesGuardadas && !this.correoControl.value.trim()) {
      this.correoControl.setValue(credencialesGuardadas.correo);
    }

    this.establecerCredencialesMostradas();
    this.actualizarAvisoCredenciales(this.correoControl.value);

    this.correoControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((correo) => {
      this.actualizarAvisoCredenciales(correo);
    });
  }

  private establecerCredencialesMostradas(): void {
    const credencialesExistentes = this.authService.obtenerCredenciales();
    const credencialesGuardadas = this.estadoCredencialesService.obtener();

    const credencialesFuente = credencialesGuardadas ?? credencialesExistentes;

    if (!this.credencialesMostradas && credencialesFuente) {
      this.credencialesMostradas = {
        usuario: credencialesFuente.correo,
        contrasena: credencialesFuente.contrasena,
        esNueva: false
      };
    }
  }

  private actualizarAvisoCredenciales(correo: string): void {
    const credencialesGuardadas = this.estadoCredencialesService.obtener();
    const correoNormalizado = (correo ?? '').trim().toLowerCase();
    const coincideCorreo = credencialesGuardadas?.correo === correoNormalizado;

    this.credencialesAsociadas = coincideCorreo;
    this.contrasenaAsociada = coincideCorreo ? credencialesGuardadas?.contrasena ?? null : null;
  }

  private async generarPdfExito(
    resultadoArchivo: ResultadoArchivo,
    esc: EscDatos,
    fechaDisponible: Date,
    totalAlumnos: number
  ): Promise<void> {
    resultadoArchivo.pdfTipo = 'exito';
    resultadoArchivo.pdfEstado = 'generando';
    resultadoArchivo.pdfMensaje = 'Preparando el PDF de confirmación...';
    resultadoArchivo.pdfError = null;
    resultadoArchivo.pdfNombre = `comprobante-${esc.cct.toLowerCase()}-${Date.now()}.pdf`;

    try {
      const blob = await this.mockPdfService.generarPdfExito({
        correo: esc.correo,
        contrasena: resultadoArchivo.resultadoExito?.credenciales.contrasena ?? '',
        fechaDisponible: fechaDisponible.toLocaleDateString(),
        alumnosValidados: totalAlumnos,
        cct: esc.cct,
        fechaValidacion: new Date().toLocaleString()
      });
      resultadoArchivo.pdfEstado = 'descargando';
      this.mockPdfService.descargarPdf(blob, resultadoArchivo.pdfNombre);
      resultadoArchivo.pdfEstado = 'listo';
      resultadoArchivo.pdfMensaje = 'PDF de confirmación descargado correctamente.';
    } catch (error) {
      resultadoArchivo.pdfEstado = 'error';
      resultadoArchivo.pdfError =
        error instanceof Error ? error.message : 'No se pudo descargar el PDF de confirmación.';
      resultadoArchivo.pdfMensaje = 'No pudimos entregar tu PDF. Reintenta la descarga.';
    }
  }

  private async generarPdfErrores(resultadoArchivo: ResultadoArchivo): Promise<void> {
    resultadoArchivo.pdfTipo = 'error';
    resultadoArchivo.pdfEstado = 'generando';
    resultadoArchivo.pdfMensaje = 'Creando PDF con el detalle de errores...';
    resultadoArchivo.pdfError = null;
    const nombreBase = resultadoArchivo.archivo.name.replace(/\s+/g, '-').replace(/\.[^/.]+$/, '');
    resultadoArchivo.pdfNombre = `errores-${nombreBase}.pdf`;

    try {
      const blob = await this.mockPdfService.generarPdfErrores({
        correo: this.correoControl.value,
        errores: resultadoArchivo.errores,
        advertencias: resultadoArchivo.advertencias,
        archivo: resultadoArchivo.archivo.name
      });
      resultadoArchivo.pdfEstado = 'descargando';
      this.mockPdfService.descargarPdf(blob, resultadoArchivo.pdfNombre);
      resultadoArchivo.pdfEstado = 'listo';
      resultadoArchivo.pdfMensaje = 'PDF de errores descargado para revisar detalles.';
    } catch (error) {
      resultadoArchivo.pdfEstado = 'error';
      resultadoArchivo.pdfError =
        error instanceof Error ? error.message : 'No se pudo descargar el PDF de errores.';
      resultadoArchivo.pdfMensaje = 'No pudimos entregar el PDF de errores. Reintenta la descarga.';
    }
  }

  async reintentarDescargaPdf(resultadoArchivo: ResultadoArchivo): Promise<void> {
    if (resultadoArchivo.pdfTipo === 'exito' && resultadoArchivo.resultadoExito && resultadoArchivo.escDatos) {
      await this.generarPdfExito(
        resultadoArchivo,
        resultadoArchivo.escDatos,
        resultadoArchivo.resultadoExito.fechaDisponible,
        resultadoArchivo.resultadoExito.totalAlumnos
      );
    }

    if (resultadoArchivo.pdfTipo === 'error') {
      await this.generarPdfErrores(resultadoArchivo);
    }
  }

  private async finalizarConError(resultadoArchivo: ResultadoArchivo): Promise<void> {
    resultadoArchivo.estado = 'error';
    resultadoArchivo.mensajeInformativo =
      resultadoArchivo.mensajeInformativo ??
      this.construirMensajeDeteccion(resultadoArchivo.tipoDetectado, resultadoArchivo.errores[0]);
    await this.generarPdfErrores(resultadoArchivo);
  }

  private actualizarErrores(resultadoArchivo: ResultadoArchivo, errores: string[]): void {
    resultadoArchivo.errores = [...errores];
    resultadoArchivo.erroresAgrupados = this.agruparErrores(resultadoArchivo.errores);
  }

  private agregarErrores(resultadoArchivo: ResultadoArchivo, errores: string[]): void {
    resultadoArchivo.errores = [...resultadoArchivo.errores, ...errores];
    resultadoArchivo.erroresAgrupados = this.agruparErrores(resultadoArchivo.errores);
  }

  private agruparErrores(errores: string[]): GrupoErrores[] {
    const mapa = new Map<string, Map<string, string[]>>();

    errores.forEach((error) => {
      const hoja = this.extraerHoja(error);
      const ubicacion = this.extraerUbicacion(error);
      const mensaje = this.normalizarMensajeError(error, hoja);

      if (!mapa.has(hoja)) {
        mapa.set(hoja, new Map<string, string[]>());
      }

      const ubicaciones = mapa.get(hoja)!;
      if (!ubicaciones.has(ubicacion)) {
        ubicaciones.set(ubicacion, []);
      }

      ubicaciones.get(ubicacion)!.push(mensaje);
    });

    return Array.from(mapa.entries()).map(([hoja, ubicaciones]) => ({
      hoja,
      ubicaciones: Array.from(ubicaciones.entries()).map(([titulo, items]) => ({
        titulo,
        items
      }))
    }));
  }

  private extraerHoja(error: string): string {
    const matchNivelHoja = error.match(/(?:Primaria|Secundaria)\s+([A-ZÁÉÍÓÚÑ]+)/i);
    if (matchNivelHoja?.[1]) {
      return matchNivelHoja[1].toUpperCase();
    }

    const matchHoja = error.match(/hojas?\s+([A-ZÁÉÍÓÚÑ]+)/i);
    if (matchHoja?.[1]) {
      return matchHoja[1].toUpperCase();
    }

    return 'General';
  }

  private extraerUbicacion(error: string): string {
    const matchFila = error.match(/Fila\s+(\d+)/i);
    if (matchFila?.[1]) {
      return `Fila ${matchFila[1]}`;
    }

    const matchEncabezado = error.match(/encabezado\s+([A-Z]+)\d+/i);
    if (matchEncabezado?.[1]) {
      return `Columna ${matchEncabezado[1].toUpperCase()}`;
    }

    return 'General';
  }

  private normalizarMensajeError(error: string, hoja: string): string {
    if (hoja !== 'General') {
      return error
        .replace(/^(Primaria|Secundaria)\s+[A-ZÁÉÍÓÚÑ]+\s*-\s*/i, '')
        .replace(/^(Primaria|Secundaria)\s+[A-ZÁÉÍÓÚÑ]+:\s*/i, '')
        .replace(/^(Primaria|Secundaria):\s*/i, '')
        .trim();
    }

    return error.trim();
  }

  private obtenerRutaReferencia(tipo: TipoArchivoCarga | null): string {
    const nivel = tipo ?? 'preescolar';
    return `assets/archivos/${nivel}/`;
  }

  obtenerEtiquetaTipo(tipo: TipoArchivoCarga | null): string {
    switch (tipo) {
      case 'preescolar':
        return 'Preescolar';
      case 'primaria':
        return 'Primaria';
      case 'secundaria':
        return 'Secundaria';
      default:
        return 'Desconocido';
    }
  }

  private construirMensajeDeteccion(tipo: TipoArchivoCarga | null, error?: string): string {
    if (!tipo) {
      return 'No se reconoció el formato.';
    }

    const etiqueta = this.obtenerEtiquetaTipo(tipo);
    if (error) {
      return `Archivo detectado: ${etiqueta}. ${error}`;
    }

    return `Archivo detectado: ${etiqueta}.`;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  }
}
