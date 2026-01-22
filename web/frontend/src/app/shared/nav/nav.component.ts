import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID
} from '@angular/core';
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
export class NavComponent implements OnInit, AfterViewInit, OnDestroy {
  menuAbierto = false;
  userMenuOpen = false;
  isUsuarioAutenticado = false;
  isAdminAutenticado = false;
  correoUsuario: string | null = null;

  private routerSubscription: Subscription | null = null;
  private readonly isBrowser: boolean;
  private removeLoadListener: (() => void) | null = null;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly adminAuthService: AdminAuthService,
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.sincronizarEstado();
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.sincronizarEstado());
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    this.actualizarOffsetHeader();
    this.removeLoadListener = this.addWindowListener('load', () => this.actualizarOffsetHeader());
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    if (this.removeLoadListener) {
      this.removeLoadListener();
      this.removeLoadListener = null;
    }
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

  @HostListener('window:resize')
  onWindowResize(): void {
    this.actualizarOffsetHeader();
  }

  private sincronizarEstado(): void {
    this.isUsuarioAutenticado = this.authService.estaAutenticado();
    this.isAdminAutenticado = this.adminAuthService.estaAutenticado();
    this.correoUsuario = this.authService.obtenerCorreoSesion();
  }

  private actualizarOffsetHeader(): void {
    if (!this.isBrowser) {
      return;
    }

    const header = this.document.querySelector<HTMLElement>(
      '.navbar-gobmx, .gobmx-navbar, #navbar-top, .gob-header, .gov-header'
    );
    const height = header?.getBoundingClientRect().height ?? 0;
    this.document.documentElement.style.setProperty('--gov-header-height', `${height}px`);
  }

  private cerrarMenus(): void {
    this.menuAbierto = false;
    this.userMenuOpen = false;
  }

  private addWindowListener(event: string, handler: () => void): () => void {
    window.addEventListener(event, handler, { passive: true });
    return () => window.removeEventListener(event, handler);
  }
}
