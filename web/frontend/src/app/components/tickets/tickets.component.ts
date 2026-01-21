import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface EvidenciaArchivo {
  id: string;
  archivo: File;
}

interface TicketSoporte {
  id: string;
  correo: string;
  motivo: string;
  motivoDetalle: string;
  descripcion: string;
  fecha: string;
  estatus: 'pendiente' | 'en-proceso' | 'respondido';
  evidencias: Array<{ nombre: string; tamano: number; tipo: string }>;
}

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tickets.component.html',
  styleUrl: './tickets.component.scss'
})
export class TicketsComponent implements OnInit {
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
  correoActivo: string | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.requiereLoginParaNuevaCarga()) {
      void this.router.navigate(['/login'], { queryParams: { redirect: '/tickets' } });
      return;
    }

    this.correoActivo = this.authService.obtenerCredenciales()?.correo ?? null;
  }

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

    if (!this.correoActivo) {
      this.mensajeError = 'Inicia sesión para registrar un ticket.';
      return;
    }

    const tickets = this.obtenerTickets();
    const nuevoTicket: TicketSoporte = {
      id: crypto.randomUUID(),
      correo: this.correoActivo,
      motivo: this.motivoControl.value,
      motivoDetalle: this.mostrarMotivoOtro ? this.motivoOtroControl.value.trim() : '',
      descripcion: this.descripcionControl.value.trim(),
      fecha: new Date().toISOString(),
      estatus: 'pendiente',
      evidencias: this.evidencias.map((item) => ({
        nombre: item.archivo.name,
        tamano: item.archivo.size,
        tipo: item.archivo.type
      }))
    };

    tickets.push(nuevoTicket);
    localStorage.setItem('tickets-soporte', JSON.stringify(tickets));

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

  private obtenerTickets(): TicketSoporte[] {
    const data = localStorage.getItem('tickets-soporte');
    if (!data) {
      return [];
    }

    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
