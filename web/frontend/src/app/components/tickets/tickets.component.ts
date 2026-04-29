import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EstadoCredencialesService } from '../../services/estado-credenciales.service';
import { TicketsService, MotivoTicket } from '../../services/tickets.service';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

interface EvidenciaArchivo {
  id: string;
  archivo: File;
}

interface TicketSoporte {
  id: string;
  folio: string;
  correo: string;
  motivo: string;
  motivoDetalle?: string;
  descripcion: string;
  fecha: string;
  estatus: 'pendiente' | 'en-proceso' | 'respondido';
  respuestas: Array<{ mensaje: string; fecha: string; autor: 'admin' }>;
  evidencias: Array<{ nombre: string; tamano: number; tipo: string; url: string }>;
}

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './tickets.component.html',
  styleUrl: './tickets.component.scss'
})
/* LISTA DE LAS OPCIONES*/
export class TicketsComponent implements OnInit {
  motivos: MotivoTicket[] = [];
  readonly maxEvidencias = 10;
  readonly extensionesPermitidas = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

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
  ticketsCreados: TicketSoporte[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly estadoCredencialesService: EstadoCredencialesService,
    private readonly ticketsService: TicketsService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    if (!this.authService.estaAutenticado()) {
      void this.router.navigate(['/login'], { queryParams: { redirect: '/tickets' } });
      return;
    }

    const credenciales = this.estadoCredencialesService.obtener() ?? this.authService.obtenerCredenciales();
    const correoSesion = this.authService.obtenerCorreoSesion();
    this.correoActivo = this.normalizarCorreo(credenciales?.correo ?? correoSesion ?? null);
    void this.cargarMotivos();
    void this.cargarTickets();
  }

  private async cargarMotivos(): Promise<void> {
    console.log('Cargando motivos desde el servicio...');
    try {
      this.motivos = await firstValueFrom(this.ticketsService.getMotivosTicket());
      console.log('Motivos cargados:', this.motivos);
    } catch (error) {
      console.error('Error cargando motivos:', error);
      // Fallback simple si falla la carga
      this.motivos = [];
    }
  }

  get mostrarMotivoOtro(): boolean {
    return false;
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
      this.mensajeError = 'Formato no permitido. Usa PDF, Word o imágenes (Excel no permitido para evidencias).';
      return;
    }

    this.evidencias = [
      ...this.evidencias,
      { id: this.generarId(), archivo }
    ];
  }

  quitarEvidencia(id: string): void {
    this.evidencias = this.evidencias.filter((item) => item.id !== id);
  }

  async enviarTicket(event?: Event): Promise<void> {
    event?.preventDefault();
    this.mensajeError = null;
    this.mensajeExito = null;

    if (!this.motivoControl.valid || !this.descripcionControl.valid) {
      this.motivoControl.markAllAsTouched();
      this.descripcionControl.markAllAsTouched();
      this.mensajeError = 'Complete los campos obligatorios para enviar el ticket.';
      return;
    }


    try {
      // 1. Convertir evidencias a Base64
      const evidenciasPromises = this.evidencias.map(async (item) => ({
        nombre: item.archivo.name,
        base64: await this.fileToBase64(item.archivo)
      }));
      const evidenciasToSend = await Promise.all(evidenciasPromises);

      // 2. Enviar petición usando el servicio
      const ticketResult = await firstValueFrom(
        this.ticketsService.createTicket({
          motivo: this.motivoControl.value,
          descripcion: this.descripcionControl.value,
          correo: this.correoActivo,
          evidencias: evidenciasToSend
        })
      );

      // 3. Éxito
      await Swal.fire({
        title: '¡Ticket enviado!',
        text: `Su ticket se registró correctamente con el folio: ${ticketResult.numeroTicket}`,
        icon: 'success',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#00695c'
      });

      this.motivoControl.reset('');
      this.motivoOtroControl.reset('');
      this.descripcionControl.reset('');
      this.evidencias = [];

      await this.cargarTickets();

    } catch (error: any) {
      this.mensajeError = error.message || 'Ocurrió un error al enviar el ticket.';
      console.error('Error enviando ticket:', error);
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  private esExtensionPermitida(nombre: string): boolean {
    const nombreLower = nombre.toLowerCase();
    return this.extensionesPermitidas.some((extension) => nombreLower.endsWith(extension));
  }

  private async cargarTickets(): Promise<void> {
    if (!this.correoActivo) return;

    try {
      const ticketsDB = await firstValueFrom(
        this.ticketsService.getMyTickets(this.correoActivo)
      );

      this.ticketsCreados = ticketsDB.map((t: any) => ({
        id: t.id,
        folio: t.numeroTicket,
        correo: this.correoActivo!,
        motivo: t.asunto,
        descripcion: t.descripcion,
        fecha: t.fechaCreacion,
        estatus: this.mapEstatus(t.estado),
        respuestas: (t.respuestas || []).map((r: any) => ({
          mensaje: r.mensaje,
          fecha: r.fecha,
          autor: 'admin'
        })),
        evidencias: (t.evidencias || []).map((e: any) => ({
          nombre: e.nombre,
          tamano: e.size || 0,
          tipo: 'archivo',
          url: e.url
        }))
      }));

    } catch (error) {
      console.error('Error cargando tickets:', error);
    }
  }

  async descargarEvidencia(evidencia: { nombre: string; url: string }): Promise<void> {
    try {
      Swal.fire({
        title: 'Descargando...',
        text: 'Obteniendo archivo del servidor seguro',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const result = await firstValueFrom(this.ticketsService.downloadTicketEvidencia(evidencia.url));
      
      if (!result.success) {
        throw new Error('El servidor no pudo entregar el archivo');
      }

      // Convertir base64 a Blob
      const byteCharacters = atob(result.contentBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      // Intentar determinar MIME type por extensión
      let mimeType = 'application/octet-stream';
      const ext = evidencia.nombre.toLowerCase().split('.').pop();
      if (['jpg', 'jpeg'].includes(ext!)) mimeType = 'image/jpeg';
      else if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'pdf') mimeType = 'application/pdf';
      else if (ext === 'doc') mimeType = 'application/msword';
      else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      const blob = new Blob([byteArray], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      
      // Si es imagen o PDF, podemos intentar abrir en nueva pestaña, 
      // pero el usuario pidió ver o descargar. Descargar es más seguro.
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      Swal.close();
    } catch (error: any) {
      Swal.fire('Error', error.message || 'No se pudo descargar el archivo', 'error');
    }
  }

  private mapEstatus(estado: string): 'pendiente' | 'en-proceso' | 'respondido' {
    switch (estado) {
      case 'ABIERTO': return 'pendiente';
      case 'EN_PROCESO': return 'en-proceso';
      case 'CERRADO': case 'RESUELTO': return 'respondido';
      default: return 'pendiente';
    }
  }

  private filtrarTicketsPorCorreo(tickets: TicketSoporte[]): TicketSoporte[] {
    if (!this.correoActivo) {
      return [];
    }
    return tickets.filter((ticket) => this.normalizarCorreo(ticket.correo) === this.correoActivo);
  }

  private generarId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    const ahora = Date.now();
    const aleatorio = Math.random().toString(16).slice(2);
    return `id-${ahora}-${aleatorio}`;
  }

  private generarFolio(): string {
    const key = 'tickets-folio-counter';
    const actual = Number(localStorage.getItem(key) ?? '0') + 1;
    localStorage.setItem(key, String(actual));
    const ahora = new Date();
    const fecha = `${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, '0')}${String(
      ahora.getDate()
    ).padStart(2, '0')}`;
    return `TCK-${fecha}-${String(actual).padStart(4, '0')}`;
  }

  private normalizarCorreo(correo: string | null): string | null {
    if (!correo) {
      return null;
    }
    return correo.trim().toLowerCase();
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    void this.router.navigate(['/login']);
  }
}
