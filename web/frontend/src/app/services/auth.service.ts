import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CredencialesGuardadas {
  cct: string;
  correo: string;
  contrasena: string;
  esNueva: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sesionKey = 'eia-user-session-active';
  private readonly sesionCorreoKey = 'eia-user-session-email';
  private readonly sesionRolKey = 'eia-user-session-role';
  private readonly sesionCctKey = 'eia-user-session-cct';
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
    
    // Extraer CCT de la estructura de GraphQL si está presente
    const cct = user.cct || (user.centrosTrabajo && user.centrosTrabajo.length > 0 ? user.centrosTrabajo[0].claveCCT : null);
    
    if (cct) {
      localStorage.setItem(this.sesionCctKey, cct);
    }
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.sesionKey);
    localStorage.removeItem('eia-token');
    localStorage.removeItem(this.sesionCorreoKey);
    localStorage.removeItem(this.sesionRolKey);
    localStorage.removeItem(this.sesionCctKey);
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
  
  obtenerCctSesion(): string | null {
    return localStorage.getItem(this.sesionCctKey);
  }

  public registrarCredenciales(cct: string, correo: string, contrasena: string): CredencialesGuardadas {
    const credenciales: CredencialesGuardadas = { 
      cct, 
      correo: this.normalizarCorreo(correo), 
      contrasena,
      esNueva: true 
    };
    localStorage.setItem('eia-last-credentials', JSON.stringify(credenciales));
    return credenciales;
  }

  public obtenerCredenciales(): CredencialesGuardadas | null {
    const guardadas = localStorage.getItem('eia-last-credentials');
    if (!guardadas) return null;
    try {
      const parsed = JSON.parse(guardadas);
      return {
        ...parsed,
        esNueva: !!parsed.esNueva
      };
    } catch {
      return null;
    }
  }

  private marcarSesionActiva(): void {
    localStorage.setItem(this.sesionKey, 'true');
    this.autenticadoSubject.next(true);
  }

  public normalizarCorreo(correo: string): string {
    return (correo ?? '').trim().toLowerCase();
  }

  public requiereLoginParaNuevaCarga(correo?: string): boolean {
    const autenticado = this.estaAutenticado();
    const correoInput = correo ? this.normalizarCorreo(correo) : null;

    if (autenticado) {
      const correoSesion = this.obtenerCorreoSesion();
      // Si está autenticado, solo bloqueamos si intenta cargar para un correo DISTINTO al de su sesión
      return !!correoInput && !!correoSesion && correoSesion !== correoInput;
    }

    // Si NO está autenticado, el componente CargaMasivaComponent maneja la verificación
    // asíncrona con el servidor para ver si el correo ya existe.
    // Aquí solo bloqueamos si tenemos evidencia LOCAL (en el mismo navegador) de que ya tiene cuenta.
    const credenciales = this.obtenerCredenciales();
    if (credenciales && correoInput && credenciales.correo === correoInput) {
      return true;
    }

    return false;
  }

  public generarContrasenaTemporal(): string {
    const random = Math.random().toString(36).slice(-8);
    return `T${random}!A`;
  }
}
