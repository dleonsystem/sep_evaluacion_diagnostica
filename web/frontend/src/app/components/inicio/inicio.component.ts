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
  readonly resumenCarga = this.crearResumenVacio('Última carga');
  readonly resumenDescarga = this.crearResumenVacio('Última descarga');

  usuarioAutenticado = false;
  readonly llaveMxImage =
    'data:image/png;base64,' +
    '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';

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    const ultimaCarga = this.obtenerUltimaCarga();
    const ultimaDescarga = this.obtenerUltimaDescarga();

    this.resumenCarga.detalle = ultimaCarga;
    this.resumenDescarga.detalle = ultimaDescarga;
  }

  llaveMx(): void {
    // TODO: Integrar redirección a LlaveMX cuando esté disponible
    console.log('Redirigir a registro de LlaveMX');
  }

  iniciarSesion(): void {
    void this.router.navigate(['/login'], { queryParams: { redirect: '/carga-masiva' } });
  }

  private obtenerUltimaCarga(): string {
    const data = localStorage.getItem('archivos-preescolar');
    if (!data) {
      return 'Sin cargas registradas.';
    }

    try {
      const registrosPorCorreo = JSON.parse(data) as Record<
        string,
        Array<{ nombre: string; fechaGuardado: string }>
      >;
      const registros = Object.values(registrosPorCorreo).flat();
      if (!registros.length) {
        return 'Sin cargas registradas.';
      }

      const ultimo = registros.reduce((actual, siguiente) =>
        siguiente.fechaGuardado > actual.fechaGuardado ? siguiente : actual
      );
      return `${ultimo.nombre} • ${this.formatearFecha(ultimo.fechaGuardado)}`;
    } catch (error) {
      console.error('No se pudo leer el historial de cargas', error);
      return 'No disponible.';
    }
  }

  private obtenerUltimaDescarga(): string {
    const data = localStorage.getItem('ultima-descarga');
    if (!data) {
      return 'Sin descargas registradas.';
    }

    try {
      const parsed = JSON.parse(data) as { nombre?: string; fecha?: string };
      const nombre = parsed?.nombre?.trim();
      const fecha = parsed?.fecha;
      if (!fecha) {
        return 'Sin descargas registradas.';
      }
      const detalleFecha = this.formatearFecha(fecha);
      return nombre ? `${nombre} • ${detalleFecha}` : detalleFecha;
    } catch (error) {
      console.error('No se pudo leer el historial de descargas', error);
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
    return { etiqueta, detalle: 'Cargando...' };
  }
}
