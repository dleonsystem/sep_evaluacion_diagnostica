import { ArchivoDuplicadoError, ArchivoStorageService } from './archivo-storage.service';

describe('ArchivoStorageService', () => {
  let service: ArchivoStorageService;

  beforeEach(() => {
    localStorage.clear();
    service = new ArchivoStorageService();
  });

  function crearArchivo(nombre: string, contenido: string): File {
    return new File([contenido], nombre, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  it('should detect duplicates by hash for the same email and CCT', async () => {
    const hashSpy = spyOn<any>(service as any, 'calcularHash').and.returnValue(
      Promise.resolve('hash-duplicado')
    );
    const archivo = crearArchivo('demo.xlsx', 'contenido');

    await service.guardarArchivoPreescolar(archivo, { email: 'demo@correo.mx', cct: 'ABC1234567' });

    await expectAsync(
      service.guardarArchivoPreescolar(archivo, { email: 'demo@correo.mx', cct: 'ABC1234567' })
    ).toBeRejectedWith(jasmine.any(ArchivoDuplicadoError));

    expect(hashSpy).toHaveBeenCalled();
  });

  it('should allow identical hashes across different CCT values for the same email', async () => {
    spyOn<any>(service as any, 'calcularHash').and.returnValue(Promise.resolve('hash-compartido'));
    const archivo = crearArchivo('demo.xlsx', 'contenido');

    await service.guardarArchivoPreescolar(archivo, { email: 'demo@correo.mx', cct: 'ABC1234567' });
    await service.guardarArchivoPreescolar(archivo, { email: 'demo@correo.mx', cct: 'DEF9876543' });

    const registros = service.obtenerRegistros('demo@correo.mx');
    expect(registros.length).toBe(2);
    expect(registros.map((registro) => registro.cct)).toEqual(['DEF9876543', 'ABC1234567']);
    registros.forEach((registro) => {
      expect(registro.claveEstable).toBe(
        `${registro.cct}|${registro.correo}|${registro.nombre}|${registro.fechaGuardado}`
      );
    });
  });

  it('should replace duplicates when forcing replacement for the same email and CCT', async () => {
    spyOn<any>(service as any, 'calcularHash').and.returnValue(Promise.resolve('hash-reemplazo'));
    const archivoOriginal = crearArchivo('demo.xlsx', 'contenido');
    const archivoNuevo = crearArchivo('nuevo.xlsx', 'contenido distinto');

    await service.guardarArchivoPreescolar(archivoOriginal, {
      email: 'demo@correo.mx',
      cct: 'ABC1234567'
    });

    await expectAsync(
      service.guardarArchivoPreescolar(archivoOriginal, { email: 'demo@correo.mx', cct: 'ABC1234567' })
    ).toBeRejectedWith(jasmine.any(ArchivoDuplicadoError));

    const resultado = await service.guardarArchivoPreescolar(
      archivoNuevo,
      { email: 'demo@correo.mx', cct: 'ABC1234567' },
      { forzarReemplazo: true }
    );

    const registros = service.obtenerRegistros('demo@correo.mx');
    expect(registros.length).toBe(1);
    expect(registros[0].nombre).toBe('nuevo.xlsx');
    expect(registros[0].cct).toBe('ABC1234567');
    expect(resultado.nota).toContain('Se reemplazó el archivo previo');
  });
});
