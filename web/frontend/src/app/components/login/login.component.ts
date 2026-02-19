import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { EstadoCredencialesService } from '../../services/estado-credenciales.service';
import { UsuariosService } from '../../services/usuarios.service';

import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  correo = '';
  contrasena = '';
  error: string | null = null;
  autenticando = false;
  redirect = '/carga-masiva';
  contrasenaGuardada: string | null = null;
  credencialesGuardadas = false;
  sinCredenciales = false;
  mostrarContrasena = false;

  constructor(
    private readonly authService: AuthService,
    private readonly adminAuthService: AdminAuthService,
    private readonly estadoCredencialesService: EstadoCredencialesService,
    private readonly usuariosService: UsuariosService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const credencialesPersistidas = this.authService.obtenerCredenciales();
    const credenciales = this.estadoCredencialesService.obtener() ?? credencialesPersistidas;

    this.redirect = this.route.snapshot.queryParamMap.get('redirect') ?? this.redirect;
    if (!credenciales) {
      this.sinCredenciales = true;
      return;
    }

    this.correo = credenciales.correo;
    this.contrasenaGuardada = credencialesPersistidas?.contrasena ?? null;
    this.credencialesGuardadas = Boolean(credencialesPersistidas);
    if (!this.contrasena) {
      this.contrasena = credenciales.contrasena;
    }
  }

  async iniciarSesion(): Promise<void> {
    this.error = null;
    this.autenticando = true;

    // Asegurar limpieza de sesión administrativa previa
    this.adminAuthService.cerrarSesion();

    try {
      const usuario = await firstValueFrom(
        this.usuariosService.autenticarUsuario(this.correo, this.contrasena)
      );

      // Detectar Roles Administrativos (Rol 2 o 3)
      if (usuario.rol === 'COORDINADOR_FEDERAL' || usuario.rol === 'COORDINADOR_ESTATAL') {
        // Redirigir al flujo de AdminAuthService
        // Simulamos el inicio de sesión admin para activar el menú correcto
        localStorage.setItem('admin-session-token', btoa(`${usuario.email}:${Date.now()}`));
        localStorage.setItem('admin-session-correo', usuario.email);
        localStorage.setItem('admin-session-rol', usuario.rol);

        await Swal.fire({
          icon: 'success',
          title: 'Sesión administrativa',
          text: 'Bienvenido al panel de administración.',
          timer: 2000,
          timerProgressBar: true
        });

        await this.router.navigateByUrl('/admin/panel');
        return;
      }

      const cct = usuario.centrosTrabajo?.[0]?.claveCCT ?? null;
      if (cct) {
        const nuevasCredenciales = this.authService.registrarCredenciales(
          cct,
          this.correo,
          this.contrasena
        );
        this.estadoCredencialesService.actualizar(this.correo, nuevasCredenciales.contrasena);
        this.authService.iniciarSesion(this.correo, this.contrasena);
      } else {
        this.authService.iniciarSesionSinCredenciales(this.correo);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Sesión iniciada',
        text: 'Puedes continuar con tu siguiente envío.',
        timer: 2500,
        timerProgressBar: true
      });
      await this.router.navigateByUrl(this.redirect);
    } catch (error) {
      const mensajeError = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      this.error = `No se pudo iniciar sesión. ${mensajeError}`;
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo iniciar sesión',
        text: this.error
      });
    } finally {
      this.autenticando = false;
    }
  }
}
