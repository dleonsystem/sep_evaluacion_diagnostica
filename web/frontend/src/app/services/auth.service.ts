import { Injectable } from '@angular/core';

export interface CredencialesGuardadas {
  cct: string;
  correo: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly credencialesKey = 'credenciales-preescolar';
  private readonly sesionKey = 'sesion-preescolar-activa';

  obtenerCredenciales(): CredencialesGuardadas | null {
    const guardadas = localStorage.getItem(this.credencialesKey);
    if (!guardadas) {
      return null;
    }

    try {
      const parsed = JSON.parse(guardadas) as CredencialesGuardadas;
      if (parsed?.cct && parsed?.correo) {
        return {
          cct: this.normalizarCct(parsed.cct),
          correo: this.normalizarCorreo(parsed.correo)
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  registrarCredenciales(cct: string, correo: string): void {
    const credencialesActuales = this.obtenerCredenciales();
    const cctNormalizado = this.normalizarCct(cct);
    const correoNormalizado = this.normalizarCorreo(correo);

    if (
      credencialesActuales &&
      (credencialesActuales.cct !== cctNormalizado || credencialesActuales.correo !== correoNormalizado)
    ) {
      throw new Error('Ya existe un acceso asociado a otro CCT o correo. Usa las credenciales originales.');
    }

    localStorage.setItem(
      this.credencialesKey,
      JSON.stringify({ cct: cctNormalizado, correo: correoNormalizado })
    );
    this.marcarSesionActiva();
  }

  coincidenCredenciales(cct: string, correo: string): boolean {
    const guardadas = this.obtenerCredenciales();
    if (!guardadas) {
      return true;
    }

    return (
      guardadas.cct === this.normalizarCct(cct) && guardadas.correo === this.normalizarCorreo(correo)
    );
  }

  iniciarSesion(cct: string, correo: string): void {
    const guardadas = this.obtenerCredenciales();
    if (!guardadas) {
      throw new Error('Aún no hay credenciales registradas. Realiza tu primera carga para generarlas.');
    }

    if (!this.coincidenCredenciales(cct, correo)) {
      throw new Error('El CCT o el correo no coinciden con tu primer envío.');
    }

    this.marcarSesionActiva();
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.sesionKey);
  }

  estaAutenticado(): boolean {
    return localStorage.getItem(this.sesionKey) === 'true';
  }

  requiereLoginParaNuevaCarga(): boolean {
    return !!this.obtenerCredenciales() && !this.estaAutenticado();
  }

  private marcarSesionActiva(): void {
    localStorage.setItem(this.sesionKey, 'true');
  }

  private normalizarCct(cct: string): string {
    return (cct ?? '').trim().toUpperCase();
  }

  private normalizarCorreo(correo: string): string {
    return (correo ?? '').trim().toLowerCase();
  }
}
