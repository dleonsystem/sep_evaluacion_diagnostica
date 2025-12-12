import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArchivosGuardadosComponent } from './archivos-guardados.component';
import { ArchivoStorageService, RegistroArchivo } from '../../services/archivo-storage.service';

class ArchivoStorageServiceStub {
  obtenerRegistros(): RegistroArchivo[] {
    return [
      {
        nombre: 'demo.xlsx',
        tamano: 2048,
        fechaGuardado: new Date().toISOString(),
        ruta: 'assets/archivos/preescolar/demo.xlsx',
        contenidoBase64: 'ZGF0YQ=='
      }
    ];
  }

  descargarRegistro(): void {}
}

describe('ArchivosGuardadosComponent', () => {
  let component: ArchivosGuardadosComponent;
  let fixture: ComponentFixture<ArchivosGuardadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivosGuardadosComponent],
      providers: [{ provide: ArchivoStorageService, useClass: ArchivoStorageServiceStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(ArchivosGuardadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should list registros from the storage service', () => {
    expect(component.registros.length).toBe(1);
    expect(component.registros[0].nombre).toBe('demo.xlsx');
  });
});
