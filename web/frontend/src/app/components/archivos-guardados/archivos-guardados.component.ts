import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  ArchivoStorageService,
  RegistroArchivo
} from '../../services/archivo-storage.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-archivos-guardados',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './archivos-guardados.component.html',
  styleUrl: './archivos-guardados.component.scss'
})
export class ArchivosGuardadosComponent implements OnInit {
  registros: RegistroArchivo[] = [];
  mensajeInfo: string | null = null;
  mensajeError: string | null = null;
  correoActivo: string | null = null;
  filtroTexto = '';
  private readonly resultadosStoragePrefix = 'archivos-resultados';
  private readonly pdfStoragePrefix = 'pdf-resultados';
  private resultadosArchivos: Record<string, ResultadoArchivosConStorage> = {};
  filasExpandidas = new Set<string>();

  constructor(
    private readonly archivoStorageService: ArchivoStorageService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.requiereLoginParaNuevaCarga()) {
      void this.router.navigate(['/login'], { queryParams: { redirect: '/archivos-preescolar' } });
      return;
    }

    this.correoActivo = this.authService.obtenerCredenciales()?.correo ?? null;
    this.cargarRegistros();
  }

  cargarRegistros(): void {
    this.mensajeError = null;
    this.registros = this.archivoStorageService.obtenerRegistros(this.correoActivo);
    this.cargarResultadosArchivos();
    this.filasExpandidas.clear();

    if (this.registros.length === 0) {
      this.mensajeInfo = 'Aún no has cargado archivos en este navegador.';
      return;
    }

    this.mensajeInfo =
      'Los archivos permanecen en el almacenamiento local del navegador. Copia el archivo a assets/archivos/{nivel}/ dentro de tu proyecto si necesitas usarlo en otra sesión.';
  }

  descargar(registro: RegistroArchivo): void {
    try {
      this.archivoStorageService.descargarRegistro(registro);
      this.registrarDescarga(registro.nombre);
      this.mensajeError = null;
    } catch (error) {
      this.mensajeError =
        error instanceof Error ? error.message : 'No se pudo descargar el archivo seleccionado.';
    }
  }

  get registrosFiltrados(): RegistroArchivo[] {
    const filtro = this.filtroTexto.trim().toLowerCase();
    if (!filtro) {
      return this.registros;
    }

    return this.registros.filter((registro) => {
      const nombre = registro.nombre?.toLowerCase() ?? '';
      const cct = registro.cct?.toLowerCase() ?? '';
      return nombre.includes(filtro) || cct.includes(filtro);
    });
  }

  async eliminar(registro: RegistroArchivo): Promise<void> {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar este archivo?',
      text: 'Se quitará la copia guardada en este navegador.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    try {
      this.archivoStorageService.eliminarRegistro(registro);
      this.cargarRegistros();
      await Swal.fire({
        title: 'Archivo eliminado',
        text: 'El registro se eliminó del almacenamiento local.',
        icon: 'success'
      });
    } catch (error) {
      const mensajeError =
        error instanceof Error ? error.message : 'No se pudo eliminar el archivo seleccionado.';
      this.mensajeError = mensajeError;
      await Swal.fire({
        title: 'No se pudo eliminar',
        text: mensajeError,
        icon: 'error'
      });
    }
  }

  descargarResultados(archivo: ResultadoArchivo): void {
    const base64 = archivo.base64 ?? '';
    const [header, base64Data] = base64.split(',');
    if (!base64Data) {
      return;
    }

    const mimeMatch = header?.match(/data:(.*?);base64/);
    const mimeType = mimeMatch?.[1] ?? archivo.type ?? 'application/octet-stream';
    const byteString = atob(base64Data);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i += 1) {
      bytes[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = archivo.name ?? 'resultado';
    enlace.style.display = 'none';

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
    this.registrarDescarga(enlace.download);
  }

  obtenerResultadosPorRegistro(registro: RegistroArchivo): ResultadoArchivosConStorage | null {
    const storageKey = this.obtenerResultadosStorageKey(registro);
    return this.resultadosArchivos[storageKey] ?? null;
  }

  toggleResultados(storageKey: string): void {
    if (this.filasExpandidas.has(storageKey)) {
      this.filasExpandidas.delete(storageKey);
      return;
    }
    this.filasExpandidas.add(storageKey);
  }

  estaFilaExpandida(storageKey: string): boolean {
    return this.filasExpandidas.has(storageKey);
  }

  obtenerEtiquetaNivel(nivel?: string): string {
    switch ((nivel ?? '').toLowerCase()) {
      case 'primaria':
        return 'Primaria';
      case 'secundaria':
        return 'Secundaria';
      case 'preescolar':
        return 'Preescolar';
      default:
        return 'No identificado';
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
      return '—';
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

  private cargarResultadosArchivos(): void {
    this.resultadosArchivos = {};
    this.registros.forEach((registro) => {
      const resultadosKey = this.obtenerResultadosStorageKey(registro);
      const dataResultados = localStorage.getItem(resultadosKey);
      if (dataResultados) {
        try {
          const parsed = JSON.parse(dataResultados) as ResultadoArchivos;
          if (Array.isArray(parsed.archivos) && parsed.archivos.length) {
            this.resultadosArchivos[resultadosKey] = { ...parsed, storageKey: resultadosKey };
            return;
          }
        } catch (error) {
          return;
        }
      }

      const pdfKey = this.obtenerPdfStorageKey(registro);
      const dataPdf = localStorage.getItem(pdfKey);
      if (!dataPdf) {
        return;
      }

      try {
        const parsed = JSON.parse(dataPdf) as PdfMetadata;
        if (parsed?.pdfBase64) {
          this.resultadosArchivos[resultadosKey] = {
            excelKey: parsed.excelKey,
            fecha: parsed.fecha,
            archivos: [
              {
                name: parsed.pdfName,
                size: 0,
                type: 'application/pdf',
                base64: parsed.pdfBase64
              }
            ],
            storageKey: resultadosKey
          };
        }
      } catch (error) {
        return;
      }
    });
  }

  private obtenerResultadosStorageKey(registro: RegistroArchivo): string {
    return `${this.resultadosStoragePrefix}:${this.obtenerClaveRegistro(registro)}`;
  }

  private obtenerPdfStorageKey(registro: RegistroArchivo): string {
    return `${this.pdfStoragePrefix}:${this.obtenerClaveRegistro(registro)}`;
  }

  private obtenerClaveRegistro(registro: RegistroArchivo): string {
    return (
      registro.claveEstable ??
      `${(registro.cct ?? '').trim()}|${(registro.correo ?? '').trim().toLowerCase()}|${
        registro.nombre
      }|${registro.fechaGuardado}`
    );
  }

  private registrarDescarga(nombre: string): void {
    const payload = {
      nombre,
      fecha: new Date().toISOString()
    };
    localStorage.setItem('ultima-descarga', JSON.stringify(payload));
  }
}

interface PdfMetadata {
  excelKey: string;
  pdfName: string;
  pdfBase64: string;
  fecha: string;
}

interface ResultadoArchivo {
  name: string;
  size: number;
  type: string;
  base64: string;
}

interface ResultadoArchivos {
  excelKey: string;
  archivos: ResultadoArchivo[];
  fecha: string;
}

interface ResultadoArchivosConStorage extends ResultadoArchivos {
  storageKey: string;
}
