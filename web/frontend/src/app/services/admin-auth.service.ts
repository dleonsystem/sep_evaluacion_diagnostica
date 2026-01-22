import { Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly tokenKey = 'admin-session-token';
  private readonly correoKey = 'admin-session-correo';
  private readonly adminCredentials = {
    email: 'admin@sep.mx',
    password: 'admin123',
  };

  async iniciarSesion(correo: string, contrasena: string): Promise<void> {
    const correoNormalizado = correo.trim().toLowerCase();
    if (
      correoNormalizado !== this.adminCredentials.email ||
      contrasena !== this.adminCredentials.password
    ) {
      throw new Error('Credenciales inválidas.');
    }

    const tokenSimulado = btoa(`${correoNormalizado}:${Date.now()}`);
    localStorage.setItem(this.tokenKey, tokenSimulado);
    localStorage.setItem(this.correoKey, correoNormalizado);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.correoKey);
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  obtenerCorreoSesion(): string | null {
    return localStorage.getItem(this.correoKey);
  }
}
