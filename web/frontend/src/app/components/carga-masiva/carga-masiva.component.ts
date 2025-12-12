import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface SelectedFile {
  name: string;
  sizeKb: number;
  lastModified: Date;
}

@Component({
  selector: 'app-carga-masiva',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carga-masiva.component.html',
  styleUrl: './carga-masiva.component.scss'
})
export class CargaMasivaComponent {
  readonly extensionesPermitidas = ['.xlsx', '.xls', '.csv'];
  readonly pesoMaximoMb = 5;

  archivoSeleccionado: SelectedFile | null = null;
  error: string | null = null;
  mensajeInformativo: string | null = null;

  onArchivoSeleccionado(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const file = input.files?.[0];

    this.resetMensajes(false);

    if (!file) {
      return;
    }

    const extensionValida = this.extensionesPermitidas.some((extension) =>
      file.name.toLowerCase().endsWith(extension)
    );

    if (!extensionValida) {
      this.error = 'Formato no permitido. Usa .xlsx, .xls o .csv';
      input.value = '';
      return;
    }

    const tamanioMb = file.size / (1024 * 1024);
    if (tamanioMb > this.pesoMaximoMb) {
      this.error = `El archivo supera los ${this.pesoMaximoMb} MB permitidos.`;
      input.value = '';
      return;
    }

    this.archivoSeleccionado = {
      name: file.name,
      sizeKb: parseFloat((file.size / 1024).toFixed(2)),
      lastModified: new Date(file.lastModified)
    };
    this.mensajeInformativo = 'El archivo pasó las validaciones iniciales.';
  }

  cargarArchivo(): void {
    if (!this.archivoSeleccionado) {
      this.error = 'Selecciona primero un archivo válido para continuar.';
      return;
    }

    this.error = null;
    this.mensajeInformativo =
      'Archivo listo para enviarse cuando el backend esté disponible.';
  }

  limpiarSeleccion(input: HTMLInputElement): void {
    input.value = '';
    this.resetMensajes();
  }

  private resetMensajes(limpiarArchivo = true): void {
    if (limpiarArchivo) {
      this.archivoSeleccionado = null;
    }
    this.error = null;
    this.mensajeInformativo = null;
  }
}
