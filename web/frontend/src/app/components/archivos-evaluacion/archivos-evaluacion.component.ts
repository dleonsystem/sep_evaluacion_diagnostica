import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EvaluacionesService, SolicitudEia2 } from '../../services/evaluaciones.service';
import { ArchivoStorageService } from '../../services/archivo-storage.service';
import { firstValueFrom } from 'rxjs';

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
    private readonly archivoStorageService: ArchivoStorageService,
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
        registrosBackend = await firstValueFrom(this.evaluacionesService.getSolicitudes(this.cctActivo));
      } catch (error) {
        console.error('Error cargando historial del backend:', error);
        this.mensajeError = 'No se pudo conectar con el servidor para obtener tu historial completo.';
      }
    }

    // 2. Cargar de local storage (para soporte de cargas previas offline/locales)
    const registrosLocalesRaw = this.archivoStorageService.obtenerRegistros(this.correoActivo || '');
    const registrosLocalesMapped: SolicitudEia2[] = registrosLocalesRaw.map((local, index) => ({
      id: `local-${index}`,
      consecutivo: 0,
      cct: local.cct,
      archivoOriginal: local.nombre,
      fechaCarga: local.fecha,
      estadoValidacion: 0, // LOCAL
      nivelEducativo: this.mapearNivelALocal(local.nivel),
      archivoSize: local.size,
      procesadoExternamente: false
    }));

    // 3. Mezclar (evitar duplicados que ya estén en el servidor)
    this.registros = [
      ...registrosBackend,
      ...registrosLocalesMapped.filter(l =>
        !registrosBackend.some(b =>
          b.archivoOriginal === l.archivoOriginal && b.cct === l.cct
        )
      )
    ];

    this.cargando = false;

    if (this.registros.length === 0) {
      if (this.cctActivo) {
        this.mensajeInfo = 'No se han encontrado cargas registradas para tu CCT.';
      } else if (this.authService.estaAutenticado()) {
        this.mensajeInfo = 'No tienes un CCT asignado a tu cuenta. Solo se muestran cargas locales.';
      } else {
        this.mensajeInfo = 'Inicia sesión para ver tu historial de archivos sincronizados.';
      }
    } else {
      this.mensajeInfo = this.cctActivo
        ? 'Se muestran tus cargas sincronizadas con el servidor.'
        : 'Se muestran tus cargas guardadas localmente.';
    }
  }

  private mapearNivelALocal(nivel: string): number {
    const n = (nivel || '').toUpperCase();
    if (n.includes('PRE')) return 1;
    if (n.includes('PRI')) return 2;
    if (n.includes('SEC')) return 3;
    return 0;
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
}
