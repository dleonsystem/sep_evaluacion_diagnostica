import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';
import { ArchivoStorageService, RegistroArchivo } from '../../services/archivo-storage.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss',
})
export class AdminPanelComponent implements OnInit {
  selectedFile: File | null = null;
  selectedExcelKey = '';
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error' = 'idle';
  feedbackMessage = '';
  uploadHistory: Array<{ name: string; size: number; uploadedAt: string }> = [];
  excelDisponibles: ExcelDisponible[] = [];
  paginaActual = 1;
  tamanioPagina = 10;
  private readonly uploadHistoryKey = 'adminPanelPdfHistory';
  private readonly pdfStoragePrefix = 'pdf-resultados';

  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly archivoStorageService: ArchivoStorageService
  ) {}

  ngOnInit(): void {
    this.uploadHistory = this.loadUploadHistory();
    this.cargarExcelDisponibles();
  }

  seleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    if (!this.selectedFile) {
      this.uploadStatus = 'idle';
      this.feedbackMessage = 'Selecciona un archivo PDF para comenzar.';
      return;
    }

    this.uploadStatus = 'idle';
    this.feedbackMessage = `Archivo seleccionado: ${this.selectedFile.name}`;
  }

  async subirPdf(): Promise<void> {
    if (!this.selectedExcelKey) {
      this.uploadStatus = 'error';
      this.feedbackMessage = 'Selecciona el Excel asociado antes de subir el PDF.';
      return;
    }

    if (!this.selectedFile) {
      this.uploadStatus = 'error';
      this.feedbackMessage = 'No se ha seleccionado ningún archivo.';
      return;
    }

    const isPdf =
      this.selectedFile.type === 'application/pdf' ||
      this.selectedFile.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      this.uploadStatus = 'error';
      this.feedbackMessage = 'El archivo seleccionado no es un PDF válido.';
      return;
    }

    this.uploadStatus = 'uploading';
    this.feedbackMessage = 'Cargando archivo...';

    const fileToUpload = this.selectedFile;
    const excelKey = this.selectedExcelKey;
    const excelSeleccionado = this.excelDisponibles.find((excel) => excel.key === excelKey);

    if (this.existePdfParaExcel(excelKey)) {
      const confirmacion = await Swal.fire({
        title: '¿Reemplazar PDF existente?',
        text: `Ya hay un PDF asignado a ${excelSeleccionado?.nombre ?? 'este Excel'} (${
          excelSeleccionado?.cct ?? 'CCT no registrada'
        }, ${excelSeleccionado?.correo ?? 'correo no registrado'}).`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, reemplazar',
        cancelButtonText: 'Cancelar'
      });

      if (!confirmacion.isConfirmed) {
        this.uploadStatus = 'idle';
        this.feedbackMessage = 'Carga cancelada. Se mantuvo el PDF anterior.';
        return;
      }
    }

    this.readPdfAsBase64(fileToUpload)
      .then((pdfBase64) => {
        const metadata = {
          excelKey,
          pdfName: fileToUpload.name,
          pdfBase64,
          fecha: new Date().toISOString(),
        };

        localStorage.setItem(this.obtenerPdfStorageKey(excelKey), JSON.stringify(metadata));

        this.uploadStatus = 'success';
        this.feedbackMessage = 'PDF cargado correctamente.';

        const historyEntry = {
          name: fileToUpload.name,
          size: fileToUpload.size,
          uploadedAt: metadata.fecha,
        };

        this.uploadHistory = [historyEntry, ...this.uploadHistory].slice(0, 5);
        this.saveUploadHistory();
        this.actualizarEstadoExcel(excelKey);
      })
      .catch(() => {
        this.uploadStatus = 'error';
        this.feedbackMessage = 'No se pudo leer el PDF. Intenta nuevamente.';
      });
  }

  obtenerToken(): string | null {
    return this.adminAuthService.obtenerToken();
  }

  cerrarSesion(): void {
    this.adminAuthService.cerrarSesion();
  }

  get excelDisponiblesFiltrados(): ExcelDisponible[] {
    return this.excelDisponibles;
  }

  get totalPaginas(): number {
    return this.obtenerTotalPaginas(this.excelDisponiblesFiltrados);
  }

  get paginaActualDerivada(): number {
    return this.obtenerPaginaActualDesdeListado(this.excelDisponiblesFiltrados);
  }

  get excelDisponiblesPaginados(): ExcelDisponible[] {
    const paginaActual = this.paginaActualDerivada;
    const inicio = (paginaActual - 1) * this.tamanioPagina;
    return this.excelDisponiblesFiltrados.slice(inicio, inicio + this.tamanioPagina);
  }

  get paginasDisponibles(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, index) => index + 1);
  }

  irAPagina(pagina: number): void {
    this.paginaActual = Math.min(Math.max(pagina, 1), this.totalPaginas);
  }

  private loadUploadHistory(): Array<{ name: string; size: number; uploadedAt: string }> {
    const storedHistory = localStorage.getItem(this.uploadHistoryKey);
    if (!storedHistory) {
      return [];
    }

    try {
      const parsedHistory = JSON.parse(storedHistory);
      if (Array.isArray(parsedHistory)) {
        return parsedHistory;
      }
    } catch (error) {
      return [];
    }

    return [];
  }

  private saveUploadHistory(): void {
    localStorage.setItem(this.uploadHistoryKey, JSON.stringify(this.uploadHistory));
  }

  private cargarExcelDisponibles(): void {
    const registros = this.archivoStorageService.obtenerTodosRegistros();
    this.excelDisponibles = registros.map((registro) => {
      const key = this.obtenerClaveExcel(registro);
      return {
        key,
        nombre: registro.nombre,
        cct: registro.cct ?? '—',
        correo: registro.correo ?? '—',
        estatus: this.existePdfParaExcel(key) ? 'asignado' : 'pendiente'
      };
    });

    this.paginaActual = this.obtenerPaginaActualDesdeListado(this.excelDisponiblesFiltrados);
  }

  private actualizarEstadoExcel(excelKey: string): void {
    this.excelDisponibles = this.excelDisponibles.map((excel) => {
      if (excel.key !== excelKey) {
        return excel;
      }
      return { ...excel, estatus: 'asignado' };
    });
  }

  private obtenerTotalPaginas(listado: ExcelDisponible[]): number {
    return Math.max(1, Math.ceil(listado.length / this.tamanioPagina));
  }

  private obtenerPaginaActualDesdeListado(listado: ExcelDisponible[]): number {
    const totalPaginas = this.obtenerTotalPaginas(listado);
    if (this.paginaActual > totalPaginas) {
      return totalPaginas;
    }
    if (this.paginaActual < 1) {
      return 1;
    }
    return this.paginaActual;
  }

  private existePdfParaExcel(excelKey: string): boolean {
    return !!localStorage.getItem(this.obtenerPdfStorageKey(excelKey));
  }

  private obtenerPdfStorageKey(excelKey: string): string {
    return `${this.pdfStoragePrefix}:${excelKey}`;
  }

  private obtenerClaveExcel(registro: RegistroArchivo): string {
    if (registro.claveEstable) {
      return registro.claveEstable;
    }

    const cct = (registro.cct ?? '').trim();
    const correo = (registro.correo ?? '').trim().toLowerCase();
    return `${cct}|${correo}|${registro.nombre}|${registro.fechaGuardado}`;
  }

  private readPdfAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }
        reject(new Error('Formato inválido'));
      };
      reader.onerror = () => reject(new Error('Error al leer archivo'));
      reader.readAsDataURL(file);
    });
  }
}

interface ExcelDisponible {
  key: string;
  nombre: string;
  cct: string;
  correo: string;
  estatus: 'asignado' | 'pendiente';
}
