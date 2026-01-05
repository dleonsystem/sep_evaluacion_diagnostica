import { Injectable } from '@angular/core';

export interface EscDatos {
  cct: string;
  turno: string;
  nombreEscuela: string;
  correo: string;
}

export interface AlumnoValidado {
  filaExcel: number;
  numeroLista: number;
  nombre: string;
  sexo: 'H' | 'M';
  grupo: string;
  valoraciones: number[];
}

export interface ResultadoValidacion {
  ok: boolean;
  errores: string[];
  advertencias: string[];
  esc?: EscDatos;
  alumnos?: AlumnoValidado[];
  hojasEncontradas?: string[];
}

export type TipoArchivoCarga = 'preescolar' | 'primaria' | 'secundaria';

@Injectable({ providedIn: 'root' })
export class ExcelValidationService {
  private xlsxPromise: Promise<any> | null = null;
  private readonly turnosValidos = new Set([
    'MATUTINO',
    'VESPERTINO',
    'NOCTURNO',
    'DISCONTINUO',
    'TIEMPO COMPLETO',
    'JORNADA AMPLIADA'
  ]);
  private readonly columnasValoraciones = [
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P'
  ];
  private readonly hojasPorNivel: Record<TipoArchivoCarga, string[]> = {
    preescolar: ['ESC', 'TERCERO'],
    primaria: ['ESC', 'PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO', 'SEXTO'],
    secundaria: ['ESC', 'PRIMERO', 'SEGUNDO', 'TERCERO']
  };

  async detectarTipoArchivo(buffer: ArrayBuffer): Promise<TipoArchivoCarga | null> {
    const xlsx = await this.cargarXlsx();
    const workbook = xlsx.read(buffer, { type: 'array' });
    const hojas = workbook.SheetNames as string[];
    return this.detectarNivel(this.normalizarHojas(hojas));
  }

  async validarArchivo(buffer: ArrayBuffer): Promise<ResultadoValidacion> {
    const xlsx = await this.cargarXlsx();
    const workbook = xlsx.read(buffer, { type: 'array' });
    const hojas = workbook.SheetNames as string[];
    const hojasNormalizadas = this.normalizarHojas(hojas);
    const nivel = this.detectarNivel(hojasNormalizadas);

    if (!nivel) {
      return {
        ok: false,
        errores: ['No se reconoció el formato del archivo. Usa una plantilla oficial vigente.'],
        advertencias: [],
        hojasEncontradas: hojas
      };
    }

    switch (nivel) {
      case 'primaria':
        return this.validarPrimariaWorkbook(xlsx, workbook, hojas);
      case 'secundaria':
        return this.validarSecundariaWorkbook(xlsx, workbook, hojas);
      case 'preescolar':
      default:
        return this.validarPreescolarWorkbook(xlsx, workbook, hojas);
    }
  }

  async validarPreescolar(buffer: ArrayBuffer): Promise<ResultadoValidacion> {
    const xlsx = await this.cargarXlsx();
    const workbook = xlsx.read(buffer, { type: 'array' });
    return this.validarPreescolarWorkbook(xlsx, workbook, workbook.SheetNames as string[]);
  }

  private validarPreescolarWorkbook(xlsx: any, workbook: any, hojas: string[]): ResultadoValidacion {
    const errores: string[] = [];
    const advertencias: string[] = [];
    const escSheet = workbook.Sheets['ESC'];
    const terceroSheet = workbook.Sheets['TERCERO'];
    const hojasNormalizadas = this.normalizarHojas(hojas);
    const hojasRequeridas = this.hojasPorNivel.preescolar;

    if (!this.contieneTodasLasHojas(hojasNormalizadas, hojasRequeridas)) {
      const faltantes = this.obtenerHojasFaltantes(hojasNormalizadas, hojasRequeridas);
      errores.push(`Faltan hojas requeridas: ${faltantes.join(', ')}.`);
    }

    if (!escSheet) {
      errores.push('Falta la hoja ESC en el archivo.');
    }
    if (!terceroSheet) {
      errores.push('Falta la hoja TERCERO en el archivo.');
    }

    const resultado: ResultadoValidacion = {
      ok: false,
      errores,
      advertencias,
      hojasEncontradas: hojas
    };

    if (errores.length) {
      return resultado;
    }

    const esc = this.validarEsc(escSheet);
    resultado.errores.push(...esc.errores);
    if (esc.advertencia) {
      resultado.advertencias.push(esc.advertencia);
    }

    const alumnos = this.validarHojaAlumnos(xlsx, terceroSheet, 'TERCERO');
    resultado.errores.push(...alumnos.errores);

    if (!resultado.errores.length) {
      resultado.ok = true;
      resultado.esc = esc.datos!;
      resultado.alumnos = alumnos.registros;
    }

    return resultado;
  }

  private validarPrimariaWorkbook(xlsx: any, workbook: any, hojas: string[]): ResultadoValidacion {
    const errores: string[] = [];
    const advertencias: string[] = [];
    const escSheet = workbook.Sheets['ESC'];
    const hojasNormalizadas = this.normalizarHojas(hojas);
    const hojasRequeridas = this.hojasPorNivel.primaria;
    const grados = ['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO', 'SEXTO'];

    if (!this.contieneTodasLasHojas(hojasNormalizadas, hojasRequeridas)) {
      const faltantes = this.obtenerHojasFaltantes(hojasNormalizadas, hojasRequeridas);
      errores.push(`Faltan hojas requeridas: ${faltantes.join(', ')}.`);
    }

    if (!escSheet) {
      errores.push('Falta la hoja ESC en el archivo.');
    }

    const resultado: ResultadoValidacion = {
      ok: false,
      errores,
      advertencias,
      hojasEncontradas: hojas
    };

    if (errores.length) {
      return resultado;
    }

    const esc = this.validarEsc(escSheet);
    resultado.errores.push(...esc.errores);
    if (esc.advertencia) {
      resultado.advertencias.push(esc.advertencia);
    }

    const alumnos = this.validarHojasPorNombre(xlsx, workbook, grados);
    resultado.errores.push(...alumnos.errores);

    if (!resultado.errores.length) {
      resultado.ok = true;
      resultado.esc = esc.datos!;
      resultado.alumnos = alumnos.registros;
    }

    return resultado;
  }

  private validarSecundariaWorkbook(xlsx: any, workbook: any, hojas: string[]): ResultadoValidacion {
    const errores: string[] = [];
    const advertencias: string[] = [];
    const escSheet = workbook.Sheets['ESC'];
    const hojasNormalizadas = this.normalizarHojas(hojas);
    const hojasRequeridas = this.hojasPorNivel.secundaria;
    const grados = ['PRIMERO', 'SEGUNDO', 'TERCERO'];

    if (!this.contieneTodasLasHojas(hojasNormalizadas, hojasRequeridas)) {
      const faltantes = this.obtenerHojasFaltantes(hojasNormalizadas, hojasRequeridas);
      errores.push(`Faltan hojas requeridas: ${faltantes.join(', ')}.`);
    }

    if (!escSheet) {
      errores.push('Falta la hoja ESC en el archivo.');
    }

    const resultado: ResultadoValidacion = {
      ok: false,
      errores,
      advertencias,
      hojasEncontradas: hojas
    };

    if (errores.length) {
      return resultado;
    }

    const esc = this.validarEsc(escSheet);
    resultado.errores.push(...esc.errores);
    if (esc.advertencia) {
      resultado.advertencias.push(esc.advertencia);
    }

    const alumnos = this.validarHojasPorNombre(xlsx, workbook, grados);
    resultado.errores.push(...alumnos.errores);

    if (!resultado.errores.length) {
      resultado.ok = true;
      resultado.esc = esc.datos!;
      resultado.alumnos = alumnos.registros;
    }

    return resultado;
  }

  private validarEsc(sheet: any): {
    datos?: EscDatos;
    errores: string[];
    advertencia?: string;
  } {
    const errores: string[] = [];

    const cct = this.primeraCeldaNoVacia(sheet, ['D9', 'E9', 'C9']);
    const turno = this.primeraCeldaNoVacia(sheet, ['D11', 'E11']);
    const nombreEscuela = this.primeraCeldaNoVacia(sheet, ['D13', 'E13']);
    const correo = this.primeraCeldaNoVacia(sheet, ['D18', 'E18']);

    if (!cct) {
      errores.push('Captura la CCT en la hoja ESC.');
    } else if (!/^[0-9]{2}[A-Z]{3}[0-9]{4}[A-Z]$/.test(cct)) {
      errores.push('La CCT debe tener 10 caracteres alfanuméricos (ejemplo: 01DJN0000A).');
    }

    if (!turno) {
      errores.push('Selecciona un turno válido en la hoja ESC.');
    } else if (!this.turnosValidos.has(turno.toUpperCase().trim())) {
      errores.push('El turno capturado no coincide con las opciones de la plantilla.');
    }

    if (!nombreEscuela) {
      errores.push('Ingresa el nombre de la escuela en la hoja ESC.');
    }

    if (!correo) {
      errores.push('Ingresa el correo de contacto en la hoja ESC.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      errores.push('El correo de contacto no tiene un formato válido.');
    }

    return {
      datos: errores.length
        ? undefined
        : {
            cct: cct?.trim() ?? '',
            turno: turno?.trim() ?? '',
            nombreEscuela: nombreEscuela?.trim() ?? '',
            correo: correo?.trim() ?? ''
          },
      errores,
      advertencia: !sheet['!ref']
        ? 'No se pudieron leer todos los datos de la hoja ESC. Verifica que la plantilla no haya sido modificada.'
        : undefined
    };
  }

  private validarHojasPorNombre(
    xlsx: any,
    workbook: any,
    hojas: string[]
  ): { registros: AlumnoValidado[]; errores: string[] } {
    const errores: string[] = [];
    const registros: AlumnoValidado[] = [];

    hojas.forEach((hoja) => {
      const sheet = workbook.Sheets[hoja];
      if (!sheet) {
        errores.push(`Falta la hoja ${hoja} en el archivo.`);
        return;
      }
      const resultado = this.validarHojaAlumnos(xlsx, sheet, hoja);
      errores.push(...resultado.errores);
      registros.push(...resultado.registros);
    });

    return { registros, errores };
  }

  private validarHojaAlumnos(
    xlsx: any,
    sheet: any,
    nombreHoja: string
  ): {
    registros: AlumnoValidado[];
    errores: string[];
  } {
    const errores: string[] = [];
    const registros: AlumnoValidado[] = [];

    const datos = xlsx.utils.sheet_to_json(sheet, {
      range: 9,
      header: 'A',
      defval: ''
    }) as Array<Record<string, string>>;

    const filasIniciales = 10; // la fila 10 en Excel es el primer registro

    datos.forEach((fila: Record<string, string>, indice: number) => {
      const erroresFila: string[] = [];
      const numeroLista = this.limpiarTexto(fila['B']);
      const nombre = this.limpiarTexto(fila['C']);
      const sexo = this.limpiarTexto(fila['D']).toUpperCase();
      const grupo = this.limpiarTexto(fila['E']).toUpperCase();

      const valoraciones = this.columnasValoraciones.map((col) => {
        const valor = this.limpiarTexto(fila[col]);
        return valor === '' ? null : Number(valor);
      });

      const filaExcel = filasIniciales + indice;
      const filaVacia = !numeroLista && !nombre && !sexo && !grupo && valoraciones.every((v) => v === null);
      if (filaVacia) {
        return;
      }

      if (!numeroLista) {
        erroresFila.push(`Fila ${filaExcel} (${nombreHoja}): falta el número de lista.`);
      } else if (isNaN(Number(numeroLista))) {
        erroresFila.push(`Fila ${filaExcel} (${nombreHoja}): el número de lista debe ser numérico.`);
      }

      if (!nombre) {
        erroresFila.push(`Fila ${filaExcel} (${nombreHoja}): captura el nombre completo del estudiante.`);
      }

      if (!sexo) {
        erroresFila.push(`Fila ${filaExcel} (${nombreHoja}): indica el sexo (H/M).`);
      } else if (sexo !== 'H' && sexo !== 'M') {
        erroresFila.push(`Fila ${filaExcel} (${nombreHoja}): el sexo debe ser H o M.`);
      }

      if (!grupo) {
        erroresFila.push(`Fila ${filaExcel} (${nombreHoja}): captura el grupo.`);
      } else if (!/^[A-Z]$/.test(grupo)) {
        erroresFila.push(`Fila ${filaExcel} (${nombreHoja}): el grupo debe ser una sola letra (A-Z).`);
      }

      valoraciones.forEach((valor, idx) => {
        if (valor === null) {
          erroresFila.push(`Fila ${filaExcel} (${nombreHoja}): falta la valoración ${idx + 1}.`);
          return;
        }
        if (isNaN(valor) || valor < 0 || valor > 3) {
          erroresFila.push(
            `Fila ${filaExcel} (${nombreHoja}): la valoración ${idx + 1} debe estar entre 0 y 3.`
          );
        }
      });

      if (!erroresFila.length) {
        registros.push({
          filaExcel,
          numeroLista: Number(numeroLista),
          nombre,
          sexo: sexo as 'H' | 'M',
          grupo,
          valoraciones: valoraciones as number[]
        });
      } else {
        errores.push(...erroresFila);
      }
    });

    if (!registros.length) {
      errores.push(`No se encontraron estudiantes capturados en la hoja ${nombreHoja}.`);
    }

    return { registros, errores };
  }

  private detectarNivel(hojasNormalizadas: Set<string>): TipoArchivoCarga | null {
    const orden: TipoArchivoCarga[] = ['primaria', 'secundaria', 'preescolar'];
    for (const nivel of orden) {
      if (this.contieneTodasLasHojas(hojasNormalizadas, this.hojasPorNivel[nivel])) {
        return nivel;
      }
    }
    return null;
  }

  private normalizarHoja(hoja: string): string {
    return hoja.trim().toUpperCase();
  }

  private normalizarHojas(hojas: string[]): Set<string> {
    return new Set(hojas.map((hoja: string) => this.normalizarHoja(hoja)));
  }

  private contieneTodasLasHojas(hojasNormalizadas: Set<string>, hojasRequeridas: string[]): boolean {
    for (const hoja of hojasRequeridas) {
      if (!hojasNormalizadas.has(hoja)) {
        return false;
      }
    }
    return true;
  }

  private obtenerHojasFaltantes(hojasNormalizadas: Set<string>, hojasRequeridas: string[]): string[] {
    const faltantes: string[] = [];
    for (const hoja of hojasRequeridas) {
      if (!hojasNormalizadas.has(hoja)) {
        faltantes.push(hoja);
      }
    }
    return faltantes;
  }

  private limpiarTexto(valor: any): string {
    return (valor ?? '').toString().trim();
  }

  private primeraCeldaNoVacia(sheet: any, celdas: string[]): string {
    for (const celda of celdas) {
      const contenido = sheet?.[celda]?.v ?? sheet?.[celda]?.w;
      if (contenido !== undefined && contenido !== null && `${contenido}`.trim() !== '') {
        return `${contenido}`;
      }
    }
    return '';
  }

  private cargarXlsx(): Promise<any> {
    if (this.xlsxPromise) {
      return this.xlsxPromise;
    }

    this.xlsxPromise = import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm').catch((error) => {
      console.error('No se pudo cargar la librería XLSX', error);
      throw new Error('No se pudo cargar el validador de Excel. Intenta de nuevo más tarde.');
    });

    return this.xlsxPromise;
  }
}
