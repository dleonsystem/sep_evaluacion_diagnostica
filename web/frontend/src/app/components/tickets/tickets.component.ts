import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

interface EvidenciaArchivo {
  id: string;
  archivo: File;
}

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tickets.component.html',
  styleUrl: './tickets.component.scss'
})
export class TicketsComponent {
  readonly motivos = [
    'Tengo problemas para subir mi evaluación',
    'Necesito apoyo con mis credenciales',
    'Otra'
  ];
  readonly maxEvidencias = 10;
  readonly extensionesPermitidas = ['.pdf', '.xlsx', '.xls', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

  readonly motivoControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  readonly motivoOtroControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(200)]
  });
  readonly descripcionControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(1500)]
  });

  evidencias: EvidenciaArchivo[] = [];
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  get mostrarMotivoOtro(): boolean {
    return this.motivoControl.value === 'Otra';
  }

  get puedeAgregarEvidencias(): boolean {
    return this.evidencias.length < this.maxEvidencias;
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    this.mensajeError = null;
    this.mensajeExito = null;

    if (!archivo) {
      return;
    }

    if (!this.puedeAgregarEvidencias) {
      this.mensajeError = `Solo puedes adjuntar hasta ${this.maxEvidencias} evidencias.`;
      return;
    }

    if (!this.esExtensionPermitida(archivo.name)) {
      this.mensajeError = 'Formato no permitido. Usa PDF, Excel, Word o imágenes.';
      return;
    }

    this.evidencias = [
      ...this.evidencias,
      { id: crypto.randomUUID(), archivo }
    ];
  }

  quitarEvidencia(id: string): void {
    this.evidencias = this.evidencias.filter((item) => item.id !== id);
  }

  enviarTicket(): void {
    this.mensajeError = null;
    this.mensajeExito = null;

    if (!this.motivoControl.valid || !this.descripcionControl.valid) {
      this.motivoControl.markAllAsTouched();
      this.descripcionControl.markAllAsTouched();
      if (this.mostrarMotivoOtro) {
        this.motivoOtroControl.markAllAsTouched();
      }
      this.mensajeError = 'Completa los campos obligatorios para enviar el ticket.';
      return;
    }

    if (this.mostrarMotivoOtro && !this.motivoOtroControl.value.trim()) {
      this.motivoOtroControl.markAllAsTouched();
      this.mensajeError = 'Indica el motivo cuando seleccionas "Otra".';
      return;
    }

    this.mensajeExito =
      'Tu ticket se registró correctamente. En breve te contactaremos por correo.';
    this.motivoControl.reset('');
    this.motivoOtroControl.reset('');
    this.descripcionControl.reset('');
    this.evidencias = [];
  }

  private esExtensionPermitida(nombre: string): boolean {
    const nombreLower = nombre.toLowerCase();
    return this.extensionesPermitidas.some((extension) => nombreLower.endsWith(extension));
  }
}
