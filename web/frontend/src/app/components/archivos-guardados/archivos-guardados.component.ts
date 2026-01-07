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
  private readonly pdfKeys = ['preescolar', 'primaria', 'secundaria'];
  private resultadosPdf: Record<string, PdfMetadata> = {};

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
    this.cargarResultadosPdf();
    this.cargarRegistros();
  }

  cargarRegistros(): void {
    this.mensajeError = null;
    this.registros = this.archivoStorageService.obtenerRegistros(this.correoActivo);

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

  descargarResultados(registro: RegistroArchivo): void {
    const pdf = this.obtenerPdfPorRegistro(registro);
    if (!pdf) {
      return;
    }

    const enlace = document.createElement('a');
    enlace.href = pdf.pdfBase64;
    enlace.download = pdf.pdfName ?? 'resultados.pdf';
    enlace.style.display = 'none';

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  }

  obtenerPdfPorRegistro(registro: RegistroArchivo): PdfMetadata | null {
    const claveExcel = this.obtenerClaveExcel(registro);
    if (!claveExcel) {
      return null;
    }
    return this.resultadosPdf[claveExcel] ?? null;
  }

  private cargarResultadosPdf(): void {
    this.resultadosPdf = {};
    this.pdfKeys.forEach((clave) => {
      const data = localStorage.getItem(clave);
      if (!data) {
        return;
      }

      try {
        const parsed = JSON.parse(data) as PdfMetadata;
        if (parsed?.pdfBase64) {
          this.resultadosPdf[clave] = parsed;
        }
      } catch (error) {
        return;
      }
    });
  }

  private obtenerClaveExcel(registro: RegistroArchivo): string | null {
    const ruta = (registro.ruta ?? '').toLowerCase();
    if (ruta.includes('/preescolar/')) {
      return 'preescolar';
    }
    if (ruta.includes('/primaria/')) {
      return 'primaria';
    }
    if (ruta.includes('/secundaria/')) {
      return 'secundaria';
    }
    return null;
  }
}

interface PdfMetadata {
  excelKey: string;
  pdfName: string;
  pdfBase64: string;
  fecha: string;
}
