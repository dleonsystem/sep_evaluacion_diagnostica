import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';

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

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const credenciales = this.authService.obtenerCredenciales();
    if (!credenciales) {
      void this.router.navigate(['/carga-masiva']);
      return;
    }

    this.redirect = this.route.snapshot.queryParamMap.get('redirect') ?? this.redirect;
    this.correo = credenciales.correo;
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
      this.error = error instanceof Error ? error.message : 'No fue posible iniciar sesión.';
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
