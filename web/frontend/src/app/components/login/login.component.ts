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
    this.redirect = this.route.snapshot.queryParamMap.get('redirect') ?? this.redirect;
    // La lógica de pre-poblado/mocks ha sido removida por seguridad (Issue #268)
  }

  async iniciarSesion(): Promise<void> {
    this.error = null;
    this.autenticando = true;

    try {
      // 1. Llamar al servicio de autenticación GraphQL
      const response = await firstValueFrom(
        this.usuariosService.autenticarUsuario(this.correo, this.contrasena)
      );

      if (!response || !response.ok) {
        throw new Error(response?.message || 'Credenciales inválidas');
      }

      const usuario = response.user;
      const token = response.token;

      if (!usuario || !token) {
        throw new Error('No se recibió la información del usuario o el token de acceso.');
      }

      // 2. Persistir sesión en el servicio correspondiente
      const esAdmin = usuario.rol === 'COORDINADOR_FEDERAL' || usuario.rol === 'COORDINADOR_ESTATAL';

      if (esAdmin) {
        this.adminAuthService.establecerSesion(this.correo, token, usuario.rol);
      } else {
        this.authService.iniciarSesion(this.correo, token, usuario);
      }

      // 3. Notificar y Redirigir según Rol y Estado de Seguridad (Ajuste Issue #352)
      await Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: 'Sesión iniciada correctamente.',
        timer: 1500,
        showConfirmButton: false
      });

      // Prioridad: Si es primer login, forzar cambio de contraseña (RF-18.1)
      if (usuario.primerLogin) {
        await this.router.navigateByUrl('/cambiar-password');
        return;
      }

      if (esAdmin) {
        await this.router.navigateByUrl('/admin/dashboard');
      } else {
        await this.router.navigateByUrl('/archivos-evaluacion');
      }

    } catch (error: any) {
      this.error = error.message || 'Error al conectar con el servidor.';
      await Swal.fire({
        icon: 'error',
        title: 'Error de acceso',
        text: this.error || 'Verifique sus credenciales.'
      });
    } finally {
      this.autenticando = false;
    }
  }
}
