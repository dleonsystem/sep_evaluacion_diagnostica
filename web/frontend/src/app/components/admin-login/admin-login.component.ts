import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss',
})
export class AdminLoginComponent {
  correo = '';
  contrasena = '';
  mostrarContrasena = false;
  error: string | null = null;
  autenticando = false;

  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly router: Router,
  ) { }

  async iniciarSesion(): Promise<void> {
    this.error = null;
    this.autenticando = true;

    try {
      await this.adminAuthService.iniciarSesion(this.correo, this.contrasena);
      await Swal.fire({
        icon: 'success',
        title: 'Sesión de administrador iniciada',
        text: 'Ya puedes acceder al panel de administración.',
        timer: 2500,
        timerProgressBar: true,
      });
      await this.router.navigateByUrl('/admin/dashboard');
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No fue posible iniciar sesión.';
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo iniciar sesión',
        text: this.error,
      });
    } finally {
      this.autenticando = false;
    }
  }

  toggleMostrarContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }
}
