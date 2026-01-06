import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss',
})
export class AdminPanelComponent implements OnInit {
  selectedFile: File | null = null;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error' = 'idle';
  feedbackMessage = '';
  uploadHistory: Array<{ name: string; size: number; uploadedAt: string }> = [];
  private readonly uploadHistoryKey = 'adminPanelPdfHistory';

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

    setTimeout(() => {
      this.uploadStatus = 'success';
      this.feedbackMessage = 'PDF cargado correctamente.';

      const metadata = {
        name: this.selectedFile?.name ?? 'PDF',
        size: this.selectedFile?.size ?? 0,
        uploadedAt: new Date().toISOString(),
      };

      this.uploadHistory = [metadata, ...this.uploadHistory].slice(0, 5);
      this.saveUploadHistory();
    }, 1500);
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
}
