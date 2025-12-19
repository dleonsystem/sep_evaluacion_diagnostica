import { Routes } from '@angular/router';
import { InicioComponent } from './components/inicio/inicio.component';
import { CargaMasivaComponent } from './components/carga-masiva/carga-masiva.component';
import { ArchivosGuardadosComponent } from './components/archivos-guardados/archivos-guardados.component';
import { LoginComponent } from './components/login/login.component';
import { DescargasComponent } from './components/descargas/descargas.component';


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
  {
    path: 'carga-masiva',
    component: CargaMasivaComponent,
    pathMatch: 'full',
  },
  {
    path: 'archivos-preescolar',
    component: ArchivosGuardadosComponent,
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    pathMatch: 'full'
  },
  {
    path: 'descargas',
    component: DescargasComponent,
    pathMatch: 'full'
  },
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
