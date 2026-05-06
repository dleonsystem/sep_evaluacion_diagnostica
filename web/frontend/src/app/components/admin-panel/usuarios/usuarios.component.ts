import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminAuthService } from '../../../services/admin-auth.service';
import { UsuariosService, UsuarioCreado, Role } from '../../../services/usuarios.service';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export class UsuariosComponent implements OnInit {
  usuarios: UsuarioCreado[] = [];
  filtroUsuarioTexto = '';
  paginaUsuariosActual = 1;
  totalUsuarios = 0;
  tamanioPagina = 10;
  cargandoUsuarios = false;
  mostrarModalUsuario = false;
  editandoUsuario = false;
  usuarioSeleccionadoId: string | null = null;
  rolesDisponibles: Role[] = [];
  cargandoRoles = false;
  mostrarModalPermisos = false;
  rolSeleccionado: Role | null = null;
  permisosEditando: any = {};

  // Catálogo de permisos para la interfaz
  catalogoPermisos = [
    {
      modulo: 'Sistema y Dashboard',
      permisos: [
        { key: 'access_admin_panel', label: 'Acceso al Panel', desc: 'Permite entrar al panel administrativo' },
        { key: 'view_dashboard_metrics', label: 'Ver Métricas', desc: 'Visualizar gráficas y estadísticas' },
        { key: 'manage_system_settings', label: 'Configuración', desc: 'Modificar ajustes globales' }
      ]
    },
    {
      modulo: 'Usuarios y Seguridad',
      permisos: [
        { key: 'view_users', label: 'Ver Usuarios', desc: 'Listar operadores del sistema' },
        { key: 'create_users', label: 'Crear Usuarios', desc: 'Registrar nuevo personal' },
        { key: 'edit_users', label: 'Editar Usuarios', desc: 'Modificar datos existentes' },
        { key: 'delete_users', label: 'Baja de Usuarios', desc: 'Desactivar cuentas' },
        { key: 'reset_user_passwords', label: 'Reiniciar Passwords', desc: 'Forzar cambio de clave' }
      ]
    },
    {
      modulo: 'Operación EIA2 (Excel)',
      permisos: [
        { key: 'upload_assessment_data', label: 'Cargar Excel', desc: 'Subir archivos de evaluación' },
        { key: 'validate_assessment_data', label: 'Validar Cargas', desc: 'Aprobar/Rechazar envíos' },
        { key: 'view_upload_history', label: 'Ver Historial', desc: 'Consulta de todas las cargas' },
        { key: 'delete_upload_records', label: 'Borrar Cargas', desc: 'Eliminar registros de historial' }
      ]
    },
    {
      modulo: 'Reportes y Soporte',
      permisos: [
        { key: 'view_all_reports', label: 'Ver Reportes', desc: 'Acceso a resultados globales' },
        { key: 'download_results_pdf', label: 'Descargar PDFs', desc: 'Bajar comprobantes y resultados' },
        { key: 'generate_consolidated_reports', label: 'Consolidados', desc: 'Generar reportes masivos' },
        { key: 'view_support_tickets', label: 'Ver Tickets', desc: 'Mesa de ayuda' },
        { key: 'respond_support_tickets', label: 'Responder Tickets', desc: 'Atención a usuarios' }
      ]
    },
    {
        modulo: 'Catálogos',
        permisos: [
          { key: 'manage_school_catalog', label: 'Escuelas', desc: 'Editar catálogo de CCTs' },
          { key: 'publish_materials', label: 'Publicar Guías', desc: 'Subir materiales de apoyo' }
        ]
      }
  ];

  nuevoUsuario = {
    email: '',
    nombre: '',
    apepaterno: '',
    apematerno: '',
    rol: 'CONSULTA' as any,
    claveCCT: ''
  };

  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly usuariosService: UsuariosService
  ) { }

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarRoles();
  }

  async cargarRoles(): Promise<void> {
    if (!this.esCoordinadorFederal) return;
    this.cargandoRoles = true;
    try {
      this.rolesDisponibles = await firstValueFrom(this.usuariosService.listarRoles());
    } catch (error) {
      console.error('Error cargando roles:', error);
    } finally {
      this.cargandoRoles = false;
    }
  }

  formatearPermisos(permisos: any): string[] {
    if (!permisos) return [];
    if (Array.isArray(permisos)) return permisos;
    if (typeof permisos === 'object') {
      // Si es un objeto, devolvemos las llaves que sean true
      return Object.keys(permisos).filter(key => permisos[key] === true);
    }
    return [];
  }

  get esCoordinadorFederal(): boolean {
    return this.adminAuthService.obtenerRol() === 'COORDINADOR_FEDERAL';
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
    this.editandoUsuario = false;
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
      claveCCT: ''
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
        await firstValueFrom(this.usuariosService.eliminarUsuario(usuario.id));
      } else {
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

  abrirModalPermisos(rol: Role): void {
    this.rolSeleccionado = rol;
    this.permisosEditando = { ...rol.permisos };
    this.mostrarModalPermisos = true;
  }

  cerrarModalPermisos(): void {
    this.rolSeleccionado = null;
    this.permisosEditando = {};
    this.mostrarModalPermisos = false;
  }

  async guardarPermisos(): Promise<void> {
    if (!this.rolSeleccionado) return;

    this.cargandoRoles = true;
    try {
      await firstValueFrom(
        this.usuariosService.actualizarPermisosRol(this.rolSeleccionado.id, this.permisosEditando)
      );

      await Swal.fire({
        icon: 'success',
        title: 'Permisos Actualizados',
        text: `Los permisos para el rol ${this.rolSeleccionado.nombre} se guardaron correctamente.`,
        timer: 2000,
        showConfirmButton: false
      });

      this.cerrarModalPermisos();
      await this.cargarRoles();
    } catch (error: any) {
      console.error('Error al guardar permisos:', error);
      await Swal.fire('Error', error.message || 'No se pudo actualizar el rol', 'error');
    } finally {
      this.cargandoRoles = false;
    }
  }

  togglePermiso(key: string): void {
    this.permisosEditando[key] = !this.permisosEditando[key];
  }
}
