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
  idRegistroExpandido: string | null = null;

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
    this.cctActivo = credenciales?.cct ?? null;
    void this.cargarRegistros();
  }

  async cargarRegistros(): Promise<void> {
    this.mensajeError = null;
    this.cargando = true;
    this.mensajeInfo = null;

    let registrosBackend: SolicitudEia2[] = [];

    // 1. Cargar del backend si hay CCT
    if (this.cctActivo) {
      try {
        this.registros = await firstValueFrom(this.evaluacionesService.getSolicitudes(this.cctActivo));
      } catch (error) {
        console.error('Error cargando historial del backend:', error);
        this.mensajeError = 'No se pudo conectar con el servidor para obtener tu historial.';
      }
    } else {
      this.registros = [];
    }

    this.cargando = false;

    if (this.registros.length === 0) {
      if (this.cctActivo) {
        this.mensajeInfo = 'No se han encontrado cargas registradas para tu CCT.';
      } else {
        this.mensajeInfo = 'Inicia sesión para ver tu historial de archivos sincronizados.';
      }
    } else {
      this.mensajeInfo = 'Se muestran tus cargas sincronizadas con el servidor.';
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

  alternarDetalle(id: string): void {
    this.idRegistroExpandido = this.idRegistroExpandido === id ? null : id;
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

  obtenerEstadoDescripcion(estado: number): string {
    switch (estado) {
      case 1: return 'RECIBIDO';
      case 2: return 'VALIDADO';
      case 3: return 'PROCESADO';
      case 0: return 'LOCAL';
      default: return 'PENDIENTE';
    }
  }

  async descargarArchivo(solicitudId: string, nombre: string): Promise<void> {
    try {
      this.cargando = true;
      const result = await firstValueFrom(this.evaluacionesService.descargarResultado(solicitudId, nombre));

      if (result.success && result.contentBase64) {
        // Crear un enlace temporal para descargar
        const link = document.createElement('a');
        const extension = nombre.split('.').pop()?.toLowerCase();
        let mimeType = 'application/octet-stream';

        if (extension === 'pdf') mimeType = 'application/pdf';
        else if (['jpg', 'jpeg'].includes(extension!)) mimeType = 'image/jpeg';
        else if (extension === 'png') mimeType = 'image/png';
        else if (extension === 'xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        else if (extension === 'zip') mimeType = 'application/zip';

        link.href = `data:${mimeType};base64,${result.contentBase64}`;
        link.download = nombre;
        link.click();

        await Swal.fire({
          icon: 'success',
          title: 'Descarga iniciada',
          text: `El archivo ${nombre} se ha descargado correctamente.`,
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
}
