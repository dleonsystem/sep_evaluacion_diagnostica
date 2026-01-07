import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
  imports: [CommonModule, RouterModule],
  templateUrl: './archivos-guardados.component.html',
  styleUrl: './archivos-guardados.component.scss'
})
export class ArchivosGuardadosComponent implements OnInit {
  registros: RegistroArchivo[] = [];
  mensajeInfo: string | null = null;
  mensajeError: string | null = null;
  correoActivo: string | null = null;
  private readonly pdfStoragePrefix = 'pdf-resultados';
  private resultadosPdf: Record<string, PdfMetadataConStorage> = {};

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
    this.cargarResultadosPdf();

    if (this.registros.length === 0) {
      this.mensajeInfo = 'Aún no has cargado archivos de Preescolar en este navegador.';
      return;
    }

    this.mensajeInfo =
      'Los archivos permanecen en el almacenamiento local del navegador. Copia el archivo a assets/archivos/preescolar/ dentro de tu proyecto si necesitas usarlo en otra sesión.';
  }

  descargar(registro: RegistroArchivo): void {
    try {
      this.archivoStorageService.descargarRegistro(registro);
      this.mensajeError = null;
    } catch (error) {
      this.mensajeError =
        error instanceof Error ? error.message : 'No se pudo descargar el archivo seleccionado.';
    }
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

  descargarResultados(storageKey: string): void {
    const data = localStorage.getItem(storageKey);
    if (!data) {
      return;
    }

    try {
      const parsed = JSON.parse(data) as PdfMetadata;
      if (!parsed?.pdfBase64) {
        return;
      }

      const [header, base64Data] = parsed.pdfBase64.split(',');
      if (!base64Data) {
        return;
      }

      const mimeMatch = header?.match(/data:(.*?);base64/);
      const mimeType = mimeMatch?.[1] ?? 'application/pdf';
      const byteString = atob(base64Data);
      const bytes = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i += 1) {
        bytes[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = parsed.pdfName ?? 'resultados.pdf';
      enlace.style.display = 'none';

      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);
    } catch (error) {
      return;
    }
  }

  obtenerPdfPorRegistro(registro: RegistroArchivo): PdfMetadataConStorage | null {
    const storageKey = this.obtenerPdfStorageKey(registro);
    return this.resultadosPdf[storageKey] ?? null;
  }

  private cargarResultadosPdf(): void {
    this.resultadosPdf = {};
    this.registros.forEach((registro) => {
      const storageKey = this.obtenerPdfStorageKey(registro);
      const data = localStorage.getItem(storageKey);
      if (!data) {
        return;
      }

      try {
        const parsed = JSON.parse(data) as PdfMetadata;
        if (parsed?.pdfBase64) {
          this.resultadosPdf[storageKey] = { ...parsed, storageKey };
        }
      } catch (error) {
        return;
      }
    });
  }

  private obtenerPdfStorageKey(registro: RegistroArchivo): string {
    const claveEstable =
      registro.claveEstable ??
      `${(registro.cct ?? '').trim()}|${(registro.correo ?? '').trim().toLowerCase()}|${
        registro.nombre
      }|${registro.fechaGuardado}`;
    return `${this.pdfStoragePrefix}:${claveEstable}`;
  }
}

interface PdfMetadata {
  excelKey: string;
  pdfName: string;
  pdfBase64: string;
  fecha: string;
}

interface PdfMetadataConStorage extends PdfMetadata {
  storageKey: string;
}
