import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ExcelValidationService, ResultadoValidacion } from '../../services/excel-validation.service';

interface SelectedFile {
  name: string;
  sizeKb: number;
  lastModified: Date;
}

interface ResultadoExito {
  mensaje: string;
  fechaDisponible: Date;
  credenciales: { usuario: string; contrasena: string };
  totalAlumnos: number;
}

@Component({
  selector: 'app-carga-masiva',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carga-masiva.component.html',
  styleUrl: './carga-masiva.component.scss'
})
export class CargaMasivaComponent {
  readonly extensionesPermitidas = ['.xlsx'];
  readonly pesoMaximoMb = 10;

  archivoSeleccionado: SelectedFile | null = null;
  estado: 'idle' | 'validando' | 'exito' | 'error' = 'idle';
  errores: string[] = [];
  advertencias: string[] = [];
  resultadoExito: ResultadoExito | null = null;
  mensajeInformativo: string | null = null;

  constructor(private readonly excelValidationService: ExcelValidationService) {}

  async onArchivoSeleccionado(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const file = input.files?.[0];

    this.resetMensajes();

    if (!file) {
      return;
    }

    const extensionValida = this.extensionesPermitidas.some((extension) =>
      file.name.toLowerCase().endsWith(extension)
    );

    if (!extensionValida) {
      this.estado = 'error';
      this.errores = ['Formato no permitido. Usa únicamente archivos .xlsx'];
      input.value = '';
      return;
    }

    const tamanioMb = file.size / (1024 * 1024);
    if (tamanioMb > this.pesoMaximoMb) {
      this.estado = 'error';
      this.errores = [`El archivo supera los ${this.pesoMaximoMb} MB permitidos.`];
      input.value = '';
      return;
    }

    this.archivoSeleccionado = {
      name: file.name,
      sizeKb: parseFloat((file.size / 1024).toFixed(2)),
      lastModified: new Date(file.lastModified)
    };

    this.estado = 'validando';
    this.mensajeInformativo = 'Validando tu archivo...';

    try {
      const buffer = await file.arrayBuffer();
      const resultado = await this.excelValidationService.validarPreescolar(buffer);
      this.procesarResultado(resultado);
    } catch (error) {
      this.estado = 'error';
      this.errores = [
        error instanceof Error
          ? error.message
          : 'No se pudo validar el archivo. Inténtalo de nuevo.'
      ];
    }
  }

  limpiarSeleccion(input: HTMLInputElement): void {
    input.value = '';
    this.resetMensajes();
  }

  private procesarResultado(resultado: ResultadoValidacion): void {
    this.errores = resultado.errores;
    this.advertencias = resultado.advertencias;

    if (!resultado.ok || !resultado.esc) {
      this.estado = 'error';
      this.mensajeInformativo = null;
      return;
    }

    const fechaDisponible = this.calcularFechaDisponible();
    this.estado = 'exito';
    this.mensajeInformativo = 'Tu archivo ha sido validado correctamente.';
    this.resultadoExito = {
      mensaje: `Podrás consultar tus resultados a partir del día: ${fechaDisponible.toLocaleDateString()}`,
      fechaDisponible,
      credenciales: {
        usuario: resultado.esc.cct,
        contrasena: resultado.esc.correo
      },
      totalAlumnos: resultado.alumnos?.length ?? 0
    };
  }

  private calcularFechaDisponible(): Date {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 4);
    return fecha;
  }

  private resetMensajes(): void {
    this.estado = 'idle';
    this.archivoSeleccionado = null;
    this.errores = [];
    this.advertencias = [];
    this.resultadoExito = null;
    this.mensajeInformativo = null;
  }
}
