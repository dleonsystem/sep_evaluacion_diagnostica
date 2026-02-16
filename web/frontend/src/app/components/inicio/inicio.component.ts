import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-inicio',
  imports: [CommonModule, RouterModule],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss'
})
export class InicioComponent implements OnInit {
  readonly resumenCarga = this.crearResumenVacio('Estado del servidor');
  readonly resumenDescarga = this.crearResumenVacio('Última actividad');

  usuarioAutenticado = false;

  constructor(private readonly router: Router) { }

  ngOnInit(): void {
    const ultimaDescarga = this.obtenerUltimaDescarga();

    this.resumenCarga.detalle = 'Sistema sincronizado y listo.';
    this.resumenDescarga.detalle = ultimaDescarga;
  }

  iniciarSesion(): void {
    void this.router.navigate(['/login'], { queryParams: { redirect: '/carga-masiva' } });
  }

  private obtenerUltimaDescarga(): string {
    const data = localStorage.getItem('ultima-descarga');
    if (!data) {
      return 'Sin actividad reciente en este navegador.';
    }

    try {
      const parsed = JSON.parse(data) as { nombre?: string; fecha?: string };
      const nombre = parsed?.nombre?.trim();
      const fecha = parsed?.fecha;
      if (!fecha) {
        return 'Sin actividad reciente.';
      }
      const detalleFecha = this.formatearFecha(fecha);
      return nombre ? `${nombre} • ${detalleFecha}` : detalleFecha;
    } catch (error) {
      console.error('No se pudo leer el historial de actividad', error);
      return 'No disponible.';
    }
  }

  private formatearFecha(fechaIso: string): string {
    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) {
      return 'Fecha no válida';
    }

    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(fecha);
  }

  private crearResumenVacio(etiqueta: string): { etiqueta: string; detalle: string } {
    return { etiqueta, detalle: 'Cargando status...' };
  }
}
