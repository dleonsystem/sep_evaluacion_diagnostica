import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UsuariosService } from './usuarios.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly tokenKey = 'admin-session-token';
  private readonly correoKey = 'admin-session-correo';
  private readonly rolKey = 'admin-session-rol';

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly authService: AuthService
  ) { }

  async iniciarSesion(correo: string, contrasena: string): Promise<void> {
    // 1. Autenticar con el backend
    const usuario = await firstValueFrom(
      this.usuariosService.autenticarUsuario(correo, contrasena)
    );

    // 2. Validar que tenga un rol administrativo
    if (usuario.rol !== 'COORDINADOR_FEDERAL' && usuario.rol !== 'COORDINADOR_ESTATAL') {
      throw new Error('No tienes permisos de administrador.');
    }

    // 3. Limpiar sesión de usuario regular para evitar conflictos
    this.authService.cerrarSesion();

    // 4. Guardar sesión admin
    const tokenSimulado = btoa(`${usuario.email}:${Date.now()}`);
    localStorage.setItem(this.tokenKey, tokenSimulado);
    localStorage.setItem(this.correoKey, usuario.email);
    localStorage.setItem(this.rolKey, usuario.rol);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.correoKey);
    localStorage.removeItem(this.rolKey);
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  obtenerCorreoSesion(): string | null {
    return localStorage.getItem(this.correoKey);
  }

  obtenerRol(): string | null {
    return localStorage.getItem(this.rolKey);
  }
}
