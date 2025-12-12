import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CargaMasivaComponent } from './carga-masiva.component';
import { ExcelValidationService, ResultadoValidacion } from '../../services/excel-validation.service';
import { ArchivoStorageService } from '../../services/archivo-storage.service';

const resultadoValido: ResultadoValidacion = {
  ok: true,
  errores: [],
  advertencias: [],
  hojasEncontradas: ['ESC', 'TERCERO', 'INSTRUCCIONES'],
  esc: {
    cct: '01DJN0000A',
    turno: 'MATUTINO',
    nombreEscuela: 'ESCUELA DEMO',
    correo: 'demo@correo.mx'
  },
  alumnos: []
};

class ExcelValidationServiceStub {
  validarPreescolar(): Promise<ResultadoValidacion> {
    return Promise.resolve(resultadoValido);
  }
}

class ArchivoStorageServiceStub {
  guardarArchivoPreescolar(): Promise<{ ruta: string }> {
    return Promise.resolve({ ruta: 'assets/archivos/preescolar/demo.xlsx' });
  }
}

describe('CargaMasivaComponent', () => {
  let component: CargaMasivaComponent;
  let fixture: ComponentFixture<CargaMasivaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargaMasivaComponent],
      providers: [
        { provide: ExcelValidationService, useClass: ExcelValidationServiceStub },
        { provide: ArchivoStorageService, useClass: ArchivoStorageServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CargaMasivaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reject files with unsupported extensions', async () => {
    const input = document.createElement('input');
    const archivo = new File(['contenido'], 'archivo.txt', { type: 'text/plain' });
    Object.defineProperty(input, 'files', { value: [archivo] });

    await component.onArchivoSeleccionado({ target: input } as unknown as Event);

    expect(component.estado).toBe('error');
    expect(component.errores[0]).toContain('Formato no permitido');
    expect(component.archivoSeleccionado).toBeNull();
  });
});
