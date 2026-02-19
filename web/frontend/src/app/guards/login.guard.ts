import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AdminAuthService } from '../services/admin-auth.service';

@Injectable({ providedIn: 'root' })
export class LoginGuard {
  constructor(
    private readonly authService: AuthService,
    private readonly adminAuthService: AdminAuthService,
    private readonly router: Router,
  ) { }

  canActivate(): boolean {
    if (this.authService.estaAutenticado()) {
      void this.router.navigate(['/carga-masiva']);
      return false;
    }

    if (this.adminAuthService.estaAutenticado()) {
      void this.router.navigate(['/admin/dashboard']);
      return false;
    }

    return true;
  }
}
