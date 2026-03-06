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
      const response = await firstValueFrom(this.usuariosService.recuperarPassword(email));

      // Ahora el backend devuelve 'Solicitud procesada' siempre que el flujo es correcto por seguridad.
      await Swal.fire({
        icon: 'success',
        title: 'Solicitud Recibida',
        text: 'Si el correo está registrado en nuestro sistema, recibirás una nueva contraseña de acceso en unos minutos. Por favor revisa tu bandeja de entrada y spam.',
        confirmButtonText: 'Entendido',
      });

      void this.router.navigate(['/login']);
    } catch (error: any) {
      // Si el error contiene el mensaje de cooldown (tiempo de espera)
      const errorMsg = error?.message || '';

      if (errorMsg.includes('Espera')) {
        await Swal.fire({
          icon: 'warning',
          title: 'Demasiados Intentos',
          text: errorMsg,
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un problema al procesar tu solicitud. Intenta nuevamente más tarde.',
        });
      }
    } finally {
      this.enviando = false;
    }
  }
}
