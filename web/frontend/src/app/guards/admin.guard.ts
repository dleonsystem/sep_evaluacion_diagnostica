import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly router: Router,
  ) { }

  canActivate(): boolean {
    if (this.adminAuthService.estaAutenticado()) {
      return true;
    }

    void this.router.navigate(['/login']);
    return false;
  }
}
