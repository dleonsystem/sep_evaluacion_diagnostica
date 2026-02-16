import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArchivosEvaluacionComponent } from './archivos-evaluacion.component';
import { AuthService } from '../../services/auth.service';
import { EvaluacionesService } from '../../services/evaluaciones.service';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';

class EvaluacionesServiceStub {
  getSolicitudes() {
    return of([]);
  }
}

class AuthServiceStub {
  obtenerCredenciales() {
    return { correo: 'test@test.com', cct: '09ABC1234', contrasena: '123' };
  }
  requiereLoginParaNuevaCarga() {
    return false;
  }
}

describe('ArchivosEvaluacionComponent', () => {
  let component: ArchivosEvaluacionComponent;
  let fixture: ComponentFixture<ArchivosEvaluacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivosEvaluacionComponent, RouterTestingModule],
      providers: [
        { provide: EvaluacionesService, useClass: EvaluacionesServiceStub },
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArchivosEvaluacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
