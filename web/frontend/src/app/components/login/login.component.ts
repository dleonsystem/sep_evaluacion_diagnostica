import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { EstadoCredencialesService } from '../../services/estado-credenciales.service';

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
  mostrarContrasena = false;

  constructor(
    private readonly authService: AuthService,
    private readonly estadoCredencialesService: EstadoCredencialesService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const credencialesPersistidas = this.authService.obtenerCredenciales();
    const credenciales = this.estadoCredencialesService.obtener() ?? credencialesPersistidas;

    if (!credenciales) {
      void this.router.navigate(['/carga-masiva']);
      return;
    }

    this.redirect = this.route.snapshot.queryParamMap.get('redirect') ?? this.redirect;
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

    try {
      this.authService.iniciarSesion(this.correo, this.contrasena);
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
