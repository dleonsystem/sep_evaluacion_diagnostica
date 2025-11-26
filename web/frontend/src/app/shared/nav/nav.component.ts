import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  Renderer2,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

/* import { EventosService } from '../../services/eventos.service'; */
import { Usuario } from '../../interfaces/models';


import { AuthService } from '../../services/auth.service';
import { LoggingService } from '../../services/loggin.service';


@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent implements OnInit, AfterViewInit, OnDestroy {
  usuario: Usuario | null = null;
  menuAbierto = false;
  userMenuOpen = false;
  private userSubscription: Subscription | null = null;
  private readonly isBrowser: boolean;
  private headerUpdateTimeoutId: number | null = null;
  private removeLoadListener: (() => void) | null = null;
  private lastHeaderOffset = -1;

  isLoggedIn = false; // ✅ Estado global de autenticación
  isMenuCollapsed = true;
  isDropdownOpen = false;


  constructor(
    private router: Router,
    /* private eventosService: EventosService, */
    private authService: AuthService,
    private cdr: ChangeDetectorRef, // ✅ Para refrescar el template
    private logger: LoggingService,
    private renderer: Renderer2,
    private elementRef: ElementRef<HTMLElement>,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // ✅ Estado inicial
    this.isLoggedIn = this.authService.isAuthenticated();

    // ✅ Si ya estaba autenticado, cargar datos del usuario
    if (this.isLoggedIn) {
      this.loadUserData();
    }

    // ✅ Suscribirse a cambios de autenticación
    this.userSubscription = this.authService.isAuthenticated$.subscribe((status) => {
      this.isLoggedIn = status;
      this.logger.debug('[Nav] Estado autenticación actualizado:', status);

      if (this.isLoggedIn) {
        this.loadUserData();
      } else {
        this.clearUserData();
      }
      this.cdr.detectChanges();
    });
  }

  iniciarSesion(): void {
    this.router.navigate(['/login']);
  }

  registrarse(): void {
    this.router.navigate(['/registro']);
  }

  /** ✅ Cargar datos del usuario autenticado */
  loadUserData(): void {
    const currentUser = this.authService.getUsuarioActual();

    if (currentUser) {
      this.logger.debug('[Nav] Usuario autenticado detectado:', currentUser);
      this.usuario = currentUser;
    } else {
      this.usuario = null;
    }

    this.cdr.detectChanges();
  }

  /** ✅ Limpiar datos del usuario cuando se cierre sesión */
  private clearUserData(): void {
    this.usuario = null;
  }

  ngOnDestroy(): void {
    if (this.userSubscription) this.userSubscription.unsubscribe();
    if (this.removeLoadListener) {
      this.removeLoadListener();
      this.removeLoadListener = null;
    }
    if (this.headerUpdateTimeoutId !== null) {
      clearTimeout(this.headerUpdateTimeoutId);
      this.headerUpdateTimeoutId = null;
    }
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    // NUEVO: Esperar a que los scripts del gobierno se carguen
    this.waitForGovernmentFramework();

    this.updateHeaderOffset();

    this.headerUpdateTimeoutId = window.setTimeout(() => {
      this.updateHeaderOffset();
      this.headerUpdateTimeoutId = null;
    }, 300);

    this.removeLoadListener = this.renderer.listen('window', 'load', () =>
      this.updateHeaderOffset()
    );

    setTimeout(() => {
      this.document.querySelectorAll('.nav-link').forEach((link) => {
        // Podrías agregar lógica extra si quieres
      });
    }, 100);
  }

  // NUEVO: Método para esperar el framework del gobierno
  private waitForGovernmentFramework(): void {
    const checkFramework = () => {
      // Verificar si los scripts del gobierno ya se cargaron
      const govHeader = this.document.querySelector('.navbar-gobmx, .gov-header, .gob-header');

      if (govHeader || (window as any).GobMX) {
        // Framework cargado, actualizar posición
        setTimeout(() => {
          this.updateHeaderOffset();
        }, 100);
      } else {
        // Framework no cargado, esperar un poco más
        setTimeout(checkFramework, 100);
      }
    };

    checkFramework();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateHeaderOffset();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateHeaderOffset();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;

    const userMenuClick =
      targetElement.closest('#userDropdown') ||
      targetElement.closest('.dropdown-menu');

    const mainMenuClick =
      targetElement.closest('.navbar-nav') ||
      targetElement.closest('.navbar-toggler');

    if (!userMenuClick && this.userMenuOpen) {
      this.userMenuOpen = false;
    }

    if (!mainMenuClick && this.menuAbierto) {
      this.menuAbierto = false;
    }
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
    this.logger.debug('Menu abierto:', this.menuAbierto);
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
    this.logger.debug('Menu usuario abierto:', this.userMenuOpen);
  }

  cerrarSesion(): void {
    /* this.eventosService.logout();  */
    this.authService.logout();
    this.clearUserData();
    this.router.navigate(['/inicio']);
    this.menuAbierto = false;
    this.userMenuOpen = false;
  }

  /** ✅ Estado de autenticación para el template */
  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }

  /** ✅ Obtener nombre del usuario logueado */
  getNombreUsuario(): string {
    if (!this.isLoggedIn || !this.usuario) {
      return 'Usuario';
    }

    const nombres = [
      this.usuario.nombre || '',
      this.usuario.apellidoPaterno || (this.usuario as any).paterno || '',
      this.usuario.apellidoMaterno || (this.usuario as any).materno || ''
    ].filter(Boolean);

    return nombres.length > 0 ? nombres.join(' ').trim() : 'Usuario';
  }

  private updateHeaderOffset(): void {
    if (!this.isBrowser) {
      return;
    }

    const headerOffset = this.getHeaderHeight();

    if (headerOffset !== this.lastHeaderOffset) {
      this.lastHeaderOffset = headerOffset;
      this.renderer.setStyle(
        this.document.documentElement,
        '--gov-header-height',
        `${headerOffset}px`
      );
    }
  }

  private getHeaderHeight(): number {
    if (!this.isBrowser) {
      return 0;
    }

    const hostElement = this.elementRef.nativeElement;
    const candidates: HTMLElement[] = [];

    const containerSelectors = ['.gov-header', '.gob-header'];
    const navbarSelectors = [
      '.navbar-gobmx',
      '#navbar-top',
      '.gobmx-navbar',
      '#gobmx-navbar',
      '#gobmxNavbar',
      'nav.navbar',
      'nav[role="navigation"]'
    ];

    const previousSibling = hostElement.previousElementSibling;
    if (previousSibling instanceof HTMLElement) {
      candidates.push(previousSibling);
    }

    [...navbarSelectors, ...containerSelectors].forEach((selector) => {
      this.document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        if (element !== hostElement && !candidates.includes(element)) {
          candidates.push(element);
        }
      });
    });

    const resolvedHeights: number[] = [];
    const matchedHeights: number[] = [];

    const resolveHeight = (
      element: HTMLElement,
      visited: Set<HTMLElement>
    ): { height: number; matched: boolean } | null => {
      if (visited.has(element) || element === hostElement) {
        return null;
      }

      visited.add(element);

      const isContainer = containerSelectors.some((selector) => element.matches(selector));
      const matchedElements = new Set<HTMLElement>();

      navbarSelectors.forEach((selector) => {
        if (element.matches(selector)) {
          matchedElements.add(element);
        }

        element.querySelectorAll<HTMLElement>(selector).forEach((child) => {
          if (child !== hostElement) {
            matchedElements.add(child);
          }
        });
      });

      const matchedList = Array.from(matchedElements);
      const innermostMatches = matchedList.filter(
        (candidate) =>
          !matchedList.some(
            (other) => other !== candidate && candidate.contains(other)
          )
      );

      const heights = innermostMatches
        .map((el) => this.measureElementHeight(el))
        .filter((height) => height > 0);

      if (heights.length > 0) {
        const sum = heights.reduce((total, height) => total + height, 0);
        return { height: sum, matched: true };
      }

      const childResults: { height: number; matched: boolean }[] = [];

      Array.from(element.children).forEach((child) => {
        if (child instanceof HTMLElement) {
          const childResult = resolveHeight(child, visited);
          if (childResult && childResult.height > 0) {
            childResults.push(childResult);
          }
        }
      });

      if (childResults.length > 0) {
        const matchedChild = childResults.find((result) => result.matched);
        if (matchedChild) {
          return matchedChild;
        }

        const minimalFallback = childResults.reduce(
          (min, result) => (result.height < min ? result.height : min),
          Number.POSITIVE_INFINITY
        );

        if (Number.isFinite(minimalFallback)) {
          return { height: minimalFallback, matched: false };
        }
      }

      if (!isContainer) {
        const fallbackHeight = this.measureElementHeight(element);
        if (fallbackHeight > 0) {
          return { height: fallbackHeight, matched: false };
        }
      }

      return null;
    };

    candidates.forEach((element) => {
      const result = resolveHeight(element, new Set<HTMLElement>());
      if (result && result.height > 0) {
        resolvedHeights.push(result.height);
        if (result.matched) {
          matchedHeights.push(result.height);
        }
      }
    });

    if (matchedHeights.length > 0) {
      return Math.min(...matchedHeights);
    }

    if (resolvedHeights.length > 0) {
      return Math.min(...resolvedHeights);
    }

    return 0;
  }

  private measureElementHeight(element: HTMLElement | null): number {
    if (!element || element === this.elementRef.nativeElement) {
      return 0;
    }

    const rect = element.getBoundingClientRect();
    if (!this.isElementVisible(element)) {
      return 0;
    }

    const view = this.document.defaultView;
    const viewportHeight =
      view?.innerHeight ?? this.document.documentElement.clientHeight ?? rect.bottom;
    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, viewportHeight);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);

    if (visibleHeight > 0) {
      return Math.round(visibleHeight);
    }

    if (element.firstElementChild instanceof HTMLElement) {
      const childHeight = this.measureElementHeight(element.firstElementChild);
      if (childHeight > 0) {
        return childHeight;
      }
    }

    return 0;
  }

  private isElementVisible(element: HTMLElement): boolean {
    const view = this.document.defaultView;
    if (!view) {
      return true;
    }

    const styles = view.getComputedStyle(element);
    return styles.display !== 'none' && styles.visibility !== 'hidden';
  }
}
