import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';



@Component({
  selector: 'app-preguntas-frecuentes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './preguntas-frecuentes.component.html',
  styleUrl: './preguntas-frecuentes.component.scss'
})
export class PreguntasFrecuentesComponent {

  constructor(private readonly router: Router) {}

  toggleRespuesta(event: Event) {
    const pregunta = event.currentTarget as HTMLElement;
    const respuesta = pregunta.nextElementSibling as HTMLElement;

    if (respuesta.style.display === 'block') {
      respuesta.style.display = 'none';
    } else {
      respuesta.style.display = 'block';
    }
  }

  volver(): void {
    this.router.navigate(['/carga-masiva']);
  }

}
