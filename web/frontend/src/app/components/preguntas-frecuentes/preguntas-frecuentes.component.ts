import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GraphqlService } from '../../services/graphql.service';

interface PreguntaFrecuente {
  id: string;
  pregunta: string;
  respuesta: string;
  activo: boolean;
  orden: number;
}

@Component({
  selector: 'app-preguntas-frecuentes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './preguntas-frecuentes.component.html',
  styleUrl: './preguntas-frecuentes.component.scss'
})
export class PreguntasFrecuentesComponent implements OnInit {
  preguntas: PreguntaFrecuente[] = [];
  cargando = true;
  error = '';
  preguntaActiva: string | null = null;
  terminoBusqueda: string = '';

  get preguntasFiltradas(): PreguntaFrecuente[] {
    if (!this.terminoBusqueda) {
      return this.preguntas;
    }
    const termino = this.terminoBusqueda.toLowerCase();
    return this.preguntas.filter(p =>
      p.pregunta.toLowerCase().includes(termino) ||
      p.respuesta.toLowerCase().includes(termino)
    );
  }

  constructor(
    private readonly graphqlService: GraphqlService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.cargarPreguntas();
  }

  cargarPreguntas(): void {
    const query = `
      query GetPreguntasFrecuentes {
        getPreguntasFrecuentes {
          id
          pregunta
          respuesta
          activo
          orden
        }
      }
    `;

    this.graphqlService.execute<{ getPreguntasFrecuentes: PreguntaFrecuente[] }>(query)
      .subscribe({
        next: (res) => {
          this.cargando = false;
          if (res.data?.getPreguntasFrecuentes) {
            this.preguntas = res.data.getPreguntasFrecuentes;
            // Expandimos la primera pregunta por defecto
            if (this.preguntas.length > 0) {
              this.preguntaActiva = this.preguntas[0].id;
            }
          } else if (res.errors) {
            this.error = 'No se pudieron cargar las preguntas frecuentes. Error del servidor.';
          }
        },
        error: (err) => {
          this.cargando = false;
          this.error = 'Ocurrió un error al conectar con el servidor.';
          console.error(err);
        }
      });
  }

  togglePregunta(id: string): void {
    if (this.preguntaActiva === id) {
      this.preguntaActiva = null;
    } else {
      this.preguntaActiva = id;
    }
  }

  volver(): void {
    this.router.navigate(['/carga-masiva']);
  }
}
