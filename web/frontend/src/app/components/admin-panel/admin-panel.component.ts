import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss',
})
export class AdminPanelComponent {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  obtenerToken(): string | null {
    return this.adminAuthService.obtenerToken();
  }

  cerrarSesion(): void {
    this.adminAuthService.cerrarSesion();
  }
}
