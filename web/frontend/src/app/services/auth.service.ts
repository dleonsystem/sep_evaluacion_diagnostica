import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CredencialesGuardadas {
  cct: string;
  correo: string;
  contrasena: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sesionKey = 'eia-user-session-active';
  private readonly sesionCorreoKey = 'eia-user-session-email';
  private readonly sesionRolKey = 'eia-user-session-role';
  private readonly mustChangePasswordKey = 'eia-user-must-change-password';
  private readonly primerLoginKey = 'eia-user-first-login';

  private autenticadoSubject = new BehaviorSubject<boolean>(this.estaAutenticadoInicial());
  public autenticado$ = this.autenticadoSubject.asObservable();

  private estaAutenticadoInicial(): boolean {
    return localStorage.getItem(this.sesionKey) === 'true';
  }

  iniciarSesion(correo: string, token: string, user: any): void {
    this.marcarSesionActiva();
    localStorage.setItem('eia-token', token);
    localStorage.setItem(this.sesionCorreoKey, this.normalizarCorreo(correo));
    localStorage.setItem(this.sesionRolKey, user.rol);
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.sesionKey);
    localStorage.removeItem('eia-token');
    localStorage.removeItem(this.sesionCorreoKey);
    localStorage.removeItem(this.sesionRolKey);
    this.autenticadoSubject.next(false);
  }

  estaAutenticado(): boolean {
    return localStorage.getItem(this.sesionKey) === 'true';
  }

  debeCambiarPassword(): boolean {
    return false;
  }

  esPrimerLogin(): boolean {
    return false;
  }

  obtenerCorreoSesion(): string | null {
    const correo = localStorage.getItem(this.sesionCorreoKey);
    return correo ? this.normalizarCorreo(correo) : null;
  }

  obtenerRolSesion(): string | null {
    return localStorage.getItem(this.sesionRolKey);
  }

  private marcarSesionActiva(): void {
    localStorage.setItem(this.sesionKey, 'true');
    this.autenticadoSubject.next(true);
  }

  public normalizarCorreo(correo: string): string {
    return (correo ?? '').trim().toLowerCase();
  }
}
