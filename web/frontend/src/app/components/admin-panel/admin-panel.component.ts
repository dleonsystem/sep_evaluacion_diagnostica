import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';

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
  private readonly uploadHistoryKey = 'adminPanelPdfHistory';
  readonly excelOptions = [
    { key: 'preescolar', label: 'Excel Preescolar' },
    { key: 'primaria', label: 'Excel Primaria' },
    { key: 'secundaria', label: 'Excel Secundaria' },
  ];

  constructor(private readonly adminAuthService: AdminAuthService) {}

  ngOnInit(): void {
    this.uploadHistory = this.loadUploadHistory();
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

  subirPdf(): void {
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

    this.readPdfAsBase64(fileToUpload)
      .then((pdfBase64) => {
        const metadata = {
          excelKey,
          pdfName: fileToUpload.name,
          pdfBase64,
          fecha: new Date().toISOString(),
        };

        localStorage.setItem(excelKey, JSON.stringify(metadata));

        this.uploadStatus = 'success';
        this.feedbackMessage = 'PDF cargado correctamente.';

        const historyEntry = {
          name: fileToUpload.name,
          size: fileToUpload.size,
          uploadedAt: metadata.fecha,
        };

        this.uploadHistory = [historyEntry, ...this.uploadHistory].slice(0, 5);
        this.saveUploadHistory();
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
