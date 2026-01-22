import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AdminAuthService } from '../../services/admin-auth.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent implements OnInit, OnDestroy {
  menuAbierto = false;
  userMenuOpen = false;
  isUsuarioAutenticado = false;
  isAdminAutenticado = false;
  correoUsuario: string | null = null;

  private routerSubscription: Subscription | null = null;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly adminAuthService: AdminAuthService
  ) {}

  ngOnInit(): void {
    this.sincronizarEstado();
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.sincronizarEstado());
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  iniciarSesion(): void {
    void this.router.navigate(['/login'], { queryParams: { redirect: '/carga-masiva' } });
    this.cerrarMenus();
  }

  iniciarSesionAdmin(): void {
    void this.router.navigate(['/admin/login'], { queryParams: { redirect: '/admin/panel' } });
    this.cerrarMenus();
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.sincronizarEstado();
    void this.router.navigate(['/inicio']);
    this.cerrarMenus();
  }

  cerrarSesionAdmin(): void {
    this.adminAuthService.cerrarSesion();
    this.sincronizarEstado();
    void this.router.navigate(['/inicio']);
    this.cerrarMenus();
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  getNombreUsuario(): string {
    if (!this.isUsuarioAutenticado) {
      return 'Usuario';
    }

    if (this.correoUsuario) {
      return this.correoUsuario;
    }

    return 'Sesión activa';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;

    const userMenuClick =
      targetElement.closest('#userDropdown') || targetElement.closest('.dropdown-menu');

    const mainMenuClick =
      targetElement.closest('.navbar-nav') || targetElement.closest('.navbar-toggler');

    if (!userMenuClick && this.userMenuOpen) {
      this.userMenuOpen = false;
    }

    if (!mainMenuClick && this.menuAbierto) {
      this.menuAbierto = false;
    }
  }

  private sincronizarEstado(): void {
    this.isUsuarioAutenticado = this.authService.estaAutenticado();
    this.isAdminAutenticado = this.adminAuthService.estaAutenticado();
    this.correoUsuario = this.authService.obtenerCorreoSesion();
  }

  private cerrarMenus(): void {
    this.menuAbierto = false;
    this.userMenuOpen = false;
  }
}
