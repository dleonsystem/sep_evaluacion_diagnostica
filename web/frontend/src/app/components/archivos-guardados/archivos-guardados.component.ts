import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  ArchivoStorageService,
  RegistroArchivo
} from '../../services/archivo-storage.service';

@Component({
  selector: 'app-archivos-guardados',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './archivos-guardados.component.html',
  styleUrl: './archivos-guardados.component.scss'
})
export class ArchivosGuardadosComponent implements OnInit {
  registros: RegistroArchivo[] = [];
  mensajeInfo: string | null = null;
  mensajeError: string | null = null;

  constructor(private readonly archivoStorageService: ArchivoStorageService) {}

  ngOnInit(): void {
    this.cargarRegistros();
  }

  cargarRegistros(): void {
    this.mensajeError = null;
    this.registros = this.archivoStorageService.obtenerRegistros();

    if (this.registros.length === 0) {
      this.mensajeInfo = 'Aún no has cargado archivos de Preescolar en este navegador.';
      return;
    }

    this.mensajeInfo =
      'Los archivos permanecen en el almacenamiento local del navegador. Copia el archivo a assets/archivos/preescolar/ dentro de tu proyecto si necesitas usarlo en otra sesión.';
  }

  descargar(registro: RegistroArchivo): void {
    try {
      this.archivoStorageService.descargarRegistro(registro);
      this.mensajeError = null;
    } catch (error) {
      this.mensajeError =
        error instanceof Error ? error.message : 'No se pudo descargar el archivo seleccionado.';
    }
  }

  eliminar(registro: RegistroArchivo): void {
    try {
      this.archivoStorageService.eliminarRegistro(registro);
      this.cargarRegistros();
    } catch (error) {
      this.mensajeError = error instanceof Error ? error.message : 'No se pudo eliminar el archivo seleccionado.';
    }
  }
}
