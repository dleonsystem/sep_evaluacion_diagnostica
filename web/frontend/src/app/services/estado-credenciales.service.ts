import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface EstadoCredenciales {
  correo: string;
  contrasena: string;
}

@Injectable({ providedIn: 'root' })
export class EstadoCredencialesService {
  private readonly storageKey = 'estado-credenciales-preescolar';

  constructor(private readonly authService: AuthService) {}

  obtener(): EstadoCredenciales | null {
    const persistido = this.cargarPersistido();
    if (persistido) {
      return persistido;
    }

    const credenciales = this.authService.obtenerCredenciales();
    if (credenciales) {
      const estadoDesdeAuth = {
        correo: credenciales.correo,
        contrasena: credenciales.contrasena
      };
      this.persistir(estadoDesdeAuth);
      return estadoDesdeAuth;
    }

    return null;
  }

  actualizar(correo: string, contrasena: string): void {
    this.persistir({ correo: this.normalizarCorreo(correo), contrasena });
  }

  limpiar(): void {
    localStorage.removeItem(this.storageKey);
  }

  coincideCorreo(correo: string): boolean {
    const estado = this.obtener();
    return !!estado && estado.correo === this.normalizarCorreo(correo);
  }

  private persistir(estado: EstadoCredenciales): void {
    localStorage.setItem(this.storageKey, JSON.stringify(estado));
  }

  private cargarPersistido(): EstadoCredenciales | null {
    const guardado = localStorage.getItem(this.storageKey);
    if (!guardado) {
      return null;
    }

    try {
      const parsed = JSON.parse(guardado) as Partial<EstadoCredenciales>;
      if (parsed?.correo && parsed?.contrasena) {
        return { correo: this.normalizarCorreo(parsed.correo), contrasena: parsed.contrasena };
      }
      return null;
    } catch {
      return null;
    }
  }

  private normalizarCorreo(correo: string): string {
    return (correo ?? '').trim().toLowerCase();
  }
}
