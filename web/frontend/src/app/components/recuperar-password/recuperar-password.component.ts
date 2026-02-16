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

  ngOnInit(): void {}

  async onSubmit(): Promise<void> {
    if (this.recuperarForm.invalid) {
      this.recuperarForm.markAllAsTouched();
      return;
    }

    this.enviando = true;
    const email = this.recuperarForm.get('email')?.value;

    try {
      await this.usuariosService.recuperarPassword(email).toPromise();
      // Nota: toPromise es deprecated en RxJS 7, pero común. Mejor usar firstValueFrom si Angular version lo permite.
      // Usaremos un enfoque compatible en el service luego.

      await Swal.fire({
        icon: 'success',
        title: 'Correo enviado',
        text: 'Si el correo está registrado, recibirás una nueva contraseña en breve.',
        confirmButtonText: 'Ir al Login',
      });

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
