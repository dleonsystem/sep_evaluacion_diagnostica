import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from './auth.service';
import { AdminAuthService } from './admin-auth.service';

@Injectable({ providedIn: 'root' })
export class SessionTimerService implements OnDestroy {
  private timeoutId: any;
  private warningTimeoutId: any;
  private readonly TIMEOUT_MINUTES = 15;
  private readonly WARNING_MINUTES = 14; // Avisar 1 minuto antes
  private readonly events = [
    'mousemove',
    'resize',
    'keydown',
    'click',
    'scroll',
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly adminAuthService: AdminAuthService,
    private readonly router: Router,
    private readonly ngZone: NgZone,
  ) {}

  startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.ngZone.runOutsideAngular(() => {
      this.events.forEach((event) => {
        window.addEventListener(event, () => this.resetTimer());
      });
    });

    this.resetTimer();
  }

  stopMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.clearTimers();
    this.events.forEach((event) => {
      window.removeEventListener(event, () => this.resetTimer());
    });
  }

  private resetTimer(): void {
    if (
      !this.authService.estaAutenticado() &&
      !this.adminAuthService.estaAutenticado()
    ) {
      return;
    }

    this.clearTimers();

    this.ngZone.runOutsideAngular(() => {
      this.warningTimeoutId = setTimeout(
        () => {
          this.ngZone.run(() => this.showWarning());
        },
        this.WARNING_MINUTES * 60 * 1000,
      );

      this.timeoutId = setTimeout(
        () => {
          this.ngZone.run(() => this.logout());
        },
        this.TIMEOUT_MINUTES * 60 * 1000,
      );
    });
  }

  private clearTimers(): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningTimeoutId) clearTimeout(this.warningTimeoutId);
  }

  private showWarning(): void {
    Swal.fire({
      title: 'Tu sesión está por expirar',
      text: 'Se cerrará la sesión en 1 minuto por inactividad.',
      icon: 'warning',
      timer: 60000,
      timerProgressBar: true,
      showConfirmButton: true,
      confirmButtonText: 'Seguir conectado',
    }).then((result) => {
      if (result.isConfirmed) {
        this.resetTimer();
      }
    });
  }

  private logout(): void {
    Swal.close();
    this.authService.cerrarSesion();
    this.adminAuthService.cerrarSesion();
    void this.router.navigate(['/']);

    Swal.fire({
      title: 'Sesión expirada',
      text: 'Tu sesión se ha cerrado por inactividad.',
      icon: 'info',
    });
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }
}
