import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core'; // Trigger rebuild
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';
import { EvaluacionesService, SolicitudEia2 } from '../../services/evaluaciones.service';
import {
  TicketsService,
  Ticket as TicketDB,
} from '../../services/tickets.service';
import { UsuariosService, UsuarioCreado } from '../../services/usuarios.service';
import { EscuelasService, Escuela, EscuelaInput } from '../../services/escuelas.service';
import { ExcelValidationService } from '../../services/excel-validation.service';
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
    '.zip',
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
  
  // Paginación Soporte
  paginaSoporteActual = 1;
  paginaIncidenciasActual = 1;
  tamanioPaginaSoporte = 10;
  
  // Incidencias Públicas
  incidenciasPublicas: TicketSoporte[] = [];
  incidenciaSeleccionadaId: string | null = null;
  filtroIncidenciaTexto = '';
  filtroIncidenciaEstatus: 'todos' | TicketSoporte['estatus'] = 'todos';
  tabSoporteActiva: 'usuarios' | 'publico' = 'usuarios';
  paginaActual = 1;
  tamanioPagina = 10;
  readonly opcionesTamanioPagina = [10, 20, 30, 50];
  private readonly uploadHistoryKey = 'adminPanelResultadosHistory';
  private readonly archivosStoragePrefix = 'archivos-resultados';
  private readonly ticketsStorageKey = 'tickets-soporte';

  // Usuarios
  usuarios: UsuarioCreado[] = [];
  filtroUsuarioTexto = '';
  paginaUsuariosActual = 1;
  totalUsuarios = 0;
  cargandoUsuarios = false;
  mostrarModalRespuesta = false;

  get esCoordinadorFederal(): boolean {
    return this.adminAuthService.obtenerRol() === 'COORDINADOR_FEDERAL';
  }
  ticketParaResponder: TicketSoporte | null = null;

  // Nuevo Usuario
  mostrarModalUsuario = false;
  nuevoUsuario = {
    email: '',
    nombre: '',
    apepaterno: '',
    apematerno: '',
    rol: 'CONSULTA' as any,
    claveCCT: ''
  };
  editandoUsuario = false;
  usuarioSeleccionadoId: string | null = null;

  // Catálogo de Escuelas (CU-14)
  escuelas: Escuela[] = [];
  totalEscuelas = 0;
  paginaEscuelasActual = 1;
  filtroEscuelaTexto = '';
  cargandoEscuelas = false;
  mostrarModalEscuela = false;
  editandoEscuela = false;

  nuevaEscuela: any = {
    cct: '',
    nombre: '',
    id_turno: 1,
    id_nivel: 2,
    id_entidad: 14, // Jalisco default
    id_ciclo: 1,
    email: '',
    telefono: '',
    director: '',
    cp: ''
  };

  turnosCat = [
    { id: 1, nombre: 'MATUTINO' },
    { id: 2, nombre: 'VESPERTINO' },
    { id: 3, nombre: 'NOCTURNO' },
    { id: 4, nombre: 'DISCONTINUO' }
  ];

  nivelesCat = [
    { id: 1, nombre: 'PREESCOLAR' },
    { id: 2, nombre: 'PRIMARIA' },
    { id: 3, nombre: 'SECUNDARIA' }
  ];


  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly evaluacionesService: EvaluacionesService,
    private readonly ticketsService: TicketsService,
    private readonly usuariosService: UsuariosService,
    private readonly escuelasService: EscuelasService,
    private readonly excelValidationService: ExcelValidationService,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {
    this.uploadHistory = this.loadUploadHistory();
    this.cargarExcelDisponibles();
    this.cargarTicketsSoporte();
    this.cargarIncidenciasPublicas();
    this.cargarUsuarios();
    this.cargarEscuelas();
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
        text: `Ya hay archivos asignados a ${excelSeleccionado?.nombre ?? 'este Excel'} (${excelSeleccionado?.cct ?? 'CCT no registrada'
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
      const nuevosArchivosBase64 = await this.convertirArchivosBase64(
        this.selectedFiles,
      );

      const resultado = await firstValueFrom(
        this.evaluacionesService.subirResultados(excelKey, nuevosArchivosBase64.map(a => ({
          nombre: a.name,
          base64: a.base64
        })))
      );

      if (resultado.success) {
        const historyEntries = nuevosArchivosBase64.map((archivo) => ({
          name: archivo.name,
          size: archivo.size,
          uploadedAt: new Date().toISOString(),
        }));

        this.uploadHistory = [...historyEntries, ...this.uploadHistory].slice(0, 5);
        this.saveUploadHistory();
        this.actualizarEstadoExcel(excelKey);

        this.uploadStatus = 'success';
        this.feedbackMessage = 'Archivos cargados correctamente al servidor.';
        this.selectedFiles = []; // Limpiar selección

        await Swal.fire({
          icon: 'success',
          title: 'Carga exitosa',
          text: 'Los archivos se han subido y asociado correctamente.',
        });
      } else {
        throw new Error(resultado.message);
      }
    } catch (error: any) {
      this.uploadStatus = 'error';
      this.feedbackMessage = error.message || 'No se pudieron subir los archivos. Intenta nuevamente.';
      await Swal.fire({
        icon: 'error',
        title: 'Error de carga',
        text: this.feedbackMessage,
      });
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
      // Excluir incidencias públicas de la sección de tickets de usuario para evitar duplicidad
      if (ticket.folio.startsWith('PUB-')) {
        return false;
      }

      const coincideTexto =
        !texto ||
        ticket.folio.toLowerCase().includes(texto) ||
        ticket.correo.toLowerCase().includes(texto) ||
        ticket.motivo.toLowerCase().includes(texto);
      const coincideEstatus = estatus === 'todos' || ticket.estatus === estatus;
      return coincideTexto && coincideEstatus;
    });
  }

  get ticketsSoportePaginados(): TicketSoporte[] {
    const inicio = (this.paginaSoporteActual - 1) * this.tamanioPaginaSoporte;
    return this.ticketsSoporteFiltrados.slice(inicio, inicio + this.tamanioPaginaSoporte);
  }

  get totalPaginasSoporte(): number {
    return Math.ceil(this.ticketsSoporteFiltrados.length / this.tamanioPaginaSoporte);
  }

  irAPaginaSoporte(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginasSoporte) return;
    this.paginaSoporteActual = pagina;
  }

  seleccionarTicket(ticket: TicketSoporte): void {
    if (this.ticketSeleccionadoId === ticket.id) {
      this.ticketSeleccionadoId = null;
    } else {
      this.ticketSeleccionadoId = ticket.id;
    }
    this.estatusTicketSeleccionado = ticket.estatus;
  }

  abrirModalRespuesta(ticket: TicketSoporte, event: Event): void {
    event.stopPropagation();
    this.ticketParaResponder = ticket;
    if (this.tabSoporteActiva === 'publico') {
      this.incidenciaSeleccionadaId = ticket.id;
      this.ticketSeleccionadoId = ticket.id; // Also set this for `guardarRespuesta` logic
    } else {
      this.ticketSeleccionadoId = ticket.id;
    }
    this.estatusTicketSeleccionado = ticket.estatus;
    this.respuestaAdmin = '';
    this.mostrarModalRespuesta = true;
  }

  cerrarModalRespuesta(): void {
    this.mostrarModalRespuesta = false;
    this.ticketParaResponder = null;
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
          cerrar
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
      this.cerrarModalRespuesta();
      if (this.tabSoporteActiva === 'publico') {
        await this.cargarIncidenciasPublicas();
      } else {
        await this.cargarTicketsSoporte();
      }
    } catch (error) {
      console.error('Error enviando respuesta:', error);
      await Swal.fire('Error', 'No se pudo enviar la respuesta', 'error');
    }
  }

  async exportarTickets(): Promise<void> {
    try {
      const { fileName, contentBase64 } = await firstValueFrom(this.ticketsService.exportTicketsCSV());
      const link = document.createElement('a');
      link.href = `data:text/csv;base64,${contentBase64}`;
      link.download = fileName;
      link.click();

      await Swal.fire({
        icon: 'success',
        title: 'Exportación completada',
        text: `El archivo ${fileName} se ha descargado correctamente.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error exportando tickets:', error);
      await Swal.fire('Error', 'No se pudo exportar el archivo CSV', 'error');
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
        this.usuariosService.listarUsuarios(this.tamanioPagina, offset, this.filtroUsuarioTexto),
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
    } catch (error: any) {
      const msg = error.message || 'No se pudo enviar la contraseña.';
      await Swal.fire('Error', msg, 'error');
    }
  }

  irAPaginaUsuarios(pagina: number): void {
    const totalPaginas = Math.ceil(this.totalUsuarios / this.tamanioPagina);
    if (pagina < 1 || pagina > totalPaginas) return;
    this.paginaUsuariosActual = pagina;
    this.cargarUsuarios();
  }

  abrirModalUsuario(): void {
    this.nuevoUsuario = {
      email: '',
      nombre: '',
      apepaterno: '',
      apematerno: '',
      rol: 'CONSULTA',
      claveCCT: ''
    };
    this.mostrarModalUsuario = true;
  }

  cerrarModalUsuario(): void {
    this.editandoUsuario = false;
    this.usuarioSeleccionadoId = null;
    this.mostrarModalUsuario = false;
  }

  async guardarUsuario(): Promise<void> {
    if (!this.nuevoUsuario.email || !this.nuevoUsuario.nombre || !this.nuevoUsuario.rol) {
      return;
    }

    this.cargandoUsuarios = true;
    try {
      if (this.editandoUsuario && this.usuarioSeleccionadoId) {
        // Modo Edición
        const input = {
          nombre: this.nuevoUsuario.nombre,
          apepaterno: this.nuevoUsuario.apepaterno,
          apematerno: this.nuevoUsuario.apematerno,
          rol: this.nuevoUsuario.rol,
        };

        await firstValueFrom(
          this.usuariosService.actualizarUsuario(this.usuarioSeleccionadoId, input)
        );

        await Swal.fire({
          icon: 'success',
          title: 'Usuario Actualizado',
          text: `El usuario ${this.nuevoUsuario.email} ha sido actualizado correctamente.`,
        });
      } else {
        // Modo Creación
        const password = Math.random().toString(36).slice(-10) + '!A1';

        await firstValueFrom(
          this.usuariosService.crearUsuario({
            email: this.nuevoUsuario.email,
            nombre: this.nuevoUsuario.nombre,
            apepaterno: this.nuevoUsuario.apepaterno,
            apematerno: this.nuevoUsuario.apematerno,
            rol: this.nuevoUsuario.rol,
            clavesCCT: this.nuevoUsuario.claveCCT ? [this.nuevoUsuario.claveCCT] : [],
            password: password
          })
        );

        await Swal.fire({
          icon: 'success',
          title: 'Usuario Creado',
          text: `El usuario ${this.nuevoUsuario.email} ha sido creado. Se le han enviado sus credenciales por correo electrónico.`,
        });
      }

      this.cerrarModalUsuario();
      await this.cargarUsuarios();
    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
      await Swal.fire('Error', error.message || 'No se pudo procesar la solicitud', 'error');
    } finally {
      this.cargandoUsuarios = false;
    }
  }

  abrirModalEdicion(usuario: UsuarioCreado): void {
    this.editandoUsuario = true;
    this.usuarioSeleccionadoId = usuario.id;
    this.nuevoUsuario = {
      email: usuario.email,
      nombre: usuario.nombre,
      apepaterno: usuario.apepaterno,
      apematerno: usuario.apematerno || '',
      rol: usuario.rol as any,
      claveCCT: '' // En este sistema la CCT es parte de una tabla intermedia o escuela_id
    };
    this.mostrarModalUsuario = true;
  }

  async cambiarEstadoUsuario(usuario: UsuarioCreado): Promise<void> {
    const accion = usuario.activo ? 'desactivar' : 'activar';
    const confirmacion = await Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
      text: `¿Estás seguro de que deseas ${accion} al usuario ${usuario.email}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      if (usuario.activo) {
        // Soft delete
        await firstValueFrom(this.usuariosService.eliminarUsuario(usuario.id));
      } else {
        // Reactivación via update
        await firstValueFrom(this.usuariosService.actualizarUsuario(usuario.id, { activo: true }));
      }

      await Swal.fire('Éxito', `Usuario ${accion}do correctamente.`, 'success');
      await this.cargarUsuarios();
    } catch (error: any) {
      await Swal.fire('Error', error.message || `No se pudo ${accion} al usuario.`, 'error');
    }
  }

  get usuariosFiltrados(): UsuarioCreado[] {
    return this.usuarios;
  }

  get totalPaginasUsuarios(): number {
    return Math.ceil(this.totalUsuarios / this.tamanioPagina);
  }

  get paginasUsuariosDisponibles(): number[] {
    return Array.from({ length: this.totalPaginasUsuarios }, (_, i) => i + 1);
  }

  private mapTicketDBToUI(t: TicketDB): TicketSoporte {
    // Para incidencias públicas, usamos los campos específicos si existen
    const dbCasteada = t as any;
    return {
      id: t.id,
      folio: t.numeroTicket,
      correo: t.correo || 'Sin correo',
      nombreCompleto: t.nombreCompleto || 'Usuario del Sistema',
      motivo: t.asunto,
      motivoDetalle: t.asunto,
      cct: t.cct,
      turno: t.turno,
      descripcion: t.descripcion,
      fecha: t.fechaCreacion,
      estatus: this.mapEstatusDBToUI(t.estado),
      respuestas: (t.respuestas || []).map(r => ({
        mensaje: r.mensaje,
        fecha: r.fecha,
        autor: r.autor || 'admin' 
      })),
      evidencias: (t.evidencias || []).map((e) => ({
        nombre: e.nombre,
        tamano: e.size || 0,
        tipo: 'archivo',
        url: e.url
      })),
    };
  }



  seleccionarIncidencia(incidencia: TicketSoporte): void {
    this.incidenciaSeleccionadaId = (this.incidenciaSeleccionadaId === incidencia.id) ? null : incidencia.id;
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

  private async cargarExcelDisponibles(): Promise<void> {
    try {
      // Aumentamos el límite para obtener más registros y manejarlos localmente
      const registros = await firstValueFrom(this.evaluacionesService.getSolicitudes(undefined, 1000));
      this.excelDisponibles = registros.map((registro) => {
        const key = registro.id;
        const nivel = this.obtenerEtiquetaNivel(registro.nivelEducativo);
        const fecha = registro.fechaCarga;
        const estatus = registro.estadoValidacion === 2 ? 'asignado' : 'pendiente';

        return {
          key,
          nombre: registro.archivoOriginal,
          cct: registro.cct ?? '—',
          turno: registro.turno ?? 'N/D',
          correo: 'Sincronizado',
          size: registro.archivoSize,
          estatus: estatus as 'asignado' | 'pendiente',
          fecha,
          nivel,
          resultados: registro.resultados || [],
        };
      });

      this.paginaActual = this.obtenerPaginaActualDesdeListado(
        this.excelDisponiblesFiltrados,
      );
    } catch (error) {
      console.error('Error cargando archivos del backend:', error);
    }
  }

  private obtenerEtiquetaNivel(id?: number): string {
    switch (id) {
      case 1: return 'preescolar';
      case 2: return 'primaria';
      case 3: return 'secundaria';
      default: return 'preescolar';
    }
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
    // Ahora usamos el estado sincronizado del backend en lugar de localStorage
    const excel = this.excelDisponibles.find(e => e.key === excelKey);
    if (!excel || !excel.resultados) {
      return [];
    }

    // Mapeamos al formato que espera el componente (aunque ya no necesitamos el base64 para los archivos previos)
    return excel.resultados.map(r => ({
      name: r.nombre,
      size: r.size,
      type: r.nombre.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg', // Estimación rápida
      base64: '' // No tenemos el base64 de archivos ya subidos
    }));
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
      mensaje: `Tipo de archivo no permitido: ${nombres}. Solo PDF, XLSX, JPG, Word o ZIP.`,
    };
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

  // --- ESCUELAS (CU-14) ---

  async cargarEscuelas(): Promise<void> {
    this.cargandoEscuelas = true;
    try {
      const offset = (this.paginaEscuelasActual - 1) * this.tamanioPagina;
      const res = await firstValueFrom(
        this.escuelasService.listarEscuelas(this.tamanioPagina, offset, this.filtroEscuelaTexto)
      );
      this.escuelas = res.nodes;
      this.totalEscuelas = res.totalCount;
    } catch (error) {
      console.error('Error cargando escuelas:', error);
    } finally {
      this.cargandoEscuelas = false;
    }
  }

  abrirModalEscuela(escuela?: Escuela): void {
    if (escuela) {
      this.editandoEscuela = true;
      this.nuevaEscuela = {
        id: escuela.id,
        cct: escuela.cct,
        nombre: escuela.nombre,
        id_turno: escuela.turno.id,
        id_nivel: escuela.nivel === 'SECUNDARIA' ? 3 : (escuela.nivel === 'PRIMARIA' ? 2 : 1),
        id_entidad: escuela.entidadFederativa.id,
        id_ciclo: escuela.cicloEscolar.id,
        email: escuela.email,
        telefono: escuela.telefono,
        director: escuela.director,
        cp: escuela.cp
      };
    } else {
      this.editandoEscuela = false;
      this.nuevaEscuela = {
        cct: '',
        nombre: '',
        id_turno: 1,
        id_nivel: 2,
        id_entidad: 14,
        id_ciclo: 1,
        email: '',
        telefono: '',
        director: '',
        cp: ''
      };
    }
    this.mostrarModalEscuela = true;
  }

  cerrarModalEscuela(): void {
    this.mostrarModalEscuela = false;
  }

  async guardarEscuela(): Promise<void> {
    if (!this.nuevaEscuela.cct || !this.nuevaEscuela.nombre) {
      await Swal.fire('Error', 'CCT y Nombre son obligatorios', 'error');
      return;
    }

    const vCct = this.excelValidationService.validarFormatoCCT(this.nuevaEscuela.cct);
    if (!vCct.isValid) {
      await Swal.fire('Error de Formato', vCct.error, 'error');
      return;
    }

    this.cargandoEscuelas = true;
    try {
      if (this.editandoEscuela) {
        const { id, ...input } = this.nuevaEscuela;
        await firstValueFrom(this.escuelasService.actualizarEscuela(id, input));
        await Swal.fire('Éxito', 'Escuela actualizada correctamente', 'success');
      } else {
        await firstValueFrom(this.escuelasService.crearEscuela(this.nuevaEscuela));
        await Swal.fire('Éxito', 'Escuela creada correctamente', 'success');
      }
      this.cerrarModalEscuela();
      await this.cargarEscuelas();
    } catch (error: any) {
      await Swal.fire('Error', error.message || 'No se pudo guardar la escuela', 'error');
    } finally {
      this.cargandoEscuelas = false;
    }
  }

  async eliminarEscuela(escuela: Escuela): Promise<void> {
    const confirm = await Swal.fire({
      title: '¿Eliminar escuela?',
      text: `Esta acción marcará a "${escuela.nombre}" como inactiva.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonColor: '#d33'
    });

    if (confirm.isConfirmed) {
      try {
        await firstValueFrom(this.escuelasService.eliminarEscuela(escuela.id));
        await Swal.fire('Eliminado', 'La escuela ha sido eliminada del catálogo.', 'success');
        await this.cargarEscuelas();
      } catch (error: any) {
        await Swal.fire('Error', error.message || 'Error al eliminar', 'error');
      }
    }
  }

  irAPaginaEscuelas(pagina: number): void {
    const totalPaginas = Math.ceil(this.totalEscuelas / this.tamanioPagina);
    if (pagina < 1 || pagina > totalPaginas) return;
    this.paginaEscuelasActual = pagina;
    this.cargarEscuelas();
  }
  async cargarIncidenciasPublicas(): Promise<void> {
    try {
      const tickets = await firstValueFrom(this.ticketsService.getPublicIncidents());
      this.incidenciasPublicas = tickets.map(t => this.mapTicketDBToUI(t));
    } catch (error) {
      console.error('Error al cargar incidencias públicas', error);
    }
  }

  get incidenciasPublicasFiltradas(): TicketSoporte[] {
    return this.incidenciasPublicas.filter(t => {
      const cumpleTexto = !this.filtroIncidenciaTexto ||
        t.folio.toLowerCase().includes(this.filtroIncidenciaTexto.toLowerCase()) ||
        t.correo.toLowerCase().includes(this.filtroIncidenciaTexto.toLowerCase()) ||
        (t.nombreCompleto && t.nombreCompleto.toLowerCase().includes(this.filtroIncidenciaTexto.toLowerCase()));
      const cumpleEstatus = this.filtroIncidenciaEstatus === 'todos' || t.estatus === this.filtroIncidenciaEstatus;
      return cumpleTexto && cumpleEstatus;
    });
  }

  get incidenciasPublicasPaginadas(): TicketSoporte[] {
    const inicio = (this.paginaIncidenciasActual - 1) * this.tamanioPaginaSoporte;
    return this.incidenciasPublicasFiltradas.slice(inicio, inicio + this.tamanioPaginaSoporte);
  }

  get totalPaginasIncidencias(): number {
    return Math.ceil(this.incidenciasPublicasFiltradas.length / this.tamanioPaginaSoporte);
  }

  irAPaginaIncidencias(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginasIncidencias) return;
    this.paginaIncidenciasActual = pagina;
  }
}

interface ExcelDisponible {
  key: string;
  nombre: string;
  cct: string;
  turno: string;
  correo: string;
  size?: number; // Tamaño en bytes
  estatus: 'asignado' | 'pendiente';
  fecha: string;
  nivel: string;
  resultados?: Array<{ nombre: string; url: string; size: number }>;
}

interface TicketSoporte {
  id: string;
  folio: string;
  correo: string;
  nombreCompleto?: string;
  cct?: string;
  turno?: string;
  motivo: string;
  motivoDetalle: string;
  descripcion: string;
  fecha: string;
  estatus: 'pendiente' | 'en-proceso' | 'respondido';
  respuestas: Array<{ mensaje: string; fecha: string; autor: string }>;
  evidencias: Array<{ nombre: string; tamano: number; tipo: string; url: string }>;
}
