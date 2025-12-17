import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CargaMasivaComponent } from './carga-masiva.component';
import { ExcelValidationService, ResultadoValidacion } from '../../services/excel-validation.service';
import { ArchivoStorageService } from '../../services/archivo-storage.service';
import { AuthService } from '../../services/auth.service';

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
  resultado: ResultadoValidacion = resultadoValido;

  validarPreescolar(): Promise<ResultadoValidacion> {
    return Promise.resolve(this.resultado);
  }
}

class ArchivoStorageServiceStub {
  guardarArchivoPreescolar(
    _archivo: File,
    _contexto?: { email: string; cct: string },
    _opciones?: { forzarReemplazo?: boolean }
  ): Promise<{ rutaVirtual: string; modo: 'localStorage'; nota: string }> {
    return Promise.resolve({
      rutaVirtual: 'assets/archivos/preescolar/demo.xlsx',
      modo: 'localStorage',
      nota: 'Guardado en localStorage para referencia.'
    });
  }
}

class AuthServiceStub {
  normalizarCorreo(correo: string): string {
    return (correo ?? '').trim().toLowerCase();
  }

  requiereLoginParaCorreo(): boolean {
    return false;
  }

  registrarCarga(): { password: string; esNuevo: boolean } {
    return { password: 'demoPass', esNuevo: true };
  }

  obtenerCuenta(): null {
    return null;
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
        { provide: ArchivoStorageService, useClass: ArchivoStorageServiceStub },
        { provide: AuthService, useClass: AuthServiceStub }
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
    component.correoControl.setValue('demo@correo.mx');
    const input = document.createElement('input');
    const archivo = new File(['contenido'], 'archivo.txt', { type: 'text/plain' });
    Object.defineProperty(input, 'files', { value: [archivo] });

    await component.onArchivoSeleccionado({ target: input } as unknown as Event);

    expect(component.resultados[0].estado).toBe('error');
    expect(component.resultados[0].errores[0]).toContain('Formato no permitido');
  });

  it('should block when Excel email differs from the form', async () => {
    const excelService = TestBed.inject(
      ExcelValidationService
    ) as unknown as ExcelValidationServiceStub;
    excelService.resultado = {
      ...resultadoValido,
      esc: { ...resultadoValido.esc!, correo: 'otro@correo.mx' }
    };

    component.correoControl.setValue('demo@correo.mx');
    const input = document.createElement('input');
    const archivo = new File(['contenido'], 'archivo.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    Object.defineProperty(input, 'files', { value: [archivo] });

    await component.onArchivoSeleccionado({ target: input } as unknown as Event);

    expect(component.resultados[0].estado).toBe('error');
    expect(component.resultados[0].errores).toContain(
      'El correo capturado debe coincidir con el que aparece en la hoja ESC del archivo.'
    );
  });
});
