import { Routes } from '@angular/router';
import { InicioComponent } from './components/inicio/inicio.component';


export const routes: Routes = [
  {
    path: '',
    component: InicioComponent,
    pathMatch: 'full',
  },
  {
    path: 'inicio',
    component: InicioComponent,
    pathMatch: 'full',
  },
 /*  {
    path: 'inscripcion',
    component: InscripcionComponent,
    pathMatch: 'full',
  }, */
  /* {
    path: 'baja',
    component: BajaComponent,
    pathMatch: 'full',
  }, */
  /* {
    path: 'carga-masiva',
    component: CargaMasivaComponent,
    pathMatch: 'full',
  }, */
  /* {
    path: 'carga-masiva/detalle',
    component: CargaMasivaDetalleComponent,
  }, */
  /* {
    path: 'configuracion-instituciones',
    component: ConfiguracionInstitucionesComponent,
  }, */
  /* {
    path: 'inscripcion-masiva',
    component: InscripcionMasivaComponent,
    pathMatch: 'full',
  },
  {
    path: 'inscripciones/:id/editar',
    component: EditarRegistroComponent,
  }, */
];
