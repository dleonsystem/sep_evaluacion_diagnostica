import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  ExcelValidationService,
  ResultadoValidacion,
  TipoArchivoCarga
} from '../../services/excel-validation.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { EscDatos } from '../../services/excel-validation.service';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { EstadoCredencialesService } from '../../services/estado-credenciales.service';
import { GraphqlService } from '../../services/graphql.service';
import { MockPdfService, GrupoErrores } from '../../services/mock-pdf.service';
import { UsuariosService } from '../../services/usuarios.service';
import { EvaluacionesService, ExcelValidationError } from '../../services/evaluaciones.service';
import { timeout, catchError, throwError, debounceTime, distinctUntilChanged } from 'rxjs';
import { CHECK_USER_EXISTS } from '../../operations/query';

interface ResultadoExito {
  mensaje: string;
  fechaDisponible: Date;
  credenciales: { usuario: string; contrasena: string; esNueva: boolean };
  totalAlumnos: number;
  consecutivo: string; // Trazabilidad
}

interface ResultadoArchivo {
  archivo: {
    name: string;
    sizeKb: number;
    lastModified: Date;
  };
  archivoOriginal: File;
  estado: 'idle' | 'validando' | 'exito' | 'error' | 'guardando';
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
  pdfBlob?: Blob;
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
  private historialFallos: Map<string, Map<string, number>> = new Map();
  private contextoFalloActual: { correo: string, idArchivo: string } | null = null;
  readonly umbralFallosTicket = 3;
  mostrarModalIncidencia = false;
  isDragging = false;

  evidenciasIncidencia: any[] = [];
  readonly maxEvidenciasIncidencia = 5;
  readonly extensionesEvidencias = ['.pdf', '.jpg', '.jpeg', '.png'];

  readonly incidenciaForm = new FormGroup({
    nombreCompleto: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    cct: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(10)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(5)] })
  });
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
    return (this.correoControl.valid || this.correoControl.disabled) &&
      this.resultadosValidosSinGuardar.length > 0 &&
      !this.guardandoTodo;
  }

  constructor(
    private readonly excelValidationService: ExcelValidationService,
    private readonly authService: AuthService,
    private readonly estadoCredencialesService: EstadoCredencialesService,
    private readonly graphqlService: GraphqlService,
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
    this.inicializarEstadoCredenciales();
    this.actualizarEstadoSesion();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async onArchivoSeleccionado(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivos = input.files ? Array.from(input.files) : [];

    if (this.correoControl.invalid) {
      this.correoControl.markAllAsTouched();
      await Swal.fire({
        icon: 'warning',
        title: 'Correo requerido',
        text: 'Ingresa un correo electrónico válido antes de cargar tu archivo.'
      });
      this.limpiarSeleccion(input);
      return;
    }

    if (this.authService.requiereLoginParaNuevaCarga(this.correoControl.value) || await this.verificarExistenciaUsuario(this.correoControl.value)) {
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

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.correoControl.valid) {
      this.isDragging = true;
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  // Issue #373: Evitar que el navegador abra el archivo si se suelta fuera del área de drop
  @HostListener('window:dragover', ['$event'])
  onWindowDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener('window:drop', ['$event'])
  onWindowDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (this.correoControl.invalid) {
      this.correoControl.markAllAsTouched();
      await Swal.fire({
        icon: 'warning',
        title: 'Correo requerido',
        text: 'Ingresa un correo electrónico válido antes de arrastrar tu archivo.'
      });
      return;
    }

    if (this.authService.requiereLoginParaNuevaCarga(this.correoControl.value) || await this.verificarExistenciaUsuario(this.correoControl.value)) {
      return;
    }

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await this.procesarArchivo(files[i]);
      }
    }
  }

  private async mostrarAvisoLogin(): Promise<void> {
    await Swal.fire({
      icon: 'info',
      title: 'Inicia sesión',
      text: 'Ya registraste un envío. Inicia sesión para cargar un nuevo archivo.',
      confirmButtonText: 'Ir a login'
    });
    void this.router.navigate(['/login'], { queryParams: { redirect: '/carga-masiva' } });
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

  private generarIdArchivo(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  private registrarIntentoFallido(resultadoArchivo: ResultadoArchivo): void {
    const correo = this.authService.normalizarCorreo(this.correoControl.value || this.correoSesion || '');
    if (!correo || !resultadoArchivo.archivoOriginal) return;

    const idArchivo = this.generarIdArchivo(resultadoArchivo.archivoOriginal);
    
    if (!this.historialFallos.has(correo)) {
      this.historialFallos.set(correo, new Map<string, number>());
    }

    const fallosUsuario = this.historialFallos.get(correo)!;
    const conteoActual = (fallosUsuario.get(idArchivo) || 0) + 1;
    fallosUsuario.set(idArchivo, conteoActual);

    console.log(`--- Registro de Intento Fallido [${correo}] ---`);
    console.log(`Archivo: ${resultadoArchivo.archivo.name} | Fallos: ${conteoActual}`);

    if (conteoActual >= this.umbralFallosTicket) {
      console.log(`Umbral alcanzado (>=${this.umbralFallosTicket}). Abriendo modal de incidencia...`);
      this.contextoFalloActual = { correo, idArchivo };
      this.abrirModalIncidencia(resultadoArchivo);
    }
  }

  abrirModalIncidencia(resultadoArchivo?: ResultadoArchivo): void {
    let preDescripcion = '';
    if (resultadoArchivo) {
      const errString = resultadoArchivo.errores.map((e, index) => `${index + 1}. ${e}`).join('\n');
      preDescripcion = `Registro técnico (Fallos de Validación):\n${errString}\n\n`;

      // Auto-adjuntar la evidencia generada en PDF del dictamen técnico,
      // dado que los archivos .xlsx no están permitidos por el formulario de tickets.
      if (resultadoArchivo.pdfBlob && resultadoArchivo.pdfNombre) {
        const pdfFile = new File([resultadoArchivo.pdfBlob], resultadoArchivo.pdfNombre, { type: 'application/pdf' });
        const yaAdjunto = this.evidenciasIncidencia.find(e => e.archivo.name === pdfFile.name);
        if (!yaAdjunto) {
          this.evidenciasIncidencia.push({
            id: Math.random().toString(36).substring(2),
            archivo: pdfFile
          });
        }
      }
    }

    this.incidenciaForm.patchValue({
      email: this.correoControl.value,
      descripcion: preDescripcion
    });
    this.mostrarModalIncidencia = true;
  }

  cerrarModalIncidencia(): void {
    this.mostrarModalIncidencia = false;
    
    // Resetear solo el contador del contexto que disparó el modal
    if (this.contextoFalloActual) {
      const { correo, idArchivo } = this.contextoFalloActual;
      this.historialFallos.get(correo)?.delete(idArchivo);
      this.contextoFalloActual = null;
    }

    this.evidenciasIncidencia = [];
  }

  onEvidenciaIncidenciaSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';

    if (!archivo) return;

    if (this.evidenciasIncidencia.length >= this.maxEvidenciasIncidencia) {
      void Swal.fire('Límite alcanzado', `Máximo ${this.maxEvidenciasIncidencia} archivos.`, 'warning');
      return;
    }

    const ext = archivo.name.toLowerCase().substring(archivo.name.lastIndexOf('.'));
    if (!this.extensionesEvidencias.includes(ext)) {
      void Swal.fire('Archivo no permitido', `Solo se aceptan: ${this.extensionesEvidencias.join(', ')}`, 'error');
      return;
    }

    this.evidenciasIncidencia.push({
      id: Math.random().toString(36).substring(2),
      archivo
    });
  }

  eliminarEvidenciaIncidencia(index: number): void {
    this.evidenciasIncidencia.splice(index, 1);
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  async enviarIncidenciaPublica(): Promise<void> {
    if (this.incidenciaForm.invalid) {
      this.incidenciaForm.markAllAsTouched();
      return;
    }

    try {
      const data = this.incidenciaForm.getRawValue();

      const evidenciasBase64 = await Promise.all(
        this.evidenciasIncidencia.map(async ev => ({
          nombre: ev.archivo.name,
          base64: await this.fileToBase64(ev.archivo),
          tipo: ev.archivo.type
        }))
      );

      const mutation = `
        mutation CreatePublicIncident($input: CreatePublicIncidentInput!) {
          createPublicIncident(input: $input) {
            numeroTicket
          }
        }
      `;

      const variables = {
        input: {
          nombreCompleto: data.nombreCompleto,
          cct: data.cct,
          email: data.email,
          descripcion: data.descripcion,
          evidencias: evidenciasBase64
        }
      };

      await firstValueFrom(this.graphqlService.execute(mutation, variables));

      await Swal.fire({
        icon: 'success',
        title: 'Incidencia reportada',
        text: 'Se ha mandado correctamente su información capturada. El sistema generará un ticket para darle atención.',
        confirmButtonColor: '#00695c'
      });

      this.cerrarModalIncidencia();
      this.incidenciaForm.reset();
    } catch (error) {
      console.error('Error enviando incidencia:', error);
      await Swal.fire('Error', 'No se pudo enviar el reporte en este momento.', 'error');
    }
  }

  async guardarArchivo(resultado: ResultadoArchivo): Promise<void> {
    if (this.correoControl.invalid) {
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

    resultado.estado = 'guardando';
    resultado.guardando = true;
    resultado.errorGuardado = null;
    resultado.rutaGuardado = null;
    resultado.modoGuardado = null;
    resultado.notaGuardado = null;

    if (this.sesionActiva && this.correoSesion) {
      this.correoControl.setValue(this.correoSesion);
    }

    // Solo ocultamos la caja de credenciales si el correo es distinto
    // así evitamos que "desaparezca" visualmente la contraseña durante la subida.
    if (this.credencialesMostradas?.usuario !== this.correoControl.value) {
      this.credencialesMostradas = null;
    }

    try {
      resultado.mensajeInformativo = 'Sincronizando con base de datos y SFTP institucional...';
      const base64 = await this.fileToBase64(resultado.archivoOriginal);

      let respuestaApi = await this.ejecutarCargaServidor(base64, resultado.archivo.name, false);

      if (!respuestaApi.success && respuestaApi.duplicadoDetectado) {
        const confirm = await Swal.fire({
          icon: 'question',
          title: 'Archivo duplicado',
          text: respuestaApi.message,
          showCancelButton: true,
          confirmButtonText: 'Sí, reemplazar',
          cancelButtonText: 'No, cancelar'
        });

        if (confirm.isConfirmed) {
          resultado.mensajeInformativo = 'Reemplazando versión anterior en el servidor...';
          respuestaApi = await this.ejecutarCargaServidor(base64, resultado.archivo.name, true);
        } else {
          resultado.estado = 'idle';
          resultado.guardando = false;
          resultado.mensajeInformativo = 'Carga cancelada por el usuario.';
          return;
        }
      }

      if (!respuestaApi.success) {
        throw new Error(respuestaApi.message);
      }

      resultado.guardado = true;
      resultado.estado = 'exito';

      if (resultado.resultadoExito && respuestaApi.consecutivo) {
        resultado.resultadoExito.consecutivo = respuestaApi.consecutivo;
      }

      resultado.mensajeInformativo = `El archivo se recibió correctamente. Folio de seguimiento: ${respuestaApi.consecutivo || 'Pendiente'}`;

      // CRÍTICO: SOLO AHORA QUE EL SERVIDOR ACEPTÓ EL ARCHIVO, VINCULAMOS USUARIO
      resultado.mensajeInformativo = 'Sincronizando claves de acceso...';
      const credencialesListas = await this.registrarUsuarioYCredenciales(resultado, respuestaApi.generatedPassword);

      if (!credencialesListas) {
        console.warn('Advertencia: El archivo se subió pero hubo un problema vinculando las credenciales.');
      }

      // Seguridad: Marcar éxito real para requerir login en futuras subidas distintas
      if (this.correoControl.value) {
        this.authService.confirmarCargaExitosa(this.correoControl.value);
      }

      const textoExito = respuestaApi.consecutivo
        ? `La información se ha sincronizado. Tu folio de seguimiento es: ${respuestaApi.consecutivo}`
        : 'La información se ha sincronizado correctamente con el servidor.';

      await Swal.fire({
        icon: 'success',
        title: 'Archivo cargado',
        text: textoExito,
      });

      if (resultado.escDatos && resultado.resultadoExito && resultado.pdfTipo !== 'exito') {
        await this.generarPdfExito(
          resultado,
          resultado.escDatos,
          resultado.resultadoExito.fechaDisponible,
          resultado.resultadoExito.totalAlumnos,
        );
      }

      // Limpiar el correo tras éxito para evitar que el mensaje de "ya tienes credenciales" 
      // confunda al usuario si desea hacer una carga nueva/distinta.
      if (!this.sesionActiva) {
        this.correoControl.setValue('');
        this.correoControl.markAsPristine();
        this.correoControl.markAsUntouched();
        this.actualizarEstadoSesion();
      }
    } catch (error: any) {
      resultado.estado = 'error';

      // Intentar extraer errores estructurados del error de GraphQL si es posible
      const graphQLErrors = error?.graphQLErrors?.[0]?.extensions?.detalles?.erroresEstructurados;
      if (graphQLErrors) {
        this.actualizarErrores(resultado, [], graphQLErrors);
      } else if (error?.detalles?.erroresEstructurados) {
        this.actualizarErrores(resultado, [], error.detalles.erroresEstructurados);
      }

      resultado.errorGuardado = error instanceof Error
        ? error.message
        : 'No se pudo cargar el archivo al servidor. Inténtalo de nuevo.';

      await Swal.fire({
        icon: 'error',
        title: 'Error de carga',
        text: resultado.errorGuardado,
      });
      this.registrarIntentoFallido(resultado);
    } finally {
      resultado.guardando = false;
    }
  }

  private ejecutarCargaServidor(base64: string, nombreArchivo: string, confirmarReemplazo: boolean) {
    return firstValueFrom(
      this.evaluacionesService.subirExcel({
        archivoBase64: base64,
        nombreArchivo: nombreArchivo,
        cicloEscolar: '2025-2026',
        email: this.correoControl.value,
        confirmarReemplazo
      }).pipe(
        timeout(120000),
        catchError(err => {
          if (err.name === 'TimeoutError') {
            return throwError(() => new Error('La carga está tomando más tiempo de lo esperado (Timeout).'));
          }
          return throwError(() => err);
        })
      )
    );
  }

  private async registrarUsuarioYCredenciales(resultado: ResultadoArchivo, passwordFromServer?: string): Promise<boolean> {
    if (!resultado.escDatos || !resultado.resultadoExito) {
      resultado.errorGuardado = 'No se encontró la información de la escuela para registrar tus credenciales.';
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo registrar',
        text: resultado.errorGuardado
      });
      return false;
    }

    // SI EL SERVIDOR YA NOS DIO LA CONTRASEÑA (USUARIO NUEVO CREADO EN MUTATION)
    if (passwordFromServer) {
      resultado.resultadoExito.credenciales = {
        usuario: this.correoControl.value,
        contrasena: passwordFromServer,
        esNueva: true
      };
      this.credencialesMostradas = resultado.resultadoExito.credenciales;
      this.authService.registrarCredenciales(resultado.escDatos.cct, this.correoControl.value, passwordFromServer);
      this.actualizarEstadoSesion();
      return true;
    }

    if (this.sesionActiva && this.correoSesion) {
      resultado.resultadoExito.credenciales = {
        usuario: this.correoSesion,
        contrasena: '********',
        esNueva: false
      };
      return true;
    }

    const credencialesExistentes = this.authService.obtenerCredenciales();
    const correoActual = this.authService.normalizarCorreo(this.correoControl.value);

    if (credencialesExistentes && credencialesExistentes.correo === correoActual) {
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

    // SI LLEGAMOS AQUÍ Y NO TENEMOS PASSWORD DEL SERVIDOR, EL USUARIO YA EXISTE
    // Recuperar la contraseña de la memoria de esta misma sesión si es posible
    const credsSesion = this.authService.obtenerCredenciales();
    const tieneContrasenaEnMemoria = !!(credsSesion && credsSesion.contrasena && credsSesion.contrasena.length > 3 && credsSesion.contrasena !== '********');

    resultado.resultadoExito.credenciales = {
      usuario: this.correoControl.value,
      contrasena: tieneContrasenaEnMemoria ? credsSesion!.contrasena! : '********',
      esNueva: tieneContrasenaEnMemoria
    };

    if (tieneContrasenaEnMemoria) {
      this.credencialesMostradas = resultado.resultadoExito.credenciales;
      this.authService.registrarCredenciales(resultado.escDatos.cct, this.correoControl.value, credsSesion!.contrasena!);
    } else {
      this.credencialesMostradas = null;
    }

    return true;
  }

  async guardarTodo(): Promise<void> {
    if (this.correoControl.invalid) {
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

    // Ya no bloqueamos si el CCT es diferente. El usuario puede subir cualquier CCT.
    // Solo se valida la estructura y datos del Excel.

    const fechaDisponible = this.calcularFechaDisponible();
    resultadoArchivo.estado = 'exito';
    resultadoArchivo.mensajeInformativo =
      'Validación exitosa. Podrás consultar tus resultados a partir del día: ' +
      fechaDisponible.toLocaleDateString();

    const credsExistentes = this.authService.obtenerCredenciales();
    const esMismoCorreo = credsExistentes?.correo === this.correoControl.value;
    const passParaUI = (esMismoCorreo && credsExistentes?.contrasena && credsExistentes.contrasena !== '********')
      ? credsExistentes.contrasena
      : '';

    resultadoArchivo.resultadoExito = {
      mensaje: `Podrás consultar tus resultados a partir del día: ${fechaDisponible.toLocaleDateString()}`,
      fechaDisponible,
      credenciales: {
        usuario: this.correoControl.value,
        contrasena: passParaUI,
        esNueva: !!passParaUI
      },
      totalAlumnos: resultado.alumnos?.length ?? 0,
      consecutivo: '0' // Se actualizará al guardar real
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


  private actualizarEstadoSesion(): void {
    this.sesionActiva = this.authService.estaAutenticado();
    const credenciales = this.authService.obtenerCredenciales();
    this.tieneCredenciales = !!credenciales;
    this.correoSesion = this.authService.obtenerCorreoSesion();

    if (this.sesionActiva && this.correoSesion) {
      this.correoControl.setValue(this.correoSesion);
      this.correoControl.disable();
    } else {
      this.correoControl.enable();
      // Ya no auto-poblamos el correo desde localStorage al iniciar el componente 
      // para cumplir con la petición de seguridad y "sin rastro".
    }

    this.establecerCredencialesMostradas();
  }

  private inicializarEstadoCredenciales(): void {
    const credencialesGuardadas = this.estadoCredencialesService.obtener();

    // eliminamos la auto-población por seguridad

    this.establecerCredencialesMostradas();
    this.actualizarAvisoCredenciales(this.correoControl.value);

    this.correoControl.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(async (correo) => {
      this.actualizarAvisoCredenciales(correo);
      if (this.correoControl.valid && correo) {
        await this.verificarExistenciaUsuario(correo);
      }
    });
  }

  private async verificarExistenciaUsuario(email: string): Promise<boolean> {
    if (this.sesionActiva) return false; // Si ya hay sesión, no bloqueamos

    try {
      const response = await firstValueFrom(
        this.graphqlService.execute<any>(CHECK_USER_EXISTS, { email: email.trim().toLowerCase() })
      );

      const res = response.data?.checkUserExists;
      if (res?.exists) {
        await Swal.fire({
          icon: 'info',
          title: 'Usuario registrado',
          text: res.message || 'USUARIO YA REGISTRADO; INICIE SESIÓN PARA CARGAR ARCHIVOS.',
          confirmButtonText: 'Ir a login',
          allowOutsideClick: false
        });
        void this.router.navigate(['/login'], { queryParams: { correo: email, redirect: '/carga-masiva' } });
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Error verificando existencia de usuario:', error);
      return false;
    }
  }

  private establecerCredencialesMostradas(): void {
    const correoInput = this.authService.normalizarCorreo(this.correoControl.value);
    const credencialesExistentes = this.authService.obtenerCredenciales();
    const credencialesGuardadas = this.estadoCredencialesService.obtener();

    // Priorizamos las credenciales que coincidan con el correo del input
    let fuente = null;
    if (credencialesGuardadas?.correo === correoInput) fuente = credencialesGuardadas;
    else if (credencialesExistentes?.correo === correoInput) fuente = credencialesExistentes;

    if (fuente) {
      this.credencialesMostradas = {
        usuario: fuente.correo,
        contrasena: fuente.contrasena,
        esNueva: false
      };
    } else {
      this.credencialesMostradas = null;
    }
  }

  private actualizarAvisoCredenciales(correo: string): void {
    const credencialesGuardadas = this.estadoCredencialesService.obtener();
    const correoNormalizado = (correo ?? '').trim().toLowerCase();
    const coincideCorreo = credencialesGuardadas?.correo === correoNormalizado;

    this.credencialesAsociadas = coincideCorreo;
    this.contrasenaAsociada = coincideCorreo ? credencialesGuardadas?.contrasena ?? null : null;

    // Actualizar también la caja de credenciales mostradas al cambiar el correo
    this.establecerCredencialesMostradas();
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
        correo: this.correoSesion || this.correoControl.getRawValue() || this.correoControl.value || '',
        contrasena: resultadoArchivo.resultadoExito?.credenciales.contrasena ?? '',
        fechaDisponible: this.formatearFechaLarga(fechaDisponible),
        alumnosValidados: totalAlumnos,
        cct: esc.cct,
        fechaValidacion: this.formatearFechaLarga(new Date()),
        consecutivo: resultadoArchivo.resultadoExito?.consecutivo ?? 'N/D'
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
        erroresAgrupados: resultadoArchivo.erroresAgrupados,
        advertencias: resultadoArchivo.advertencias,
        archivo: resultadoArchivo.archivo.name
      });
      resultadoArchivo.pdfBlob = blob;
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
    this.registrarIntentoFallido(resultadoArchivo);
  }

  private actualizarErrores(resultadoArchivo: ResultadoArchivo, errores: string[], estructurados?: ExcelValidationError[]): void {
    resultadoArchivo.errores = [...errores];
    if (estructurados && estructurados.length > 0) {
      resultadoArchivo.erroresAgrupados = this.agruparErroresEstructurados(estructurados);
    } else {
      resultadoArchivo.erroresAgrupados = this.agruparErrores(resultadoArchivo.errores);
    }
  }

  private agruparErroresEstructurados(errores: ExcelValidationError[]): GrupoErrores[] {
    const mapa = new Map<string, Map<string, string[]>>();

    errores.forEach((err) => {
      const hoja = err.hoja || 'General';
      const titulo = err.fila ? `Fila ${err.fila}` : (err.columna ? `Columna ${err.columna}` : 'General');

      if (!mapa.has(hoja)) {
        mapa.set(hoja, new Map<string, string[]>());
      }

      const ubicaciones = mapa.get(hoja)!;
      if (!ubicaciones.has(titulo)) {
        ubicaciones.set(titulo, []);
      }

      let msg = err.error;
      if (err.campo) msg = `${err.campo}: ${msg}`;
      if (err.valorEncontrado) msg += ` (Encontrado: "${err.valorEncontrado}")`;
      if (err.valorEsperado) msg += ` (Esperado: "${err.valorEsperado}")`;

      ubicaciones.get(titulo)!.push(msg);
    });

    return Array.from(mapa.entries()).map(([hoja, ubicaciones]) => ({
      hoja,
      ubicaciones: Array.from(ubicaciones.entries()).map(([titulo, items]) => ({
        titulo,
        items
      }))
    }));
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

  private formatearFechaLarga(fecha: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'long',
      timeZone: 'America/Mexico_City'
    }).format(fecha);
  }
}
