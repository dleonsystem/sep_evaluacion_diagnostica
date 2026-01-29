import { Injectable } from '@angular/core';

export interface CredencialesGuardadas {
  cct: string;
  correo: string;
  contrasena: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly credencialesKey = 'credenciales-preescolar';
  private readonly sesionKey = 'sesion-preescolar-activa';
  private readonly sesionCorreoKey = 'sesion-preescolar-correo';

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

    if (
      credencialesActuales &&
      (credencialesActuales.cct !== cctNormalizado || credencialesActuales.correo !== correoNormalizado)
    ) {
      throw new Error('Ya existe un acceso asociado a otro CCT o correo. Usa las credenciales originales.');
    }

    const esNueva = !credencialesActuales;
    const contrasena =
      credencialesActuales?.contrasena ?? contrasenaPersonalizada ?? this.generarContrasena();

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

    return (
      guardadas.cct === this.normalizarCct(cct) && guardadas.correo === this.normalizarCorreo(correo)
    );
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

  iniciarSesionSinCredenciales(correo: string): void {
    this.marcarSesionActiva();
    localStorage.setItem(this.sesionCorreoKey, this.normalizarCorreo(correo));
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.sesionKey);
    localStorage.removeItem(this.sesionCorreoKey);
  }

  estaAutenticado(): boolean {
    return localStorage.getItem(this.sesionKey) === 'true';
  }

  requiereLoginParaNuevaCarga(): boolean {
    return !!this.obtenerCredenciales() && !this.estaAutenticado();
  }

  obtenerCorreoSesion(): string | null {
    const correo = localStorage.getItem(this.sesionCorreoKey);
    return correo ? this.normalizarCorreo(correo) : null;
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

  private generarContrasena(): string {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let contrasena = '';

    for (let i = 0; i < 12; i++) {
      contrasena += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }

    return contrasena;
  }
}
