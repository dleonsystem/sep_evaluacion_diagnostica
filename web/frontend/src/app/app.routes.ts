import { Routes } from '@angular/router';
import { InicioComponent } from './components/inicio/inicio.component';
import { CargaMasivaComponent } from './components/carga-masiva/carga-masiva.component';
import { ArchivosEvaluacionComponent } from './components/archivos-evaluacion/archivos-evaluacion.component';
import { LoginComponent } from './components/login/login.component';
import { DescargasComponent } from './components/descargas/descargas.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { TicketsComponent } from './components/tickets/tickets.component';
import { TicketsHistorialComponent } from './components/tickets-historial/tickets-historial.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { LoginGuard } from './guards/login.guard';
import { TicketDetalleComponent } from './components/ticket-detalle/ticket-detalle.component';
import { RecuperarPasswordComponent } from './components/recuperar-password/recuperar-password.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PreguntasFrecuentesComponent } from './components/preguntas-frecuentes/preguntas-frecuentes.component';
import { MaterialesAdminComponent } from './components/admin-panel/materiales/materiales.component';
import { MaterialesPublicosComponent } from './components/materiales-publicos/materiales-publicos.component';
import { CambioPasswordComponent } from './components/cambio-password/cambio-password.component';
import { PasswordChangeGuard } from './guards/password-change.guard';

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
  {
    path: 'materiales',
    component: MaterialesPublicosComponent,
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
    path: 'preguntas-frecuentes',
    component: PreguntasFrecuentesComponent,
    pathMatch: 'full',
  },
  {
    path: 'archivos-evaluacion',
    component: ArchivosEvaluacionComponent,
    canActivate: [AuthGuard],
    pathMatch: 'full',
  },
  {
    path: 'cambiar-password',
    component: CambioPasswordComponent,
    canActivate: [AuthGuard],
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [LoginGuard],
    pathMatch: 'full',
  },
  {
    path: 'recuperar-password',
    component: RecuperarPasswordComponent,
    canActivate: [LoginGuard],
    pathMatch: 'full',
  },
  {
    path: 'admin/panel',
    component: AdminPanelComponent,
    canActivate: [AdminGuard],
    pathMatch: 'full',
  },
  {
    path: 'admin/dashboard',
    component: DashboardComponent,
    canActivate: [AdminGuard],
    pathMatch: 'full',
  },
  {
    path: 'admin/materiales',
    component: MaterialesAdminComponent,
    canActivate: [AdminGuard],
    pathMatch: 'full',
  },
  {
    path: 'descargas',
    component: DescargasComponent,
    canActivate: [AdminGuard],
    pathMatch: 'full',
  },
  {
    path: 'tickets',
    component: TicketsComponent,
    canActivate: [AuthGuard],
    pathMatch: 'full',
  },
  {
    path: 'tickets-historial',
    component: TicketsHistorialComponent,
    canActivate: [AuthGuard],
    pathMatch: 'full',
  },
  {
    path: 'tickets/:folio',
    component: TicketDetalleComponent,
    canActivate: [AuthGuard],
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
