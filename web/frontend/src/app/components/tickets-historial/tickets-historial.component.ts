import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.requiereLoginParaNuevaCarga()) {
      void this.router.navigate(['/login'], { queryParams: { redirect: '/tickets-historial' } });
      return;
    }

    this.correoActivo = this.normalizarCorreo(this.authService.obtenerCredenciales()?.correo ?? null);
    this.cargarTickets();
  }

  cargarTickets(): void {
    const data = localStorage.getItem('tickets-soporte');
    const tickets = data ? (JSON.parse(data) as TicketSoporte[]) : [];
    const correoActivo = this.normalizarCorreo(this.correoActivo);
    this.tickets = tickets.filter((ticket) => this.normalizarCorreo(ticket.correo) === correoActivo);

    if (!this.tickets.length) {
      this.mensajeInfo = 'Aún no has enviado tickets de soporte.';
      return;
    }

    this.mensajeInfo = null;
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

  private normalizarCorreo(correo: string | null): string | null {
    if (!correo) {
      return null;
    }
    return correo.trim().toLowerCase();
  }
}
