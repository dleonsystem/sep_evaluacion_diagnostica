import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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
  selectedNivel = '';
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error' = 'idle';
  feedbackMessage = '';
  uploadHistory: Array<{ name: string; size: number; uploadedAt: string }> = [];
  excelDisponibles: ExcelDisponible[] = [];
  excelSeleccionado: ExcelDisponible | null = null;
  filtroTexto = '';
  filtroEstatus: 'todos' | 'asignado' | 'pendiente' = 'todos';
  filtroFecha = '';
  paginaActual = 1;
  tamanioPagina = 10;
  private readonly uploadHistoryKey = 'adminPanelPdfHistory';
  private readonly pdfStoragePrefix = 'pdf-resultados';

  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly archivoStorageService: ArchivoStorageService,
    private readonly router: Router
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
    if (!this.excelSeleccionado) {
      this.uploadStatus = 'error';
      this.feedbackMessage = 'Selecciona un registro de Excel antes de subir el PDF.';
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
    const excelKey = this.excelSeleccionado.key;
    const excelSeleccionado = this.excelSeleccionado;

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
    this.selectedFile = null;
    this.excelSeleccionado = null;
    this.selectedNivel = '';
    this.uploadStatus = 'idle';
    this.feedbackMessage = '';
    void this.router.navigate(['/admin/login']);
  }

  get excelDisponiblesFiltrados(): ExcelDisponible[] {
    return this.aplicarFiltros(this.excelDisponibles);
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

  onFiltrosActualizados(): void {
    this.paginaActual = 1;
  }

  seleccionarExcel(excel: ExcelDisponible): void {
    this.excelSeleccionado = excel;
    this.uploadStatus = 'idle';
    this.feedbackMessage = `Registro seleccionado: ${excel.nombre}.`;
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
      const nivel = this.obtenerNivelRegistro(registro);
      const fecha = registro.fechaGuardado || new Date().toISOString();
      const estatus = registro.estatus ?? (this.existePdfParaExcel(key) ? 'asignado' : 'pendiente');
      return {
        key,
        nombre: registro.nombre,
        cct: registro.cct ?? '—',
        correo: registro.correo ?? '—',
        estatus,
        fecha,
        nivel
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

  private aplicarFiltros(listado: ExcelDisponible[]): ExcelDisponible[] {
    const texto = this.filtroTexto.trim().toLowerCase();
    const estatus = this.filtroEstatus;
    const fecha = this.filtroFecha;
    const nivel = this.selectedNivel;

    return listado.filter((excel) => {
      const coincideTexto =
        !texto ||
        excel.nombre.toLowerCase().includes(texto) ||
        excel.cct.toLowerCase().includes(texto) ||
        excel.correo.toLowerCase().includes(texto);
      const coincideEstatus = estatus === 'todos' || excel.estatus === estatus;
      const coincideFecha = !fecha || this.obtenerFechaISO(excel.fecha) === fecha;
      const coincideNivel = !nivel || excel.nivel === nivel;

      return coincideTexto && coincideEstatus && coincideFecha && coincideNivel;
    });
  }

  private obtenerFechaISO(fecha: string): string {
    const fechaParsed = new Date(fecha);
    if (Number.isNaN(fechaParsed.getTime())) {
      return '';
    }
    return fechaParsed.toISOString().slice(0, 10);
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

  private obtenerNivelRegistro(registro: RegistroArchivo): string {
    if (registro.nivel) {
      return registro.nivel;
    }

    const ruta = registro.ruta?.toLowerCase() ?? '';
    if (ruta.includes('/primaria/')) {
      return 'primaria';
    }
    if (ruta.includes('/secundaria/')) {
      return 'secundaria';
    }
    if (ruta.includes('/preescolar/')) {
      return 'preescolar';
    }

    return 'preescolar';
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
  fecha: string;
  nivel: string;
}
