import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class PasswordChangeGuard implements CanActivate {
  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const debeCambiar = this.authService.debeCambiarPassword();
    const esRutaCambio = state.url.includes('/cambiar-password');

    // Si debe cambiar y no está en la ruta de cambio, redirigir
    if (debeCambiar && !esRutaCambio) {
      void this.router.navigate(['/cambiar-password']);
      return false;
    }

    // Si ya cambió pero intenta entrar a la ruta de cambio, redirigir a inicio
    if (!debeCambiar && esRutaCambio) {
      void this.router.navigate(['/archivos-evaluacion']);
      return false;
    }

    return true;
  }
}
