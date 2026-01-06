import { Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly tokenKey = 'admin-session-token';
  private readonly adminCredentials = {
    email: 'admin@plataforma.local',
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
  }

  obtenerToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.tokenKey);
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }
}
