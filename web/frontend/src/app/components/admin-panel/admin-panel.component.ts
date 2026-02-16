import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';
import {
  ArchivoStorageService,
  RegistroArchivo,
} from '../../services/archivo-storage.service';
import {
  TicketsService,
  Ticket as TicketDB,
} from '../../services/tickets.service';
import {
  UsuariosService,
  UsuarioCreado,
} from '../../services/usuarios.service';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss',
})
export class AdminPanelComponent implements OnInit {
  readonly maxArchivos = 10;
  readonly extensionesPermitidas = [
    '.pdf',
    '.xlsx',
    '.jpg',
    '.jpeg',
    '.doc',
    '.docx',
  ];
  selectedFiles: File[] = [];
  selectedNivel = '';
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error' = 'idle';
  feedbackMessage = '';
  uploadHistory: Array<{ name: string; size: number; uploadedAt: string }> = [];
  excelDisponibles: ExcelDisponible[] = [];
  excelSeleccionado: ExcelDisponible | null = null;
  filtroTexto = '';
  filtroEstatus: 'todos' | 'asignado' | 'pendiente' = 'todos';
  filtroFecha = '';
  ticketsSoporte: TicketSoporte[] = [];
  ticketSeleccionadoId: string | null = null;
  respuestaAdmin = '';
  estatusTicketSeleccionado: TicketSoporte['estatus'] = 'pendiente';
  filtroTicketTexto = '';
  filtroTicketEstatus: 'todos' | TicketSoporte['estatus'] = 'todos';
  paginaActual = 1;
  tamanioPagina = 10;
  private readonly uploadHistoryKey = 'adminPanelResultadosHistory';
  private readonly archivosStoragePrefix = 'archivos-resultados';
  private readonly ticketsStorageKey = 'tickets-soporte';

  // Usuarios
  usuarios: UsuarioCreado[] = [];
  filtroUsuarioTexto = '';
  paginaUsuariosActual = 1;
  totalUsuarios = 0;
  cargandoUsuarios = false;

  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly archivoStorageService: ArchivoStorageService,
    private readonly ticketsService: TicketsService,
    private readonly usuariosService: UsuariosService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.uploadHistory = this.loadUploadHistory();
    this.cargarExcelDisponibles();
    this.cargarExcelDisponibles();
    this.cargarTicketsSoporte();
    this.cargarUsuarios();
  }

  seleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivos = input.files ? Array.from(input.files) : [];
    const validacionCantidad = this.validarCantidadArchivos(archivos);

    if (!validacionCantidad.esValida) {
      this.uploadStatus = 'idle';
      this.feedbackMessage = validacionCantidad.mensaje;
      this.selectedFiles = [];
      input.value = '';
      return;
    }

    const validacionTipos = this.validarTiposArchivos(archivos);
    if (!validacionTipos.esValida) {
      this.uploadStatus = 'error';
      this.feedbackMessage = validacionTipos.mensaje;
      this.selectedFiles = [];
      input.value = '';
      return;
    }

    this.selectedFiles = archivos;
    this.uploadStatus = 'idle';
    this.feedbackMessage =
      archivos.length === 1
        ? `Archivo seleccionado: ${archivos[0].name}`
        : `Archivos seleccionados: ${archivos.length}`;
  }

  async subirArchivos(): Promise<void> {
    if (!this.excelSeleccionado) {
      this.uploadStatus = 'error';
      this.feedbackMessage =
        'Selecciona un registro de Excel antes de subir los archivos.';
      await Swal.fire({
        icon: 'warning',
        title: 'Registro requerido',
        text: 'Selecciona un registro de Excel antes de subir los archivos.',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    if (!this.selectedFiles.length) {
      this.uploadStatus = 'error';
      this.feedbackMessage = 'No se ha seleccionado ningún archivo.';
      return;
    }

    const validacionTipos = this.validarTiposArchivos(this.selectedFiles);
    if (!validacionTipos.esValida) {
      this.uploadStatus = 'error';
      this.feedbackMessage = validacionTipos.mensaje;
      return;
    }

    const existingFiles = this.obtenerArchivosParaExcel(
      this.excelSeleccionado.key,
    );
    if (existingFiles.length + this.selectedFiles.length > this.maxArchivos) {
      this.uploadStatus = 'error';
      this.feedbackMessage = `Solo puedes cargar hasta ${this.maxArchivos} archivos por registro.`;
      return;
    }

    this.uploadStatus = 'uploading';
    this.feedbackMessage = 'Cargando archivos...';

    const excelKey = this.excelSeleccionado.key;
    const excelSeleccionado = this.excelSeleccionado;

    if (existingFiles.length) {
      const confirmacion = await Swal.fire({
        title: '¿Agregar más archivos?',
        text: `Ya hay archivos asignados a ${excelSeleccionado?.nombre ?? 'este Excel'} (${
          excelSeleccionado?.cct ?? 'CCT no registrada'
        }, ${excelSeleccionado?.correo ?? 'correo no registrado'}).`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, agregar',
        cancelButtonText: 'Cancelar',
      });

      if (!confirmacion.isConfirmed) {
        this.uploadStatus = 'idle';
        this.feedbackMessage =
          'Carga cancelada. Se mantuvieron los archivos previos.';
        return;
      }
    }

    try {
      const nuevosArchivos = await this.convertirArchivosBase64(
        this.selectedFiles,
      );
      const metadata = {
        excelKey,
        archivos: [...existingFiles, ...nuevosArchivos],
        fecha: new Date().toISOString(),
      };

      localStorage.setItem(
        this.obtenerArchivosStorageKey(excelKey),
        JSON.stringify(metadata),
      );

      const historyEntries = nuevosArchivos.map((archivo) => ({
        name: archivo.name,
        size: archivo.size,
        uploadedAt: metadata.fecha,
      }));

      this.uploadHistory = [...historyEntries, ...this.uploadHistory].slice(
        0,
        5,
      );
      this.saveUploadHistory();
      this.actualizarEstadoExcel(excelKey);

      this.uploadStatus = 'success';
      this.feedbackMessage = 'Archivos cargados correctamente.';
    } catch (error) {
      this.uploadStatus = 'error';
      this.feedbackMessage =
        'No se pudieron leer los archivos. Intenta nuevamente.';
    }
  }

  obtenerToken(): string | null {
    return this.adminAuthService.obtenerToken();
  }

  cerrarSesion(): void {
    this.adminAuthService.cerrarSesion();
    this.selectedFiles = [];
    this.excelSeleccionado = null;
    this.selectedNivel = '';
    this.uploadStatus = 'idle';
    this.feedbackMessage = '';
    void this.router.navigate(['/admin/login']);
  }

  get ticketsSoporteFiltrados(): TicketSoporte[] {
    const texto = this.filtroTicketTexto.trim().toLowerCase();
    const estatus = this.filtroTicketEstatus;
    return this.ticketsSoporte.filter((ticket) => {
      const coincideTexto =
        !texto ||
        ticket.folio.toLowerCase().includes(texto) ||
        ticket.correo.toLowerCase().includes(texto) ||
        ticket.motivo.toLowerCase().includes(texto);
      const coincideEstatus = estatus === 'todos' || ticket.estatus === estatus;
      return coincideTexto && coincideEstatus;
    });
  }

  seleccionarTicket(ticket: TicketSoporte): void {
    this.ticketSeleccionadoId = ticket.id;
    this.estatusTicketSeleccionado = ticket.estatus;
    this.respuestaAdmin = '';
  }

  async guardarRespuesta(): Promise<void> {
    if (!this.ticketSeleccionadoId) {
      return;
    }

    const mensaje = this.respuestaAdmin.trim();
    if (!mensaje) {
      await Swal.fire('Error', 'Debes escribir una respuesta', 'error');
      return;
    }

    try {
      const cerrar = this.estatusTicketSeleccionado === 'respondido';
      await firstValueFrom(
        this.ticketsService.respondToTicket(
          this.ticketSeleccionadoId,
          mensaje,
          cerrar,
        ),
      );

      await Swal.fire({
        icon: 'success',
        title: 'Respuesta enviada',
        text: 'El ticket ha sido actualizado correctamente.',
        timer: 2000,
        showConfirmButton: false,
      });

      this.respuestaAdmin = '';
      await this.cargarTicketsSoporte();
    } catch (error) {
      console.error('Error enviando respuesta:', error);
      await Swal.fire('Error', 'No se pudo enviar la respuesta', 'error');
    }
  }

  obtenerUltimaRespuesta(
    ticket: TicketSoporte,
  ): { mensaje: string; fecha: string } | null {
    if (!ticket.respuestas?.length) {
      return null;
    }
    const respuesta = ticket.respuestas[ticket.respuestas.length - 1];
    return { mensaje: respuesta.mensaje, fecha: respuesta.fecha };
  }

  formatearFecha(fecha: string): string {
    const parsed = new Date(fecha);
    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(parsed);
  }

  get excelDisponiblesFiltrados(): ExcelDisponible[] {
    return this.aplicarFiltros(this.excelDisponibles);
  }

  get totalPaginas(): number {
    return this.obtenerTotalPaginas(this.excelDisponiblesFiltrados);
  }

  get paginaActualDerivada(): number {
    return this.obtenerPaginaActualDesdeListado(this.excelDisponiblesFiltrados);
  }

  get excelDisponiblesPaginados(): ExcelDisponible[] {
    const paginaActual = this.paginaActualDerivada;
    const inicio = (paginaActual - 1) * this.tamanioPagina;
    return this.excelDisponiblesFiltrados.slice(
      inicio,
      inicio + this.tamanioPagina,
    );
  }

  get paginasDisponibles(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, index) => index + 1);
  }

  irAPagina(pagina: number): void {
    this.paginaActual = Math.min(Math.max(pagina, 1), this.totalPaginas);
  }

  onFiltrosActualizados(): void {
    this.paginaActual = 1;
  }

  seleccionarExcel(excel: ExcelDisponible): void {
    this.excelSeleccionado = excel;
    this.uploadStatus = 'idle';
    this.feedbackMessage = `Registro seleccionado: ${excel.nombre}.`;
  }

  private loadUploadHistory(): Array<{
    name: string;
    size: number;
    uploadedAt: string;
  }> {
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

  private async cargarTicketsSoporte(): Promise<void> {
    try {
      const ticketsDB = await firstValueFrom(
        this.ticketsService.getAllTickets(),
      );
      this.ticketsSoporte = ticketsDB.map((t) => this.mapTicketDBToUI(t));
    } catch (error) {
      console.error('Error cargando tickets:', error);
    }
  }
  async cargarUsuarios(): Promise<void> {
    this.cargandoUsuarios = true;
    try {
      const offset = (this.paginaUsuariosActual - 1) * this.tamanioPagina;
      const resultado = await firstValueFrom(
        this.usuariosService.listarUsuarios(this.tamanioPagina, offset),
      );
      this.usuarios = resultado.nodes;
      this.totalUsuarios = resultado.totalCount;
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      this.cargandoUsuarios = false;
    }
  }

  async enviarPassword(usuario: UsuarioCreado): Promise<void> {
    const confirmacion = await Swal.fire({
      title: '¿Enviar contraseña?',
      text: `Se enviará una nueva contraseña al correo ${usuario.email}. La contraseña anterior dejará de funcionar.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    try {
      await firstValueFrom(
        this.usuariosService.recuperarPassword(usuario.email),
      );
      await Swal.fire(
        'Enviado',
        `Se ha enviado la nueva contraseña a ${usuario.email}`,
        'success',
      );
    } catch (error) {
      await Swal.fire('Error', 'No se pudo enviar la contraseña.', 'error');
    }
  }

  irAPaginaUsuarios(pagina: number): void {
    const totalPaginas = Math.ceil(this.totalUsuarios / this.tamanioPagina);
    if (pagina < 1 || pagina > totalPaginas) return;
    this.paginaUsuariosActual = pagina;
    this.cargarUsuarios();
  }

  get usuariosFiltrados(): UsuarioCreado[] {
    if (!this.filtroUsuarioTexto) return this.usuarios;
    const texto = this.filtroUsuarioTexto.toLowerCase();
    return this.usuarios.filter(
      (u) =>
        u.email.toLowerCase().includes(texto) ||
        u.nombre.toLowerCase().includes(texto) ||
        (u.apepaterno && u.apepaterno.toLowerCase().includes(texto)),
    );
  }

  get totalPaginasUsuarios(): number {
    return Math.ceil(this.totalUsuarios / this.tamanioPagina);
  }

  get paginasUsuariosDisponibles(): number[] {
    return Array.from({ length: this.totalPaginasUsuarios }, (_, i) => i + 1);
  }

  private mapTicketDBToUI(t: TicketDB): TicketSoporte {
    return {
      id: t.id,
      folio: t.numeroTicket,
      correo: (t as any).correo || 'Anónimo',
      motivo: t.asunto,
      motivoDetalle: t.asunto,
      descripcion: t.descripcion,
      fecha: t.fechaCreacion,
      estatus: this.mapEstatusDBToUI(t.estado),
      respuestas: [], // TODO: Traer comentarios del backend
      evidencias: (t.evidencias || []).map((e) => ({
        nombre: e.nombre,
        tamano: e.size || 0,
        tipo: 'archivo',
      })),
    };
  }

  private mapEstatusDBToUI(estado: string): TicketSoporte['estatus'] {
    switch (estado) {
      case 'ABIERTO':
        return 'pendiente';
      case 'EN PROCESO':
        return 'en-proceso';
      case 'RESUELTO':
      case 'CERRADO':
        return 'respondido';
      default:
        return 'pendiente';
    }
  }

  private obtenerTicketsSoporte(): TicketSoporte[] {
    const stored = localStorage.getItem(this.ticketsStorageKey);
    if (!stored) {
      return [];
    }

    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((ticket) => ({
        ...ticket,
        respuestas: Array.isArray(ticket.respuestas) ? ticket.respuestas : [],
      }));
    } catch {
      return [];
    }
  }

  private saveUploadHistory(): void {
    localStorage.setItem(
      this.uploadHistoryKey,
      JSON.stringify(this.uploadHistory),
    );
  }

  private cargarExcelDisponibles(): void {
    const registros = this.archivoStorageService.obtenerTodosRegistros();
    this.excelDisponibles = registros.map((registro) => {
      const key = this.obtenerClaveExcel(registro);
      const nivel = this.obtenerNivelRegistro(registro);
      const fecha = registro.fechaGuardado || new Date().toISOString();
      const estatus =
        registro.estatus ??
        (this.existeArchivosParaExcel(key) ? 'asignado' : 'pendiente');
      return {
        key,
        nombre: registro.nombre,
        cct: registro.cct ?? '—',
        correo: registro.correo ?? '—',
        estatus,
        fecha,
        nivel,
      };
    });

    this.paginaActual = this.obtenerPaginaActualDesdeListado(
      this.excelDisponiblesFiltrados,
    );
  }

  private actualizarEstadoExcel(excelKey: string): void {
    this.excelDisponibles = this.excelDisponibles.map((excel) => {
      if (excel.key !== excelKey) {
        return excel;
      }
      return { ...excel, estatus: 'asignado' };
    });
  }

  private aplicarFiltros(listado: ExcelDisponible[]): ExcelDisponible[] {
    const texto = this.filtroTexto.trim().toLowerCase();
    const estatus = this.filtroEstatus;
    const fecha = this.filtroFecha;
    const nivel = this.selectedNivel;

    return listado.filter((excel) => {
      const coincideTexto =
        !texto ||
        excel.nombre.toLowerCase().includes(texto) ||
        excel.cct.toLowerCase().includes(texto) ||
        excel.correo.toLowerCase().includes(texto);
      const coincideEstatus = estatus === 'todos' || excel.estatus === estatus;
      const coincideFecha =
        !fecha || this.obtenerFechaISO(excel.fecha) === fecha;
      const coincideNivel = !nivel || excel.nivel === nivel;

      return coincideTexto && coincideEstatus && coincideFecha && coincideNivel;
    });
  }

  private obtenerFechaISO(fecha: string): string {
    const fechaParsed = new Date(fecha);
    if (Number.isNaN(fechaParsed.getTime())) {
      return '';
    }
    return fechaParsed.toISOString().slice(0, 10);
  }

  private obtenerTotalPaginas(listado: ExcelDisponible[]): number {
    return Math.max(1, Math.ceil(listado.length / this.tamanioPagina));
  }

  private obtenerPaginaActualDesdeListado(listado: ExcelDisponible[]): number {
    const totalPaginas = this.obtenerTotalPaginas(listado);
    if (this.paginaActual > totalPaginas) {
      return totalPaginas;
    }
    if (this.paginaActual < 1) {
      return 1;
    }
    return this.paginaActual;
  }

  private existeArchivosParaExcel(excelKey: string): boolean {
    return this.obtenerArchivosParaExcel(excelKey).length > 0;
  }

  private obtenerArchivosStorageKey(excelKey: string): string {
    return `${this.archivosStoragePrefix}:${excelKey}`;
  }

  private obtenerArchivosParaExcel(
    excelKey: string,
  ): Array<{ name: string; size: number; type: string; base64: string }> {
    const stored = localStorage.getItem(
      this.obtenerArchivosStorageKey(excelKey),
    );
    if (!stored) {
      return [];
    }

    try {
      const parsed = JSON.parse(stored) as {
        archivos?: Array<{
          name: string;
          size: number;
          type: string;
          base64: string;
        }>;
        pdfName?: string;
        pdfBase64?: string;
      };

      if (Array.isArray(parsed.archivos)) {
        return parsed.archivos;
      }

      if (parsed.pdfBase64 && parsed.pdfName) {
        return [
          {
            name: parsed.pdfName,
            size: 0,
            type: 'application/pdf',
            base64: parsed.pdfBase64,
          },
        ];
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  private obtenerClaveExcel(registro: RegistroArchivo): string {
    if (registro.claveEstable) {
      return registro.claveEstable;
    }

    const cct = (registro.cct ?? '').trim();
    const correo = (registro.correo ?? '').trim().toLowerCase();
    return `${cct}|${correo}|${registro.nombre}|${registro.fechaGuardado}`;
  }

  private obtenerNivelRegistro(registro: RegistroArchivo): string {
    if (registro.nivel) {
      return registro.nivel;
    }

    const ruta = registro.ruta?.toLowerCase() ?? '';
    if (ruta.includes('/primaria/')) {
      return 'primaria';
    }
    if (ruta.includes('/secundaria/')) {
      return 'secundaria';
    }
    if (ruta.includes('/preescolar/')) {
      return 'preescolar';
    }

    return 'preescolar';
  }

  private readArchivoAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }
        reject(new Error('Formato inválido'));
      };
      reader.onerror = () => reject(new Error('Error al leer archivo'));
      reader.readAsDataURL(file);
    });
  }

  private async convertirArchivosBase64(
    archivos: File[],
  ): Promise<
    Array<{ name: string; size: number; type: string; base64: string }>
  > {
    const resultados = [];
    for (const archivo of archivos) {
      const base64 = await this.readArchivoAsBase64(archivo);
      resultados.push({
        name: archivo.name,
        size: archivo.size,
        type: archivo.type,
        base64,
      });
    }
    return resultados;
  }

  private validarCantidadArchivos(archivos: File[]): {
    esValida: boolean;
    mensaje: string;
  } {
    if (!archivos.length) {
      return {
        esValida: false,
        mensaje: 'Selecciona hasta 10 archivos para comenzar.',
      };
    }

    if (archivos.length > this.maxArchivos) {
      return {
        esValida: false,
        mensaje: `Solo puedes seleccionar hasta ${this.maxArchivos} archivos por carga.`,
      };
    }

    return { esValida: true, mensaje: '' };
  }

  private validarTiposArchivos(archivos: File[]): {
    esValida: boolean;
    mensaje: string;
  } {
    const archivosInvalidos = archivos.filter((archivo) => {
      const nombre = archivo.name.toLowerCase();
      return !this.extensionesPermitidas.some((extension) =>
        nombre.endsWith(extension),
      );
    });

    if (!archivosInvalidos.length) {
      return { esValida: true, mensaje: '' };
    }

    const nombres = archivosInvalidos.map((archivo) => archivo.name).join(', ');
    return {
      esValida: false,
      mensaje: `Tipo de archivo no permitido: ${nombres}. Solo PDF, XLSX, JPG o Word.`,
    };
  }
}

interface ExcelDisponible {
  key: string;
  nombre: string;
  cct: string;
  correo: string;
  estatus: 'asignado' | 'pendiente';
  fecha: string;
  nivel: string;
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
