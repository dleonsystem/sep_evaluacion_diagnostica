import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Estado reactivo para notificar autenticación a los componentes
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // ✅ NUEVO: BehaviorSubject para el usuario actual
  private usuarioActualSubject = new BehaviorSubject<any>(null);
  usuarioActual$ = this.usuarioActualSubject.asObservable();

  private logoutTimer?: any;
  private readonly TOKEN_TTL_MS = 12 * 60 * 1000; // 12 minutos
  private readonly SESSION_EXPIRY_KEY = 'authTokenExpiry';

  constructor(private router: Router) {
    // ✅ Al iniciar el servicio, validar si hay usuario en localStorage
    const usuarioActual = localStorage.getItem('usuarioActual');
    if (usuarioActual) {
      try {
        const usuario = JSON.parse(usuarioActual);
        const expiryString = localStorage.getItem(this.SESSION_EXPIRY_KEY);

        if (!expiryString) {
          console.warn('⚠️ [AUTH] No se encontró expiración de sesión; cerrando sesión.');
          this.logout(true);
          return;
        }

        const expirationTime = parseInt(expiryString, 10);

        if (isNaN(expirationTime)) {
          console.error('❌ [AUTH] Valor de expiración inválido en localStorage; cerrando sesión.');
          this.logout(true);
          return;
        }

        const remainingTime = expirationTime - Date.now();

        if (remainingTime <= 0) {
          console.warn('⚠️ [AUTH] Sesión expirada al inicializar el servicio.');
          this.logout(true);
          return;
        }

        this.isAuthenticatedSubject.next(true);
        this.usuarioActualSubject.next(usuario); // ✅ NUEVO: Emitir usuario
        this.startLogoutTimer(remainingTime);
      } catch (e) {
        console.error('❌ usuarioActual corrupto en localStorage, limpiando...', e);
        this.logout(true); // Si está corrupto, limpiar
      }
    }
  }

  /**
   * ✅ Método para guardar usuario y token de autenticación local
   */
  setAuthenticated(usuario: any, token?: string): void {
    console.log('🔐 [AUTH] === GUARDANDO AUTENTICACIÓN ===');
    console.log('👤 [AUTH] Usuario:', usuario);
    console.log('🔑 [AUTH] Token presente:', !!token);

    if (!usuario) {
      console.warn('⚠️ [AUTH] No se recibió usuario para autenticación');
      return;
    }

    localStorage.setItem('usuarioActual', JSON.stringify(usuario));
    console.log('✅ [AUTH] Usuario guardado en localStorage');

    if (token) {
      localStorage.setItem('authToken', token);
      console.log('✅ [AUTH] Token guardado como "authToken"');
    } else {
      console.warn('⚠️ [AUTH] No se recibió token para guardar');
    }

    this.isAuthenticatedSubject.next(true);
    this.usuarioActualSubject.next(usuario);

    const expirationTimestamp = Date.now() + this.TOKEN_TTL_MS;
    localStorage.setItem(this.SESSION_EXPIRY_KEY, expirationTimestamp.toString());

    this.startLogoutTimer(this.TOKEN_TTL_MS);

    console.log('✅ [AUTH] === AUTENTICACIÓN COMPLETADA ===');
  }

  /**
   * ✅ Obtener usuario actual desde localStorage
   */
  getUsuarioActual(): any | null {
    const usuarioJson = localStorage.getItem('usuarioActual');
    if (!usuarioJson) return null;

    try {
      return JSON.parse(usuarioJson);
    } catch (e) {
      console.error('❌ Error parseando usuarioActual, limpiando...', e);
      this.logout();
      return null;
    }
  }

  /**
   * ✅ Obtener token actual almacenado localmente
   */
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * ✅ Saber si está autenticado (BehaviorSubject + respaldo en localStorage)
   */
  isAuthenticated(): boolean {
    // Si el BehaviorSubject ya está en true
    if (this.isAuthenticatedSubject.value) return true;

    // Si hay usuario en localStorage
    const usuario = this.getUsuarioActual();
    if (usuario) {
      this.isAuthenticatedSubject.next(true);
      this.usuarioActualSubject.next(usuario); // ✅ NUEVO: También emitir usuario
      return true;
    }

    return false;
  }

  /**
   * ✅ Cerrar sesión y limpiar todo - ACTUALIZADO
   */
  logout(redirectToExpired = false): void {
    console.log('🚪 [AUTH] Cerrando sesión');
    localStorage.removeItem('usuarioActual');
    localStorage.removeItem('authToken');
    localStorage.removeItem(this.SESSION_EXPIRY_KEY);
    this.isAuthenticatedSubject.next(false);
    this.usuarioActualSubject.next(null); // ✅ NUEVO: Limpiar usuario
    this.clearLogoutTimer();
    if (redirectToExpired) {
      this.router.navigate(['/sesion-caducada']);
    } else {
      this.router.navigate(['/inicio']);
    }
  }

  startLogoutTimer(remainingTimeMs?: number): void {
    this.clearLogoutTimer();

    let timeout = this.TOKEN_TTL_MS;

    if (typeof remainingTimeMs === 'number') {
      timeout = remainingTimeMs;
    } else {
      const expirationTimestamp = Date.now() + this.TOKEN_TTL_MS;
      localStorage.setItem(this.SESSION_EXPIRY_KEY, expirationTimestamp.toString());
    }

    if (timeout <= 0) {
      this.logout(true);
      return;
    }

    this.logoutTimer = setTimeout(() => this.logout(true), timeout);
  }

  private clearLogoutTimer(): void {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = undefined;
    }
  }
}
