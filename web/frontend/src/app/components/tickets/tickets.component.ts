import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EstadoCredencialesService } from '../../services/estado-credenciales.service';
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
  motivoDetalle: string;
  descripcion: string;
  fecha: string;
  estatus: 'pendiente' | 'en-proceso' | 'respondido';
  respuestas: Array<{ mensaje: string; fecha: string; autor: 'admin' }>;
  evidencias: Array<{ nombre: string; tamano: number; tipo: string }>;
}

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
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
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    if (!this.authService.estaAutenticado()) {
      void this.router.navigate(['/login'], { queryParams: { redirect: '/tickets' } });
      return;
    }

    this.inicializarStorageTickets();

    const credenciales = this.estadoCredencialesService.obtener() ?? this.authService.obtenerCredenciales();
    const correoSesion = this.authService.obtenerCorreoSesion();
    this.correoActivo = this.normalizarCorreo(credenciales?.correo ?? correoSesion ?? null);
    this.cargarTickets();
  }

  get mostrarMotivoOtro(): boolean {
    return this.motivoControl.value === 'Otra';
  }

  get puedeAgregarEvidencias(): boolean {
    return this.evidencias.length < this.maxEvidencias;
  }

  get ticketsStorageJson(): string {
    return localStorage.getItem('tickets-soporte') ?? '[]';
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

    // Aunque no tengamos token real, necesitamos el correo
    if (!this.correoActivo) {
      // Intentar recuperar de auth service, o pedir login
      if (!this.authService.estaAutenticado()) {
        this.mensajeError = 'Inicia sesión para registrar un ticket.';
        return;
      }
    }

    try {
      // 1. Convertir evidencias a Base64
      const evidenciasPromises = this.evidencias.map(async (item) => ({
        nombre: item.archivo.name,
        base64: await this.fileToBase64(item.archivo)
      }));
      const evidenciasToSend = await Promise.all(evidenciasPromises);

      // 2. Preparar Payload GraphQL
      const query = `
        mutation CreateTicket($input: CreateTicketInput!) {
          createTicket(input: $input) {
            id
            numeroTicket
            asunto
            descripcion
            estado
            fechaCreacion
            evidencias {
              nombre
              url
              size
            }
          }
        }
      `;

      const variables = {
        input: {
          motivo: this.motivoControl.value,
          descripcion: this.descripcionControl.value,
          correo: this.correoActivo, // Enviamos correo para identificar usuario (Auth Mock)
          evidencias: evidenciasToSend
        }
      };

      // 3. Enviar Petición
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query, variables })
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      // 4. Éxito y actualización de lista desde DB
      await Swal.fire({
        title: '¡Ticket enviado!',
        text: `Tu ticket se registró correctamente con el folio: ${result.data.createTicket.numeroTicket}`,
        icon: 'success',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#00695c'
      });

      this.motivoControl.reset('');
      this.motivoOtroControl.reset('');
      this.descripcionControl.reset('');
      this.evidencias = [];

      // Recargar la lista real desde la base de datos
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
        // Eliminar prefijo data:tipo;base64,
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

  private inicializarStorageTickets(): void {
    const data = localStorage.getItem('tickets-soporte');
    if (!data) {
      localStorage.setItem('tickets-soporte', '[]');
      return;
    }

    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        localStorage.setItem('tickets-soporte', '[]');
      }
    } catch {
      localStorage.setItem('tickets-soporte', '[]');
    }
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

  private async cargarTickets(): Promise<void> {
    if (!this.correoActivo) return;

    try {
      const query = `
        query GetMyTickets($correo: String) {
          getMyTickets(correo: $correo) {
            id
            numeroTicket
            asunto
            descripcion
            estado
            fechaCreacion
            evidencias {
              nombre
              url
              size
            }
          }
        }
      `;

      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: { correo: this.correoActivo }
        })
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const ticketsDB = result.data.getMyTickets;

      // Mapear al modelo de la UI
      this.ticketsCreados = ticketsDB.map((t: any) => ({
        id: t.id,
        folio: t.numeroTicket,
        correo: this.correoActivo!,
        motivo: t.asunto,
        descripcion: t.descripcion,
        fecha: t.fechaCreacion,
        estatus: this.mapEstatus(t.estado),
        respuestas: [],
        evidencias: (t.evidencias || []).map((e: any) => ({
          nombre: e.nombre,
          tamano: e.size || 0,
          tipo: 'archivo'
        }))
      }));

    } catch (error) {
      console.error('Error cargando tickets:', error);
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
