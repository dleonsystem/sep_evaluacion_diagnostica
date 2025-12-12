import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CargaMasivaComponent } from './carga-masiva.component';

describe('CargaMasivaComponent', () => {
  let component: CargaMasivaComponent;
  let fixture: ComponentFixture<CargaMasivaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargaMasivaComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CargaMasivaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reject files with unsupported extensions', () => {
    const input = document.createElement('input');
    const archivo = new File(['contenido'], 'archivo.txt', { type: 'text/plain' });
    Object.defineProperty(input, 'files', { value: [archivo] });

    component.onArchivoSeleccionado({ target: input } as unknown as Event);

    expect(component.error).toContain('Formato no permitido');
    expect(component.archivoSeleccionado).toBeNull();
  });
});
