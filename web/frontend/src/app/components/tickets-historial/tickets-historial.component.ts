import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EstadoCredencialesService } from '../../services/estado-credenciales.service';
import { TicketsService, Ticket as TicketDB } from '../../services/tickets.service';
import { firstValueFrom } from 'rxjs';

interface TicketSoporte {
  id: string;
  folio: string;
  correo: string;
  motivo: string;
  motivoDetalle: string;
  descripcion: string;
  fecha: string;
  estatus: 'pendiente' | 'en-proceso' | 'respondido';
  respuestas: Array<{ mensaje: string; fecha: string; autor: 'admin' }>;
  evidencias: Array<{ nombre: string; tamano: number; tipo: string }>;
}

@Component({
  selector: 'app-tickets-historial',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tickets-historial.component.html',
  styleUrl: './tickets-historial.component.scss'
})
export class TicketsHistorialComponent implements OnInit {
  tickets: TicketSoporte[] = [];
  mensajeInfo: string | null = null;
  correoActivo: string | null = null;
  ticketExpandidoId: string | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly estadoCredencialesService: EstadoCredencialesService,
    private readonly ticketsService: TicketsService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    if (!this.authService.estaAutenticado()) {
      void this.router.navigate(['/login'], { queryParams: { redirect: '/tickets-historial' } });
      return;
    }

    const credenciales = this.estadoCredencialesService.obtener() ?? this.authService.obtenerCredenciales();
    const correoSesion = this.authService.obtenerCorreoSesion();
    this.correoActivo = this.normalizarCorreo(credenciales?.correo ?? correoSesion ?? null);
    this.cargarTickets();
  }

  async cargarTickets(): Promise<void> {
    try {
      const ticketsDB = await firstValueFrom(
        this.ticketsService.getMyTickets(this.correoActivo ?? undefined)
      );

      this.tickets = ticketsDB.map(t => ({
        id: t.id,
        folio: t.numeroTicket,
        correo: t.correo || this.correoActivo || 'Anónimo',
        motivo: t.asunto,
        motivoDetalle: t.asunto,
        descripcion: t.descripcion,
        fecha: t.fechaCreacion,
        estatus: this.mapEstatusDBToUI(t.estado),
        respuestas: (t.respuestas || []).map(r => ({
          mensaje: r.mensaje,
          fecha: r.fecha,
          autor: 'admin'
        })),
        evidencias: (t.evidencias || []).map(e => ({
          nombre: e.nombre,
          tamano: e.size || 0,
          tipo: 'archivo'
        }))
      }));

      if (!this.tickets.length) {
        this.mensajeInfo = 'Aún no has enviado tickets de soporte.';
      } else {
        this.mensajeInfo = null;
      }
    } catch (error) {
      console.error('Error cargando tickets:', error);
      this.mensajeInfo = 'Error al cargar tus tickets. Intenta más tarde.';
    }
  }

  private mapEstatusDBToUI(estado: string): TicketSoporte['estatus'] {
    switch (estado) {
      case 'ABIERTO':
        return 'pendiente';
      case 'EN_PROCESO':
        return 'en-proceso';
      case 'RESUELTO':
      case 'CERRADO':
        return 'respondido';
      default:
        return 'pendiente';
    }
  }

  obtenerEtiquetaEstatus(estatus: TicketSoporte['estatus']): string {
    switch (estatus) {
      case 'respondido':
        return 'Respondido';
      case 'en-proceso':
        return 'En proceso';
      default:
        return 'Pendiente';
    }
  }

  formatearFecha(fecha: string): string {
    const parsed = new Date(fecha);
    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(parsed);
  }

  obtenerUltimaRespuesta(ticket: TicketSoporte): { mensaje: string; fecha: string } | null {
    if (!ticket.respuestas?.length) {
      return null;
    }
    const respuesta = ticket.respuestas[ticket.respuestas.length - 1];
    return { mensaje: respuesta.mensaje, fecha: respuesta.fecha };
  }

  toggleDetalleRespuesta(ticketId: string): void {
    this.ticketExpandidoId = this.ticketExpandidoId === ticketId ? null : ticketId;
  }

  esTicketExpandido(ticketId: string): boolean {
    return this.ticketExpandidoId === ticketId;
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
