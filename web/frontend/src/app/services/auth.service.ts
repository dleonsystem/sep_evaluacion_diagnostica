import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CredencialesGuardadas {
  cct: string;
  correo: string;
  contrasena: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly credencialesKey = 'eia-user-credentials';
  private readonly sesionKey = 'eia-user-session-active';
  private readonly sesionCorreoKey = 'eia-user-session-email';

  private autenticadoSubject = new BehaviorSubject<boolean>(this.estaAutenticadoInicial());
  public autenticado$ = this.autenticadoSubject.asObservable();

  private estaAutenticadoInicial(): boolean {
    return localStorage.getItem(this.sesionKey) === 'true';
  }

  obtenerCredenciales(): CredencialesGuardadas | null {
    const guardadas = localStorage.getItem(this.credencialesKey);
    if (!guardadas) {
      return null;
    }

    try {
      const parsed = JSON.parse(guardadas) as CredencialesGuardadas;
      if (parsed?.cct && parsed?.correo && parsed?.contrasena) {
        return {
          cct: this.normalizarCct(parsed.cct),
          correo: this.normalizarCorreo(parsed.correo),
          contrasena: parsed.contrasena
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  registrarCredenciales(
    cct: string,
    correo: string,
    contrasenaPersonalizada?: string
  ): { contrasena: string; esNueva: boolean } {
    const credencialesActuales = this.obtenerCredenciales();
    const cctNormalizado = this.normalizarCct(cct);
    const correoNormalizado = this.normalizarCorreo(correo);

    const esNueva = !credencialesActuales || credencialesActuales.correo !== correoNormalizado;
    const contrasena =
      (credencialesActuales?.correo === correoNormalizado ? credencialesActuales?.contrasena : null) ??
      contrasenaPersonalizada ??
      this.generarContrasena();

    localStorage.setItem(
      this.credencialesKey,
      JSON.stringify({ cct: cctNormalizado, correo: correoNormalizado, contrasena })
    );

    return { contrasena, esNueva };
  }

  generarContrasenaTemporal(): string {
    return this.generarContrasena();
  }

  coincidenCredenciales(cct: string, correo: string): boolean {
    const guardadas = this.obtenerCredenciales();
    if (!guardadas) {
      return true;
    }

    // Solo verificamos el correo. El usuario puede subir cualquier CCT.
    return guardadas.correo === this.normalizarCorreo(correo);
  }

  iniciarSesion(correo: string, contrasena: string): void {
    const guardadas = this.obtenerCredenciales();
    if (!guardadas) {
      throw new Error('Aún no hay credenciales registradas. Realiza tu primera carga para generarlas.');
    }

    if (guardadas.correo !== this.normalizarCorreo(correo) || guardadas.contrasena !== contrasena) {
      throw new Error('El correo o la contraseña no coinciden con tu primer envío.');
    }

    this.marcarSesionActiva();
    localStorage.setItem(this.sesionCorreoKey, this.normalizarCorreo(correo));
  }

  iniciarSesionTrasCarga(correo: string): void {
    this.marcarSesionActiva();
    localStorage.setItem(this.sesionCorreoKey, this.normalizarCorreo(correo));
  }

  iniciarSesionSinCredenciales(correo: string): void {
    this.marcarSesionActiva();
    localStorage.setItem(this.sesionCorreoKey, this.normalizarCorreo(correo));
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.sesionKey);
    localStorage.removeItem(this.sesionCorreoKey);
    localStorage.removeItem(this.credencialesKey);
    this.autenticadoSubject.next(false);
  }

  estaAutenticado(): boolean {
    return localStorage.getItem(this.sesionKey) === 'true';
  }

  requiereLoginParaNuevaCarga(correo?: string): boolean {
    const credenciales = this.obtenerCredenciales();
    if (!credenciales || this.estaAutenticado()) {
      return false;
    }
    // Solo requerir login si el correo que se intenta usar es el mismo que ya tiene credenciales guardadas
    if (correo && credenciales.correo !== this.normalizarCorreo(correo)) {
      return false;
    }
    return true;
  }

  obtenerCorreoSesion(): string | null {
    const correo = localStorage.getItem(this.sesionCorreoKey);
    return correo ? this.normalizarCorreo(correo) : null;
  }

  private marcarSesionActiva(): void {
    localStorage.setItem(this.sesionKey, 'true');
    this.autenticadoSubject.next(true);
  }

  private normalizarCct(cct: string): string {
    return (cct ?? '').trim().toUpperCase();
  }

  public normalizarCorreo(correo: string): string {
    return (correo ?? '').trim().toLowerCase();
  }

  private generarContrasena(): string {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let contrasena = '';

    for (let i = 0; i < 12; i++) {
      contrasena += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }

    return contrasena;
  }
}
