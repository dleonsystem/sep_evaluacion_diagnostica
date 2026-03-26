import { Injectable } from '@angular/core';
import { firstValueFrom, BehaviorSubject, Observable } from 'rxjs';
import { UsuariosService } from './usuarios.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly tokenKey = 'eia-admin-token';
  private readonly correoKey = 'eia-admin-email';
  private readonly rolKey = 'eia-admin-role';

  private autenticadoSubject = new BehaviorSubject<boolean>(this.estaAutenticadoInicial());
  public autenticado$ = this.autenticadoSubject.asObservable();

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly authService: AuthService
  ) { }

  private estaAutenticadoInicial(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  async iniciarSesion(correo: string, contrasena: string): Promise<void> {
    // 1. Autenticar con el backend
    const usuario = await firstValueFrom(
      this.usuariosService.autenticarUsuario(correo, contrasena)
    );

    // 2. Validar que tenga un rol administrativo
    if (!usuario.user || (usuario.user.rol !== 'COORDINADOR_FEDERAL' && usuario.user.rol !== 'COORDINADOR_ESTATAL')) {
      throw new Error('No tienes permisos de administrador.');
    }

    // 3. Limpiar sesión de usuario regular para evitar conflictos
    this.authService.cerrarSesion();

    // 4. Guardar sesión admin
    const token = usuario.token || btoa(`${usuario.user.email}:${Date.now()}`); // Fallback minimal
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem('eia-jwt', token);
    localStorage.setItem(this.correoKey, usuario.user.email);
    localStorage.setItem(this.rolKey, usuario.user.rol);
    this.autenticadoSubject.next(true);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.correoKey);
    localStorage.removeItem(this.rolKey);
    this.autenticadoSubject.next(false);
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
