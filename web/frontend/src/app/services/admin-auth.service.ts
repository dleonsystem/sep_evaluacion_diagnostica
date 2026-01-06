import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface AdminLoginResponse {
  access_token: string;
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly tokenKey = 'admin-session-token';
  private readonly apiBaseUrl = 'http://localhost:3000';

  constructor(private readonly http: HttpClient) {}

  async iniciarSesion(correo: string, contrasena: string): Promise<void> {
    const respuesta = await firstValueFrom(
      this.http.post<AdminLoginResponse>(`${this.apiBaseUrl}/auth/admin/login`, {
        email: correo.trim().toLowerCase(),
        password: contrasena,
      }),
    );

    if (!respuesta?.access_token) {
      throw new Error('No se recibió un token válido.');
    }

    localStorage.setItem(this.tokenKey, respuesta.access_token);
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
