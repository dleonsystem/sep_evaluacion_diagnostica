import { Injectable } from '@angular/core';

export interface CuentaGuardada {
  email: string;
  password: string;
  ccts: string[];
}

interface SesionActiva {
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly cuentasKey = 'cuentas-preescolar';
  private readonly sesionKey = 'sesion-preescolar-activa';

  registrarCarga(email: string, cct: string): { password: string; esNuevo: boolean } {
    const correoNormalizado = this.normalizarCorreo(email);
    const cctNormalizado = this.normalizarCct(cct);
    const cuentas = this.obtenerCuentas();
    const existente = cuentas.find((cuenta) => cuenta.email === correoNormalizado);

    if (!existente) {
      const password = this.generarContrasena();
      cuentas.push({ email: correoNormalizado, password, ccts: [cctNormalizado] });
      this.persistirCuentas(cuentas);
      this.marcarSesionActiva(correoNormalizado);
      return { password, esNuevo: true };
    }

    if (!this.estaAutenticado(correoNormalizado)) {
      throw new Error('Ya existe una cuenta con este correo. Inicia sesión para continuar con nuevas cargas.');
    }

    if (!existente.ccts.includes(cctNormalizado)) {
      existente.ccts.push(cctNormalizado);
      this.persistirCuentas(cuentas);
    }

    return { password: existente.password, esNuevo: false };
  }

  iniciarSesion(email: string, password: string): void {
    const correoNormalizado = this.normalizarCorreo(email);
    const cuentas = this.obtenerCuentas();
    const cuenta = cuentas.find((c) => c.email === correoNormalizado);

    if (!cuenta) {
      throw new Error('Aún no hay una cuenta asociada a este correo. Realiza tu primera carga.');
    }

    if (cuenta.password !== password) {
      throw new Error('La contraseña es incorrecta para este correo.');
    }

    this.marcarSesionActiva(correoNormalizado);
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.sesionKey);
  }

  requiereLoginParaCorreo(email: string): boolean {
    const correoNormalizado = this.normalizarCorreo(email);
    return !!this.obtenerCuenta(correoNormalizado) && !this.estaAutenticado(correoNormalizado);
  }

  estaAutenticado(email?: string): boolean {
    const sesion = this.obtenerSesionActiva();
    if (!sesion) {
      return false;
    }

    if (!email) {
      return true;
    }

    return sesion.email === this.normalizarCorreo(email);
  }

  obtenerSesionActiva(): SesionActiva | null {
    const guardada = localStorage.getItem(this.sesionKey);
    if (!guardada) {
      return null;
    }

    try {
      const sesion = JSON.parse(guardada) as SesionActiva;
      return sesion?.email ? { email: sesion.email } : null;
    } catch {
      return null;
    }
  }

  obtenerCuenta(email: string): CuentaGuardada | null {
    const correoNormalizado = this.normalizarCorreo(email);
    return this.obtenerCuentas().find((cuenta) => cuenta.email === correoNormalizado) ?? null;
  }

  obtenerCuentasRegistradas(): string[] {
    return this.obtenerCuentas().map((cuenta) => cuenta.email);
  }

  private obtenerCuentas(): CuentaGuardada[] {
    const guardadas = localStorage.getItem(this.cuentasKey);
    if (!guardadas) {
      return [];
    }

    try {
      const cuentas = JSON.parse(guardadas) as CuentaGuardada[];
      return Array.isArray(cuentas)
        ? cuentas.map((cuenta) => ({
            email: this.normalizarCorreo(cuenta.email),
            password: cuenta.password,
            ccts: (cuenta.ccts ?? []).map((cct) => this.normalizarCct(cct))
          }))
        : [];
    } catch {
      return [];
    }
  }

  private persistirCuentas(cuentas: CuentaGuardada[]): void {
    localStorage.setItem(this.cuentasKey, JSON.stringify(cuentas));
  }

  private marcarSesionActiva(email: string): void {
    const sesion: SesionActiva = { email: this.normalizarCorreo(email) };
    localStorage.setItem(this.sesionKey, JSON.stringify(sesion));
  }

  private normalizarCct(cct: string): string {
    return (cct ?? '').trim().toUpperCase();
  }

  normalizarCorreo(correo: string): string {
    return (correo ?? '').trim().toLowerCase();
  }

  private generarContrasena(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(9));
    const randomString = Array.from(randomBytes)
      .map((byte) => String.fromCharCode(byte))
      .join('');
    return btoa(randomString).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  }
}
