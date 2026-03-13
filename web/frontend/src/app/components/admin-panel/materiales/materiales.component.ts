import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialesService, MaterialEvaluacion } from '../../../services/materiales.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-materiales-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './materiales.component.html',
  styleUrl: './materiales.component.scss'
})
export class MaterialesAdminComponent implements OnInit {
  materiales: MaterialEvaluacion[] = [];
  loading = false;
  uploading = false;
  
  // Form fields
  nombre = '';
  tipo = 'EIA';
  nivelEducativo = 'PRIMARIA';
  cicloEscolar = '2024-2025';
  periodoId = 'a34cf2e4-7b42-4e66-9d35-175a7516c51f'; // Periodo 1 (2024-2025)
  selectedFile: File | null = null;
  base64File = '';
  
  feedbackMessage = '';
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error' | 'warning' = 'idle';
  showConfirmOverwrite = false;

  constructor(private materialesService: MaterialesService) {}

  ngOnInit() {
    this.cargarMateriales();
  }

  cargarMateriales() {
    this.loading = true;
    this.materialesService.getMateriales()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => this.materiales = data,
        error: (err) => console.error('Error cargando materiales', err)
      });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      const extension = fileName.split('.').pop();
      
      // Validación estricta
      if (this.tipo === 'FRV') {
        if (extension !== 'xlsx' && extension !== 'xls') {
          this.uploadStatus = 'error';
          this.feedbackMessage = 'El tipo FRV solo admite archivos Excel (.xlsx, .xls)';
          this.limpiarArchivo();
          return;
        }
      } else {
        if (extension !== 'pdf') {
          this.uploadStatus = 'error';
          this.feedbackMessage = `El tipo ${this.tipo} solo admite archivos PDF (.pdf)`;
          this.limpiarArchivo();
          return;
        }
      }

      this.selectedFile = file;
      this.uploadStatus = 'idle';
      this.feedbackMessage = '';
      
      const reader = new FileReader();
      reader.onload = () => {
        this.base64File = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  limpiarArchivo() {
    this.selectedFile = null;
    this.base64File = '';
    const fileInput = document.getElementById('archivo-material') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  getIconForTipo(tipo: string): string {
    switch(tipo) {
      case 'FRV': return 'bi-file-earmark-excel-fill';
      case 'EIA': return 'bi-file-earmark-pdf-fill';
      case 'RUBRICA': return 'bi-file-earmark-richtext-fill';
      default: return 'bi-file-earmark-text-fill';
    }
  }

  publicar(overwrite: boolean = false) {
    if (!this.nombre || !this.base64File) {
      this.uploadStatus = 'error';
      this.feedbackMessage = 'Por favor completa todos los campos y selecciona un archivo.';
      return;
    }

    this.uploading = true;
    this.uploadStatus = 'uploading';
    this.feedbackMessage = overwrite ? 'Actualizando material...' : 'Subiendo material al servidor...';
    this.showConfirmOverwrite = false;

    const input = {
      nombre: this.nombre,
      tipo: this.tipo,
      nivelEducativo: this.nivelEducativo,
      cicloEscolar: this.cicloEscolar,
      periodoId: this.periodoId,
      archivoBase64: this.base64File,
      nombreArchivo: this.selectedFile?.name,
      overwrite: overwrite
    };

    this.materialesService.publicarMaterial(input)
      .pipe(finalize(() => this.uploading = false))
      .subscribe({
        next: (res) => {
          if (res.publicarMaterial.success) {
            this.uploadStatus = 'success';
            this.feedbackMessage = res.publicarMaterial.message;
            this.limpiarFormulario();
            this.cargarMateriales();
          } else if (res.publicarMaterial.requiresConfirmation) {
            this.uploadStatus = 'warning';
            this.feedbackMessage = res.publicarMaterial.message;
            this.showConfirmOverwrite = true;
          } else {
            this.uploadStatus = 'error';
            this.feedbackMessage = res.publicarMaterial.message;
          }
        },
        error: (err) => {
          this.uploadStatus = 'error';
          this.feedbackMessage = 'Error de conexión con el servidor.';
        }
      });
  }

  cancelarSobreescritura() {
    this.showConfirmOverwrite = false;
    this.uploadStatus = 'idle';
    this.feedbackMessage = '';
  }

  limpiarFormulario() {
    this.nombre = '';
    this.selectedFile = null;
    this.base64File = '';
    // Reset file input
    const fileInput = document.getElementById('archivo-material') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  descargar(id: string) {
    this.materialesService.descargarMaterial(id).subscribe({
      next: (res) => {
        if (res.success) {
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
