import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TicketsService, Ticket } from '../../services/tickets.service';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ticket-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './ticket-detalle.component.html',
  styleUrl: './ticket-detalle.component.scss'
})
export class TicketDetalleComponent implements OnInit {
  ticket: Ticket | null = null;
  folio: string = '';
  cargando = true;
  enviando = false;
  
  respuestaForm: FormGroup;
  mensajeInfo: string | null = null;
  mensajeExito: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly ticketsService: TicketsService,
    private readonly authService: AuthService,
    private readonly fb: FormBuilder
  ) {
    this.respuestaForm = this.fb.group({
      mensaje: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]]
    });
  }

  get puedeResponder(): boolean {
    return this.ticket?.estado !== 'CERRADO' && this.ticket?.estado !== 'RESUELTO';
  }

  ngOnInit(): void {
    if (!this.authService.estaAutenticado()) {
      void this.router.navigate(['/login']);
      return;
    }

    this.folio = this.route.snapshot.paramMap.get('folio') || '';
    if (!this.folio) {
      void this.router.navigate(['/tickets-historial']);
      return;
    }

    this.cargarTicketDetalle();
  }

  async cargarTicketDetalle(): Promise<void> {
    try {
      this.cargando = true;
      const correoActivo = this.authService.obtenerCorreoSesion() || undefined;
      const misTickets = await firstValueFrom(this.ticketsService.getMyTickets(correoActivo));
      
      this.ticket = misTickets.find(t => t.numeroTicket === this.folio) || null;
      
      if (!this.ticket) {
        this.mensajeInfo = 'No se encontró el ticket o no tienes permisos para verlo.';
      }
    } catch (error) {
      console.error('Error cargando detalle de ticket:', error);
      this.mensajeInfo = 'Error al cargar los detalles del ticket.';
    } finally {
      this.cargando = false;
    }
  }

  async enviarRespuesta(): Promise<void> {
    if (this.respuestaForm.invalid || !this.ticket) {
      this.respuestaForm.markAllAsTouched();
      return;
    }

    try {
      this.enviando = true;
      this.mensajeInfo = null;
      this.mensajeExito = null;

      const { mensaje } = this.respuestaForm.value;
      const cerrarTicket = false; // By default, only reply
      
      await firstValueFrom(
        this.ticketsService.respondToTicket(this.ticket.id, mensaje, cerrarTicket)
      );

      this.mensajeExito = 'Respuesta enviada correctamente.';
      this.respuestaForm.reset();
      await this.cargarTicketDetalle(); // refresh timeline
    } catch (error: any) {
      console.error('Error enviando respuesta:', error);
      this.mensajeInfo = error.message || 'Ocurrió un error al enviar tu respuesta.';
    } finally {
      this.enviando = false;
    }
  }

  async cerrarTicket(): Promise<void> {
    if (!this.ticket) return;
    
    const confirmacion = confirm('¿Estás seguro de que deseas dar por resuelto este ticket? Ya no podrás enviar más mensajes.');
    if (!confirmacion) return;

    try {
      this.enviando = true;
      await firstValueFrom(
        this.ticketsService.respondToTicket(this.ticket.id, 'El usuario marcó este ticket como resuelto.', true)
      );
      this.mensajeExito = 'Ticket cerrado con éxito.';
      await this.cargarTicketDetalle();
    } catch (error: any) {
      this.mensajeInfo = error.message || 'Error al intentar cerrar el ticket.';
    } finally {
      this.enviando = false;
    }
  }

  formatearFecha(fecha: string): string {
    const parsed = new Date(fecha);
    if (Number.isNaN(parsed.getTime())) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(parsed);
  }

  async descargarEvidencia(url: string, nombre: string): Promise<void> {
    try {
      Swal.fire({
        title: 'Descargando evidencia...',
        text: 'Obteniendo archivo del servidor seguro',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const result = await firstValueFrom(this.ticketsService.downloadTicketEvidencia(url));
      
      if (!result.success) {
        throw new Error('El servidor no pudo entregar el archivo');
      }

      // 1. Convertir base64 a Buffer/Blob
      const byteCharacters = atob(result.contentBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      // 2. Determinar MIME type
      let mimeType = 'application/octet-stream';
      const ext = nombre.toLowerCase().split('.').pop();
      if (['jpg', 'jpeg'].includes(ext!)) mimeType = 'image/jpeg';
      else if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'pdf') mimeType = 'application/pdf';
      else if (ext === 'doc') mimeType = 'application/msword';
      else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      const blob = new Blob([byteArray], { type: mimeType });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // 3. Disparar descarga
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = result.fileName || nombre;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      Swal.close();
    } catch (error: any) {
      console.error('Error descargando evidencia:', error);
      Swal.fire('Error', error.message || 'No se pudo descargar el archivo', 'error');
    }
  }
}
