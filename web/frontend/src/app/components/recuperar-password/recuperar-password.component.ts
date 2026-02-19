import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { UsuariosService } from '../../services/usuarios.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './recuperar-password.component.html',
  styleUrl: './recuperar-password.component.scss',
})
export class RecuperarPasswordComponent implements OnInit {
  recuperarForm: FormGroup;
  enviando = false;
  envioExitoso = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly usuariosService: UsuariosService,
    private readonly router: Router,
  ) {
    this.recuperarForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void { }

  async onSubmit(): Promise<void> {
    if (this.recuperarForm.invalid) {
      this.recuperarForm.markAllAsTouched();
      return;
    }

    this.enviando = true;
    const email = this.recuperarForm.get('email')?.value;

    try {
      const passwordRecuperada = await firstValueFrom(this.usuariosService.recuperarPassword(email));

      if (passwordRecuperada) {
        console.log(`[DEBUG] Contraseña recuperada para ${email}: ${passwordRecuperada}`);

        await Swal.fire({
          icon: 'success',
          title: 'Contraseña Generada',
          html: `
            <p>Se ha generado una nueva contraseña debido a que aún no hay servidor SMTP:</p>
            <div style="background: #f1f5f9; padding: 10px; border-radius: 8px; font-family: monospace; font-size: 1.2em; margin: 10px 0;">
              <strong>${passwordRecuperada}</strong>
            </div>
            <p>Por favor, cópiala e inicia sesión.</p>
          `,
          confirmButtonText: 'Ir al Login',
        });
      } else {
        await Swal.fire({
          icon: 'success',
          title: 'Solicitud procesada',
          text: 'Si el correo está registrado, recibirás una nueva contraseña en breve.',
          confirmButtonText: 'Ir al Login',
        });
      }

      void this.router.navigate(['/login']);
    } catch (error) {
      // Por seguridad, no indicamos si el correo existe o no al usuario final en caso de error específico,
      // salvo que sea un error de conexión.
      // Pero para UX, mostraremos un mensaje genérico de error.
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un problema al procesar tu solicitud. Intenta nuevamente.',
      });
    } finally {
      this.enviando = false;
    }
  }
}
