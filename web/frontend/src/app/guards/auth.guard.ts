import { Injectable } from '@angular/core';

import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    // Usamos el observable isAuthenticated$ del AuthService
    return this.authService.isAuthenticated$.pipe(
      take(1), // Tomamos solo el primer valor emitido
      map(isAuthenticated => {
        if (isAuthenticated) {
          return true; // Usuario autenticado, permite el acceso
        }

        // Si en la URL hay un token (`code`), permite el acceso para que HomeComponent lo guarde
        if (route.queryParams['code']) {
          return true;
        }

        // Si no está autenticado ni hay token en la URL, redirige a /inicio
        this.router.navigate(['/inicio']);
        return false;
      })
    );
  }
}
