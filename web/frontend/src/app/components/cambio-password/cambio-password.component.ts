import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UsuariosService } from '../../services/usuarios.service';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-cambio-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div class="text-center">
          <div class="mx-auto h-12 w-12 text-blue-600 mb-4 bg-blue-50 rounded-full flex items-center justify-center">
            <i class="fas fa-key text-xl"></i>
          </div>
          <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight">Actualiza tu contraseña</h2>
          <p class="mt-2 text-sm text-gray-600">
            Es obligatorio cambiar tu clave temporal por una nueva para poder continuar.
          </p>
        </div>

        <form class="mt-8 space-y-6" (submit)="cambiarPassword($event)">
          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="current" class="block text-xs font-semibold text-gray-500 uppercase mb-1">Contraseña Actual</label>
              <input id="current" name="current" type="password" required [(ngModel)]="current"
                class="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="La clave que recibiste por correo">
            </div>
            <div class="pt-4">
              <label for="newPass" class="block text-xs font-semibold text-gray-500 uppercase mb-1">Nueva Contraseña</label>
              <input id="newPass" name="newPass" type="password" required [(ngModel)]="newPass"
                class="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mínimo 8 caracteres">
            </div>
            <div>
              <label for="confirm" class="block text-xs font-semibold text-gray-500 uppercase mb-1">Confirmar Nueva Contraseña</label>
              <input id="confirm" name="confirm" type="password" required [(ngModel)]="confirm"
                class="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Repite la nueva contraseña">
            </div>
          </div>

          <div class="bg-blue-50 p-4 rounded-lg">
             <h4 class="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center">
               <i class="fas fa-shield-alt mr-2"></i> Sugerencias de Seguridad
             </h4>
             <ul class="text-xs text-blue-700 space-y-1 list-disc pl-4">
               <li>Mínimo 8 caracteres</li>
               <li>Usa mayúsculas, minúsculas y números</li>
               <li>Evita usar datos personales</li>
             </ul>
          </div>

          <div>
            <button type="submit" [disabled]="procesando"
              class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-wait">
              <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                <i class="fas fa-sync-alt" [ngClass]="{'fa-spin': procesando}"></i>
              </span>
              Actualizar y Acceder
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    input:focus { border-color: #3b82f6 !important; }
  `]
})
export class CambioPasswordComponent {
  current = '';
  newPass = '';
  confirm = '';
  procesando = false;

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  async cambiarPassword(e: Event): Promise<void> {
    e.preventDefault();
    
    if (this.newPass !== this.confirm) {
        await Swal.fire('Error', 'Las nuevas contraseñas no coinciden', 'error');
        return;
    }

    if (this.newPass.length < 8) {
        await Swal.fire('Error', 'La contraseña debe tener al menos 8 caracteres', 'error');
        return;
    }

    this.procesando = true;
    try {
        const res = await firstValueFrom(this.usuariosService.changePassword(this.current, this.newPass));
        
        if (res.ok) {
            await Swal.fire({
                icon: 'success',
                title: 'Contraseña actualizada',
                text: 'Tu acceso ahora es seguro. ¡Bienvenido!',
                timer: 2000,
                showConfirmButton: false
            });
            // Importante: No cerramos sesión, solo redirigimos
            // El guard ahora lo dejará pasar porque el flag local de localStorage debe estar actualizado.
            // OJO: La respuesta de changePassword debería devolver el nuevo flag o nosotros forzarlo.
            localStorage.setItem('eia-user-must-change-password', 'false');
            localStorage.setItem('eia-user-first-login', 'false');
            
            await this.router.navigate(['/archivos-evaluacion']);
        } else {
            await Swal.fire('Error', res.message || 'No se pudo actualizar la contraseña', 'error');
        }
    } catch (err: any) {
        await Swal.fire('Error', err.message || 'Error en el servidor', 'error');
    } finally {
        this.procesando = false;
    }
  }
}
