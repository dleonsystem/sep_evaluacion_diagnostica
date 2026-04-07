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

  // Memoria volátil: Solo dura mientras la pestaña está abierta.
  // Esto permite que el PDF y el componente vean la contraseña en el flujo de registro
  // sin comprometer la seguridad de persistencia en disco.
  private _contrasenaTransitoria: string | null = null;

  private estaAutenticadoInicial(): boolean {
    return localStorage.getItem(this.sesionKey) === 'true';
  }

  iniciarSesion(correo: string, token: string, user: any): void {
    // Limpiar posible sesión admin residual
    localStorage.removeItem('eia-admin-token');
    localStorage.removeItem('eia-admin-email');
    localStorage.removeItem('eia-admin-role');

    this.marcarSesionActiva();
    localStorage.setItem('eia-token', token);
    localStorage.setItem('eia-jwt', token); // Mantener sincronía con GraphqlService
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
    localStorage.removeItem('eia-jwt');
    localStorage.removeItem(this.sesionCorreoKey);
    localStorage.removeItem(this.sesionRolKey);
    localStorage.removeItem(this.sesionCctKey);

    // Seguridad: Limpieza profunda de cualquier rastro de credenciales
    localStorage.removeItem('eia-last-credentials');
    localStorage.removeItem('estado-credenciales-preescolar');
    localStorage.removeItem('estado-credenciales-primaria');
    localStorage.removeItem('estado-credenciales-secundaria');

    this._contrasenaTransitoria = null;
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
    
    // Guardar en memoria volátil para uso inmediato (PDF, UI)
    this._contrasenaTransitoria = contrasena;

    // Seguridad: Persistir metadata EXCEPTO la contraseña sensible en disco
    const { contrasena: _, ...persistible } = credenciales;
    localStorage.setItem('eia-last-credentials', JSON.stringify(persistible));
    
    return credenciales;
  }

  public obtenerCredenciales(): CredencialesGuardadas | null {
    const guardadas = localStorage.getItem('eia-last-credentials');
    if (!guardadas) {
      // Si no hay nada en disco, pero tenemos algo en memoria volátil, 
      // intentamos reconstruir lo mínimo para la UI.
      if (this._contrasenaTransitoria) {
        return {
          cct: 'N/D',
          correo: 'N/D',
          contrasena: this._contrasenaTransitoria,
          esNueva: true
        };
      }
      return null;
    }

    try {
      const parsed = JSON.parse(guardadas);
      // Prioridad absoluta a la memoria volátil sobre lo que haya en disco
      const passwordReal = (this._contrasenaTransitoria && this._contrasenaTransitoria.length > 0) 
        ? this._contrasenaTransitoria 
        : (parsed.contrasena || '********');

      return {
        ...parsed,
        contrasena: passwordReal,
        esNueva: !!parsed.esNueva || (this._contrasenaTransitoria ? true : false)
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

  /**
   * Registra localmente que un correo ha completado una carga exitosa al menos una vez.
   * Esto sirve para evitar bloqueos innecesarios si la carga falla a la mitad del proceso.
   */
  public confirmarCargaExitosa(correo: string): void {
    localStorage.setItem(`eia-exito-${this.normalizarCorreo(correo)}`, 'true');
  }

  /**
   * Verifica si este correo ya ha realizado una carga exitosa en este navegador.
   */
  public tieneCargaExitosa(correo: string): boolean {
    return localStorage.getItem(`eia-exito-${this.normalizarCorreo(correo)}`) === 'true';
  }

  public requiereLoginParaNuevaCarga(correo?: string): boolean {
    const autenticado = this.estaAutenticado();
    const correoInput = correo ? this.normalizarCorreo(correo) : null;

    if (autenticado) {
      const correoSesion = this.obtenerCorreoSesion();
      // Si está autenticado, solo bloqueamos si intenta cargar para un correo DISTINTO al de su sesión
      return !!correoInput && !!correoSesion && correoSesion !== correoInput;
    }

    // Si NO está autenticado, solo requerimos login si ya tenemos registro local 
    // de que este navegador completó una carga EXITOSA con este mismo correo.
    if (correoInput && this.tieneCargaExitosa(correoInput)) {
      return true;
    }

    return false;
  }

  public generarContrasenaTemporal(): string {
    const random = Math.random().toString(36).slice(-8);
    return `T${random}!A`;
  }
}
