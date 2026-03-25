import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialesService, MaterialEvaluacion } from '../../services/materiales.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-materiales-publicos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './materiales-publicos.component.html',
  styleUrl: './materiales-publicos.component.scss'
})
export class MaterialesPublicosComponent implements OnInit {
  materiales: MaterialEvaluacion[] = [];
  loading = false;
  
  // Filtros
  filtroNivel = '';
  filtroCiclo = '2024-2025';

  constructor(private materialesService: MaterialesService) {}

  ngOnInit() {
    this.cargarMateriales();
  }

  cargarMateriales() {
    this.loading = true;
    const nivel = this.filtroNivel || undefined;
    const ciclo = this.filtroCiclo || undefined;
    
    this.materialesService.getMateriales(nivel, ciclo)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => this.materiales = data,
        error: (err) => console.error('Error cargando materiales', err)
      });
  }

  getIconForTipo(tipo: string): string {
    switch(tipo) {
      case 'FRV': return 'bi-file-earmark-excel-fill';
      case 'EIA': return 'bi-file-earmark-pdf-fill';
      case 'RUBRICA': return 'bi-file-earmark-richtext-fill';
      default: return 'bi-file-earmark-text-fill';
    }
  }

  getColorForTipo(tipo: string): string {
    switch(tipo) {
      case 'FRV': return '#217346'; // Green Excel
      case 'EIA': return '#e40e0e'; // Red PDF
      case 'RUBRICA': return '#0078d4'; // Blue
      default: return '#6c757d';
    }
  }

  descargar(id: string) {
    this.materialesService.descargarMaterial(id).subscribe({
      next: (res) => {
        if (res && res.success) {
          const byteCharacters = atob(res.contentBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/octet-stream' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = res.fileName;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      }
    });
  }
}
