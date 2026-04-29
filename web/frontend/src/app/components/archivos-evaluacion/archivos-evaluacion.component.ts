import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EvaluacionesService, SolicitudEia2 } from '../../services/evaluaciones.service';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-archivos-evaluacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './archivos-evaluacion.component.html',
  styleUrl: './archivos-evaluacion.component.scss'
})
export class ArchivosEvaluacionComponent implements OnInit {
  registros: SolicitudEia2[] = [];
  mensajeInfo: string | null = null;
  mensajeError: string | null = null;
  correoActivo: string | null = null;
  cctActivo: string | null = null;
  filtroTexto = '';
  cargando = false;

  constructor(
    private readonly authService: AuthService,
    private readonly evaluacionesService: EvaluacionesService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    if (this.authService.requiereLoginParaNuevaCarga()) {
      void this.router.navigate(['/login'], { queryParams: { redirect: '/archivos-evaluacion' } });
      return;
    }

    const credenciales = this.authService.obtenerCredenciales();
    this.correoActivo = credenciales?.correo ?? this.authService.obtenerCorreoSesion() ?? null;
    this.cctActivo = credenciales?.cct ?? this.authService.obtenerCctSesion() ?? null;
    void this.cargarRegistros();
  }

  async cargarRegistros(): Promise<void> {
    this.mensajeError = null;
    this.cargando = true;
    this.mensajeInfo = null;

    try {
      // Cargar TODOS los registros del usuario autenticado.
      // El resolver del backend filtra por usuario_id del JWT automáticamente.
      // NO se pasa cctActivo aqui ya que el usuario puede tener cargas de distintas escuelas.
      // El CCT (cuando existe) se usa solo como filtro de busqueda en la UI.
      console.log('[DEBUG] Cargando historial. cctActivo:', this.cctActivo, 'correoActivo:', this.correoActivo);
      this.registros = await firstValueFrom(
        this.evaluacionesService.getSolicitudes(undefined, 200)
      );
      console.log('[DEBUG] Registros recibidos del API:', this.registros.length, this.registros);
    } catch (error) {
      console.error('Error cargando historial del backend:', error);
      this.mensajeError = 'No se pudo conectar con el servidor para obtener tu historial.';
      this.registros = [];
    }

    this.cargando = false;

    if (this.registros.length === 0) {
      if (this.cctActivo) {
        this.mensajeInfo = 'No se han encontrado cargas registradas.';
      } else {
        this.mensajeInfo = 'Inicia sesión para ver tu historial de archivos sincronizados.';
      }
    } else {
      
    }
  }


  get registrosFiltrados(): SolicitudEia2[] {
    const filtro = this.filtroTexto.trim().toLowerCase();
    if (!filtro) {
      return this.registros;
    }

    return this.registros.filter((registro) => {
      const nombre = registro.archivoOriginal?.toLowerCase() ?? '';
      const cct = registro.cct?.toLowerCase() ?? '';
      return nombre.includes(filtro) || cct.includes(filtro);
    });
  }


  obtenerEtiquetaNivel(id?: number): string {
    switch (id) {
      case 1: return 'Preescolar';
      case 2: return 'Primaria';
      case 3: return 'Secundaria';
      default: return 'No identificado';
    }
  }

  formatearFecha(fecha?: string): string {
    if (!fecha) {
      return '—';
    }

    const parsed = new Date(fecha);
    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(parsed);
  }

  formatearTamano(bytes?: number): string {
    if (bytes === null || bytes === undefined || Number.isNaN(bytes)) {
      return '0 B';
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    const unidades = ['KB', 'MB', 'GB'];
    let valor = bytes / 1024;
    let indice = 0;
    while (valor >= 1024 && indice < unidades.length - 1) {
      valor /= 1024;
      indice += 1;
    }

    return `${valor.toFixed(valor >= 10 ? 1 : 2)} ${unidades[indice]}`;
  }

  obtenerEstadoDescripcion(registro: SolicitudEia2): string {
    if (registro.resultados && registro.resultados.length > 0) {
      return 'ASIGNADO';
    }
    
    const estado = registro.estadoValidacion as any;
    if (typeof estado === 'string') {
      if (estado === 'RECHAZADO') return 'ERROR DE VALIDACIÓN';
      return estado;
    }

    switch (estado) {
      case 1: return 'RECIBIDO';
      case 2: return 'VALIDADO';
      case 3: return 'ERROR DE VALIDACIÓN';
      case 0: return 'LOCAL';
      default: return 'PENDIENTE';
    }
  }

  esValidoOAsignado(registro: SolicitudEia2): boolean {
    const estado = this.obtenerEstadoDescripcion(registro);
    return estado === 'VALIDADO' || estado === 'ASIGNADO';
  }

  async descargarArchivo(solicitudId: string, nombre: string): Promise<void> {
    try {
      this.cargando = true;
      const result = await firstValueFrom(this.evaluacionesService.descargarResultado(solicitudId, nombre));

      if (result.success && result.contentBase64) {
        this.descargarBase64ComoArchivo(result.contentBase64, result.fileName);

        await Swal.fire({
          icon: 'success',
          title: 'Descarga iniciada',
          text: `El archivo ${result.fileName} se ha descargado correctamente.`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error: any) {
      console.error('Error al descargar:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de descarga',
        text: error.message || 'No se pudo descargar el archivo de resultados.'
      });
    } finally {
      this.cargando = false;
    }
  }

  async descargarComprobante(registro: SolicitudEia2): Promise<void> {
    try {
      this.cargando = true;
      const result = await firstValueFrom(this.evaluacionesService.generarComprobante(registro.id));

      if (result.success && result.contentBase64) {
        this.descargarBase64ComoArchivo(result.contentBase64, result.fileName, 'application/pdf');

        await Swal.fire({
          icon: 'success',
          title: 'Comprobante generado',
          text: `El comprobante ${result.fileName} se ha descargado correctamente.`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error: any) {
      console.error('Error al generar comprobante:', error);

      let mensajeFinal = 'No se pudo generar el comprobante de recepcion en este momento.';
      if (error.message?.includes('hash_archivo')) {
        mensajeFinal = 'Tu solicitud aún está siendo procesada por el servidor. Por favor, espera unos minutos e intenta de nuevo.';
      } else if (error.message) {
        mensajeFinal = error.message;
      }

      await Swal.fire({
        icon: 'warning',
        title: 'Documento en proceso',
        text: mensajeFinal
      });
    } finally {
      this.cargando = false;
    }
  }

  private descargarBase64ComoArchivo(base64: string, fileName: string, explicitMimeType?: string): void {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: explicitMimeType ?? this.inferirMimeType(fileName) });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }

  private inferirMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (extension === 'pdf') return 'application/pdf';
    if (['jpg', 'jpeg'].includes(extension ?? '')) return 'image/jpeg';
    if (extension === 'png') return 'image/png';
    if (extension === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (extension === 'zip') return 'application/zip';

    return 'application/octet-stream';
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    void this.router.navigate(['/login']);
  }
}
