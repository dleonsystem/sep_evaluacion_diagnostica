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

export type TipoArchivoCarga = 'preescolar' | 'primaria' | 'secundaria' | 'desconocido';

@Injectable({ providedIn: 'root' })
export class ExcelValidationService {
  private xlsxPromise: Promise<any> | null = null;
  // Hojas base (centralizadas para evitar duplicidad de nombres).
  private readonly hojasBase = {
    esc: 'ESC',
    primero: 'PRIMERO',
    segundo: 'SEGUNDO',
    tercero: 'TERCERO',
    cuarto: 'CUARTO',
    quinto: 'QUINTO',
    sexto: 'SEXTO'
  };
  // Configuración por nivel (hojas requeridas por tipo de archivo).
  private readonly hojasPorNivel = {
    preescolar: [this.hojasBase.esc, this.hojasBase.tercero],
    primaria: [
      this.hojasBase.esc,
      this.hojasBase.primero,
      this.hojasBase.segundo,
      this.hojasBase.tercero,
      this.hojasBase.cuarto,
      this.hojasBase.quinto,
      this.hojasBase.sexto
    ],
    secundaria: [this.hojasBase.esc, this.hojasBase.primero, this.hojasBase.segundo, this.hojasBase.tercero]
  };
  // Encabezados base (centralizados por nivel/sección).
  private readonly encabezadosEscBase = {
    C9: 'CCT : ',
    C11: 'TURNO : ',
    C13: 'NOMBRE DE LA ESCUELA :',
    C18: 'CORREO: '
  };
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
  // Primaria: encabezados fijos + consignas por grado.
  private readonly encabezadosPrimariaBase = {
    B6: 'NÚM. DE LISTA',
    C6: 'NOMBRE DEL ESTUDIANTE\n(Primer Apellido - Segundo Apellido - Nombre)',
    D6: 'SEXO\nH: NIÑO - M: NIÑA',
    E6: 'GRUPO',
    F6: 'VALORACIÓN ASIGNADA SEGÚN LA RÚBRICA'
  };
  // Secundaria: encabezados fijos + consignas + disciplinas.
  private readonly encabezadosSecundariaBase = {
    B5: 'NÚM. DE LISTA',
    C5: 'NOMBRE DEL ESTUDIANTE\n(Primer Apellido - Segundo Apellido - Nombre)',
    D5: 'SEXO\nH: HOMBRE - M: MUJER',
    E5: 'GRUPO',
    F5: 'VALORACIÓN ASIGNADA SEGÚN LA RÚBRICA'
  };
  private readonly encabezadosConsignasPrimaria: Record<string, string[]> = {
    PRIMERO: [
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 2 INCISO: A2',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 4 INCISO: A1',
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 3 INCISO: A2',
      'CONSIGNA: 4 INCISO: A1'
    ],
    SEGUNDO: [
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 2 INCISO: A2',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 4 INCISO: A1',
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 3 INCISO: A2',
      'CONSIGNA: 4 INCISO: A1'
    ],
    TERCERO: [
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 1 INCISO: A2',
      'CONSIGNA: 1 INCISO: B1',
      'CONSIGNA: 1 INCISO: B2',
      'CONSIGNA: 1 INCISO: B3',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 2 INCISO: A2',
      'CONSIGNA: 2 INCISO: A3',
      'CONSIGNA: 2 INCISO: B1',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 3 INCISO: B1',
      'CONSIGNA: 4 INCISO: A1',
      'CONSIGNA: 4 INCISO: A2',
      'CONSIGNA: 4 INCISO: A3',
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 1 INCISO: B1',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 3 INCISO: B1',
      'CONSIGNA: 3 INCISO: C1',
      'CONSIGNA: 3 INCISO: C2',
      'CONSIGNA: 4 INCISO: A1',
      'CONSIGNA: 4 INCISO: B1',
      'CONSIGNA: 5 INCISO: A1',
      'CONSIGNA: 5 INCISO: A2',
      'CONSIGNA: 5 INCISO: A3'
    ],
    CUARTO: [
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 1 INCISO: A2',
      'CONSIGNA: 1 INCISO: B1',
      'CONSIGNA: 1 INCISO: B2',
      'CONSIGNA: 1 INCISO: B3',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 2 INCISO: A2',
      'CONSIGNA: 2 INCISO: A3',
      'CONSIGNA: 2 INCISO: B1',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 3 INCISO: B1',
      'CONSIGNA: 4 INCISO: A1',
      'CONSIGNA: 4 INCISO: A2',
      'CONSIGNA: 4 INCISO: A3',
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 1 INCISO: B1',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 3 INCISO: B1',
      'CONSIGNA: 3 INCISO: C1',
      'CONSIGNA: 3 INCISO: C2',
      'CONSIGNA: 4 INCISO: A1',
      'CONSIGNA: 4 INCISO: B1',
      'CONSIGNA: 5 INCISO: A1',
      'CONSIGNA: 5 INCISO: A2',
      'CONSIGNA: 5 INCISO: A3'
    ],
    QUINTO: [
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 1 INCISO: B1',
      'CONSIGNA: 1 INCISO: B2',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 2 INCISO: B1',
      'CONSIGNA: 2 INCISO: C1',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 3 INCISO: B1',
      'CONSIGNA: 4 INCISO: A1',
      'CONSIGNA: 4 INCISO: B1',
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 1 INCISO: B1',
      'CONSIGNA: 1 INCISO: C1',
      'CONSIGNA: 1 INCISO: C2',
      'CONSIGNA: 1 INCISO: C3',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 2 INCISO: B1',
      'CONSIGNA: 2 INCISO: C1',
      'CONSIGNA: 2 INCISO: D1',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 3 INCISO: A2',
      'CONSIGNA: 3 INCISO: B1',
      'CONSIGNA: 3 INCISO: C1',
      'CONSIGNA: 4 INCISO: A1',
      'CONSIGNA: 4 INCISO: B1'
    ],
    SEXTO: [
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 1 INCISO: B1',
      'CONSIGNA: 1 INCISO: B2',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 2 INCISO: B1',
      'CONSIGNA: 2 INCISO: C1',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 3 INCISO: B1',
      'CONSIGNA: 4 INCISO: A1',
      'CONSIGNA: 4 INCISO: B1',
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 1 INCISO: B1',
      'CONSIGNA: 1 INCISO: C1',
      'CONSIGNA: 1 INCISO: C2',
      'CONSIGNA: 1 INCISO: C3',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 2 INCISO: B1',
      'CONSIGNA: 2 INCISO: C1',
      'CONSIGNA: 2 INCISO: D1',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 3 INCISO: A2',
      'CONSIGNA: 3 INCISO: B1',
      'CONSIGNA: 3 INCISO: C1',
      'CONSIGNA: 4 INCISO: A1',
      'CONSIGNA: 4 INCISO: B1'
    ]
  };
  private readonly encabezadosConsignasSecundaria: Record<string, string[]> = {
    PRIMERO: [
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 1 INCISO: A2',
      'CONSIGNA: 1 INCISO: A3',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 2 INCISO: A2',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 4 INCISO: A1',
      'CONSIGNA: 4 INCISO: B1',
      'CONSIGNA: 5 INCISO: A1',
      'CONSIGNA: 5 INCISO: B1',
      'CONSIGNA: 5 INCISO: C1',
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 1 INCISO: A2',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 2 INCISO: A2',
      'CONSIGNA: 2 INCISO: B1',
      'CONSIGNA: 2 INCISO: B2',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 3 INCISO: B1',
      'CONSIGNA: 3 INCISO: C1',
      'CONSIGNA: 4 INCISO: A1'
    ],
    SEGUNDO: [
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 1 INCISO: A2',
      'CONSIGNA: 1 INCISO: A3',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 2 INCISO: A2',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 4 INCISO: A1',
      'CONSIGNA: 4 INCISO: B1',
      'CONSIGNA: 5 INCISO: A1',
      'CONSIGNA: 5 INCISO: B1',
      'CONSIGNA: 5 INCISO: C1',
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 1 INCISO: A2',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 2 INCISO: A2',
      'CONSIGNA: 2 INCISO: B1',
      'CONSIGNA: 2 INCISO: B2',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 3 INCISO: B1',
      'CONSIGNA: 3 INCISO: C1',
      'CONSIGNA: 4 INCISO: A1'
    ],
    TERCERO: [
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 1 INCISO: A2',
      'CONSIGNA: 1 INCISO: A3',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 2 INCISO: A2',
      'CONSIGNA: 2 INCISO: B1',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 3 INCISO: A2',
      'CONSIGNA: 4 INCISO: A1',
      'CONSIGNA: 4 INCISO: A2',
      'CONSIGNA: 1 INCISO: A1',
      'CONSIGNA: 1 INCISO: A2',
      'CONSIGNA: 1 INCISO: A3',
      'CONSIGNA: 2 INCISO: A1',
      'CONSIGNA: 2 INCISO: A2',
      'CONSIGNA: 3 INCISO: A1',
      'CONSIGNA: 3 INCISO: A2',
      'CONSIGNA: 3 INCISO: A3',
      'CONSIGNA: 4 INCISO: A1',
      'CONSIGNA: 4 INCISO: A2'
    ]
  };
  private readonly encabezadosDisciplinasSecundaria: Record<string, string[]> = {
    PRIMERO: [
      '*Matemáticas',
      '*Matemáticas',
      '*Matemáticas',
      '*Matemáticas',
      '*Matemáticas',
      '*Español',
      '*Formación cívicia y ética',
      '*Formación cívicia y ética',
      '*Educación socioemocional / Tutoría',
      '*Educación socioemocional / Tutoría',
      '*Educación socioemocional / Tutoría',
      '*Español',
      '*Español',
      '*Matemáticas',
      '*Matemáticas',
      '*Matemáticas',
      '*Matemáticas',
      '*Formación cívicia y ética',
      '*Formación cívicia y ética',
      '*Formación cívicia y ética',
      '*Educación socioemocional / Tutoría'
    ],
    SEGUNDO: [
      '*Matemáticas',
      '*Matemáticas',
      '*Matemáticas',
      '*Matemáticas',
      '*Matemáticas',
      '*Español',
      '*Formación cívicia y ética',
      '*Formación cívicia y ética',
      '*Educación socioemocional / Tutoría',
      '*Educación socioemocional / Tutoría',
      '*Educación socioemocional / Tutoría',
      '*Español',
      '*Español',
      '*Matemáticas',
      '*Matemáticas',
      '*Matemáticas',
      '*Matemáticas',
      '*Formación cívicia y ética',
      '*Formación cívicia y ética',
      '*Formación cívicia y ética',
      '*Educación socioemocional / Tutoría'
    ],
    TERCERO: [
      '*Artes',
      '*Artes',
      '*Artes',
      '*Matemáticas',
      '*Matemáticas',
      '*Matemáticas',
      '*Formación cívica y ética',
      '*Formación cívica y ética',
      '*Tecnología',
      '*Tecnología',
      '*Español',
      '*Español',
      '*Español',
      '*Química',
      '*Química',
      '*Formación cívica y ética',
      '*Formación cívica y ética',
      '*Formación cívica y ética',
      '*Educación socioemocional / Tutoría',
      '*Educación socioemocional / Tutoría'
    ]
  };
  private readonly columnasValoracionesPrimaria: Record<string, string[]> = {
    PRIMERO: this.rangoColumnas('F', 'O'),
    SEGUNDO: this.rangoColumnas('F', 'O'),
    TERCERO: this.rangoColumnas('F', 'AE'),
    CUARTO: this.rangoColumnas('F', 'AE'),
    QUINTO: this.rangoColumnas('F', 'AD'),
    SEXTO: this.rangoColumnas('F', 'AD')
  };
  private readonly columnasValoracionesSecundaria: Record<string, string[]> = {
    PRIMERO: this.rangoColumnas('F', 'Z'),
    SEGUNDO: this.rangoColumnas('F', 'Z'),
    TERCERO: this.rangoColumnas('F', 'Y')
  };

  async detectarTipoArchivo(buffer: ArrayBuffer): Promise<TipoArchivoCarga> {
    const xlsx = await this.cargarXlsx();
    const workbook = xlsx.read(buffer, { type: 'array' });
    const hojasNormalizadas = new Set(workbook.SheetNames.map((hoja: string) => this.normalizarHoja(hoja)));

    if (this.contieneTodasLasHojas(hojasNormalizadas, this.hojasPorNivel.primaria)) {
      return 'primaria';
    }

    if (
      this.contieneTodasLasHojas(hojasNormalizadas, this.hojasPorNivel.secundaria) &&
      !hojasNormalizadas.has(this.hojasBase.cuarto) &&
      !hojasNormalizadas.has(this.hojasBase.quinto) &&
      !hojasNormalizadas.has(this.hojasBase.sexto)
    ) {
      return 'secundaria';
    }

    if (
      this.contieneTodasLasHojas(hojasNormalizadas, this.hojasPorNivel.preescolar) &&
      !hojasNormalizadas.has(this.hojasBase.primero) &&
      !hojasNormalizadas.has(this.hojasBase.segundo)
    ) {
      return 'preescolar';
    }

    return 'desconocido';
  }

  async validarPreescolar(buffer: ArrayBuffer): Promise<ResultadoValidacion> {
    const xlsx = await this.cargarXlsx();
    const workbook = xlsx.read(buffer, { type: 'array' });
    const errores: string[] = [];
    const advertencias: string[] = [];
    const hojas = workbook.SheetNames as string[];

    const escSheet = workbook.Sheets[this.hojasBase.esc];
    const terceroSheet = workbook.Sheets[this.hojasBase.tercero];

    if (!escSheet) {
      errores.push(`Falta la hoja ${this.hojasBase.esc} en el archivo.`);
    }
    if (!terceroSheet) {
      errores.push(`Falta la hoja ${this.hojasBase.tercero} en el archivo.`);
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

    const alumnos = this.validarHojaTercero(xlsx, terceroSheet);
    resultado.errores.push(...alumnos.errores);

    if (!resultado.errores.length) {
      resultado.ok = true;
      resultado.esc = esc.datos!;
      resultado.alumnos = alumnos.registros;
    }

    return resultado;
  }

  async validarPrimaria(buffer: ArrayBuffer): Promise<ResultadoValidacion> {
    const xlsx = await this.cargarXlsx();
    const workbook = xlsx.read(buffer, { type: 'array' });
    const errores: string[] = [];
    const advertencias: string[] = [];
    const hojas = workbook.SheetNames;
    const hojasNormalizadas = new Set(hojas.map((hoja) => this.normalizarHoja(hoja)));
    const hojasRequeridas = this.hojasPorNivel.primaria;

    const hojasFaltantes = this.obtenerHojasFaltantes(hojasNormalizadas, hojasRequeridas);
    if (hojasFaltantes.length) {
      errores.push(`Primaria: faltan las hojas ${hojasFaltantes.join(', ')} en el archivo.`);
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

    const escSheet = workbook.Sheets[this.hojasBase.esc];
    if (!escSheet) {
      resultado.errores.push(`Primaria: falta la hoja ${this.hojasBase.esc} en el archivo.`);
      return resultado;
    }

    const escEncabezados = this.validarEncabezadosEscPrimaria(escSheet);
    resultado.errores.push(...escEncabezados.map((error) => `Primaria: ${error}`));

    const esc = this.validarEsc(escSheet);
    resultado.errores.push(...esc.errores.map((error) => `Primaria: ${error}`));
    if (esc.advertencia) {
      resultado.advertencias.push(`Primaria: ${esc.advertencia}`);
    }

    const alumnos: AlumnoValidado[] = [];

    hojasRequeridas
      .filter((hoja) => hoja !== 'ESC')
      .forEach((hoja) => {
        const hojaSheet = workbook.Sheets[hoja];
        if (!hojaSheet) {
          resultado.errores.push(`Primaria: falta la hoja ${hoja} en el archivo.`);
          return;
        }

        resultado.errores.push(...this.validarEncabezadosPrimaria(hojaSheet, hoja));

        const resultadoHoja = this.validarHojaPrimaria(xlsx, hojaSheet, hoja);
        resultado.errores.push(...resultadoHoja.errores);
        alumnos.push(...resultadoHoja.registros);
      });

    if (!resultado.errores.length) {
      resultado.ok = true;
      resultado.esc = esc.datos!;
      resultado.alumnos = alumnos;
    }

    return resultado;
  }

  async validarSecundaria(buffer: ArrayBuffer): Promise<ResultadoValidacion> {
    return this.validarSecundariaTecnicasGenerales(buffer);
  }

  async validarSecundariaTecnicasGenerales(buffer: ArrayBuffer): Promise<ResultadoValidacion> {
    const xlsx = await this.cargarXlsx();
    const workbook = xlsx.read(buffer, { type: 'array' });
    const errores: string[] = [];
    const advertencias: string[] = [];
    const hojas = workbook.SheetNames;
    const hojasNormalizadas = new Set(hojas.map((hoja) => this.normalizarHoja(hoja)));
    const hojasRequeridas = this.hojasPorNivel.secundaria;

    const hojasFaltantes = this.obtenerHojasFaltantes(hojasNormalizadas, hojasRequeridas);
    if (hojasFaltantes.length) {
      errores.push(`Faltan las hojas ${hojasFaltantes.join(', ')} en el archivo.`);
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

    const escSheet = workbook.Sheets[this.hojasBase.esc];
    if (!escSheet) {
      resultado.errores.push(`Falta la hoja ${this.hojasBase.esc} en el archivo.`);
      return resultado;
    }

    const escEncabezados = this.validarEncabezadosEscPrimaria(escSheet);
    resultado.errores.push(...escEncabezados.map((error) => `Secundaria: ${error}`));

    const esc = this.validarEsc(escSheet);
    resultado.errores.push(...esc.errores.map((error) => `Secundaria: ${error}`));
    if (esc.advertencia) {
      resultado.advertencias.push(`Secundaria: ${esc.advertencia}`);
    }

    const alumnos: AlumnoValidado[] = [];

    hojasRequeridas
      .filter((hoja) => hoja !== 'ESC')
      .forEach((hoja) => {
        const hojaSheet = workbook.Sheets[hoja];
        if (!hojaSheet) {
          resultado.errores.push(`Secundaria: falta la hoja ${hoja} en el archivo.`);
          return;
        }

        resultado.errores.push(...this.validarEncabezadosSecundaria(hojaSheet, hoja));

        const resultadoHoja = this.validarHojaSecundaria(xlsx, hojaSheet, hoja);
        resultado.errores.push(...resultadoHoja.errores);
        alumnos.push(...resultadoHoja.registros);
      });

    if (!resultado.errores.length) {
      resultado.ok = true;
      resultado.esc = esc.datos!;
      resultado.alumnos = alumnos;
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

  private validarHojaTercero(xlsx: any, sheet: any): {
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
        erroresFila.push(`Fila ${filaExcel}: falta el número de lista.`);
      } else if (isNaN(Number(numeroLista))) {
        erroresFila.push(`Fila ${filaExcel}: el número de lista debe ser numérico.`);
      }

      if (!nombre) {
        erroresFila.push(`Fila ${filaExcel}: captura el nombre completo del estudiante.`);
      }

      if (!sexo) {
        erroresFila.push(`Fila ${filaExcel}: indica el sexo (H/M).`);
      } else if (sexo !== 'H' && sexo !== 'M') {
        erroresFila.push(`Fila ${filaExcel}: el sexo debe ser H o M.`);
      }

      if (!grupo) {
        erroresFila.push(`Fila ${filaExcel}: captura el grupo.`);
      } else if (!/^[A-Z]$/.test(grupo)) {
        erroresFila.push(`Fila ${filaExcel}: el grupo debe ser una sola letra (A-Z).`);
      }

      valoraciones.forEach((valor, idx) => {
        if (valor === null) {
          erroresFila.push(`Fila ${filaExcel}: falta la valoración ${idx + 1}.`);
          return;
        }
        if (isNaN(valor) || valor < 0 || valor > 3) {
          erroresFila.push(`Fila ${filaExcel}: la valoración ${idx + 1} debe estar entre 0 y 3.`);
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
      errores.push('No se encontraron estudiantes capturados en la hoja TERCERO.');
    }

    return { registros, errores };
  }

  private limpiarTexto(valor: any): string {
    return (valor ?? '').toString().trim();
  }

  private normalizarEncabezado(valor: string): string {
    return (valor ?? '')
      .toString()
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  private normalizarHoja(nombre: string): string {
    return (nombre ?? '').toString().trim().toUpperCase();
  }

  private contieneTodasLasHojas(hojas: Set<string>, requeridas: string[]): boolean {
    return requeridas.every((hoja) => hojas.has(hoja));
  }

  private obtenerHojasFaltantes(hojas: Set<string>, requeridas: string[]): string[] {
    return requeridas.filter((hoja) => !hojas.has(hoja));
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

  private obtenerValorCelda(sheet: any, celda: string): string {
    const contenido = sheet?.[celda]?.v ?? sheet?.[celda]?.w;
    return this.limpiarTexto(contenido);
  }

  private validarEncabezadosEscPrimaria(sheet: any): string[] {
    return Object.entries(this.encabezadosEscBase).flatMap(([celda, esperado]) => {
      const encontrado = this.normalizarEncabezado(this.obtenerValorCelda(sheet, celda));
      const esperadoNormalizado = this.normalizarEncabezado(esperado);
      if (encontrado !== esperadoNormalizado) {
        return [`El encabezado ${celda} debe ser "${esperado}".`];
      }
      return [];
    });
  }

  private validarEncabezadosPrimaria(sheet: any, hoja: string): string[] {
    const errores: string[] = [];

    Object.entries(this.encabezadosPrimariaBase).forEach(([celda, esperado]) => {
      const encontrado = this.normalizarEncabezado(this.obtenerValorCelda(sheet, celda));
      const esperadoNormalizado = this.normalizarEncabezado(esperado);
      if (encontrado !== esperadoNormalizado) {
        errores.push(`Primaria ${hoja}: el encabezado ${celda} debe ser "${esperado}".`);
      }
    });

    const consignas = this.encabezadosConsignasPrimaria[hoja];
    const columnas = this.columnasValoracionesPrimaria[hoja];
    if (!consignas || !columnas) {
      errores.push(`Primaria ${hoja}: no se encontró la configuración de encabezados.`);
      return errores;
    }

    consignas.forEach((consigna, idx) => {
      const celda = `${columnas[idx]}9`;
      const encontrado = this.normalizarEncabezado(this.obtenerValorCelda(sheet, celda));
      const esperadoNormalizado = this.normalizarEncabezado(consigna);
      if (encontrado !== esperadoNormalizado) {
        errores.push(`Primaria ${hoja}: el encabezado ${celda} debe ser "${consigna}".`);
      }
    });

    return errores;
  }

  private validarEncabezadosSecundaria(sheet: any, hoja: string): string[] {
    const errores: string[] = [];

    Object.entries(this.encabezadosSecundariaBase).forEach(([celda, esperado]) => {
      const encontrado = this.normalizarEncabezado(this.obtenerValorCelda(sheet, celda));
      const esperadoNormalizado = this.normalizarEncabezado(esperado);
      if (encontrado !== esperadoNormalizado) {
        errores.push(`Secundaria ${hoja}: el encabezado ${celda} debe ser "${esperado}".`);
      }
    });

    const consignas = this.encabezadosConsignasSecundaria[hoja];
    const columnas = this.columnasValoracionesSecundaria[hoja];
    if (!consignas || !columnas) {
      errores.push(`Secundaria ${hoja}: no se encontró la configuración de encabezados.`);
      return errores;
    }

    consignas.forEach((consigna, idx) => {
      const celda = `${columnas[idx]}8`;
      const encontrado = this.normalizarEncabezado(this.obtenerValorCelda(sheet, celda));
      const esperadoNormalizado = this.normalizarEncabezado(consigna);
      if (encontrado !== esperadoNormalizado) {
        errores.push(`Secundaria ${hoja}: el encabezado ${celda} debe ser "${consigna}".`);
      }
    });

    const disciplinas = this.encabezadosDisciplinasSecundaria[hoja];
    if (!disciplinas) {
      errores.push(`Secundaria ${hoja}: no se encontró la configuración de disciplinas.`);
      return errores;
    }

    disciplinas.forEach((disciplina, idx) => {
      const celda = `${columnas[idx]}9`;
      const encontrado = this.normalizarEncabezado(this.obtenerValorCelda(sheet, celda));
      const esperadoNormalizado = this.normalizarEncabezado(disciplina);
      if (encontrado !== esperadoNormalizado) {
        errores.push(`Secundaria ${hoja}: el encabezado ${celda} debe ser "${disciplina}".`);
      }
    });

    return errores;
  }

  private validarHojaPrimaria(xlsx: any, sheet: any, hoja: string): {
    registros: AlumnoValidado[];
    errores: string[];
  } {
    const errores: string[] = [];
    const registros: AlumnoValidado[] = [];
    const columnasValoraciones = this.columnasValoracionesPrimaria[hoja];

    if (!columnasValoraciones) {
      return {
        registros,
        errores: [`Primaria ${hoja}: no se pudo determinar el rango de valoraciones.`]
      };
    }

    const datos = xlsx.utils.sheet_to_json(sheet, {
      range: 9,
      header: 'A',
      defval: ''
    }) as Array<Record<string, string>>;

    const filasIniciales = 10;

    datos.forEach((fila: Record<string, string>, indice: number) => {
      const erroresFila: string[] = [];
      const numeroLista = this.limpiarTexto(fila['B']);
      const nombre = this.limpiarTexto(fila['C']);
      const sexo = this.limpiarTexto(fila['D']).toUpperCase();
      const grupo = this.limpiarTexto(fila['E']).toUpperCase();

      const valoraciones = columnasValoraciones.map((col) => {
        const valor = this.limpiarTexto(fila[col]);
        return valor === '' ? null : Number(valor);
      });

      const filaExcel = filasIniciales + indice;
      const filaVacia =
        !numeroLista && !nombre && !sexo && !grupo && valoraciones.every((valor) => valor === null);
      if (filaVacia) {
        return;
      }

      if (!numeroLista) {
        erroresFila.push(`Primaria ${hoja} - Fila ${filaExcel}: falta el número de lista.`);
      } else if (isNaN(Number(numeroLista))) {
        erroresFila.push(`Primaria ${hoja} - Fila ${filaExcel}: el número de lista debe ser numérico.`);
      }

      if (!nombre) {
        erroresFila.push(`Primaria ${hoja} - Fila ${filaExcel}: captura el nombre completo del estudiante.`);
      }

      if (!sexo) {
        erroresFila.push(`Primaria ${hoja} - Fila ${filaExcel}: indica el sexo (H/M).`);
      } else if (sexo !== 'H' && sexo !== 'M') {
        erroresFila.push(`Primaria ${hoja} - Fila ${filaExcel}: el sexo debe ser H o M.`);
      }

      if (!grupo) {
        erroresFila.push(`Primaria ${hoja} - Fila ${filaExcel}: captura el grupo.`);
      } else if (!/^[A-Z]$/.test(grupo)) {
        erroresFila.push(`Primaria ${hoja} - Fila ${filaExcel}: el grupo debe ser una sola letra (A-Z).`);
      }

      valoraciones.forEach((valor, idx) => {
        if (valor === null) {
          erroresFila.push(`Primaria ${hoja} - Fila ${filaExcel}: falta la valoración ${idx + 1}.`);
          return;
        }
        if (isNaN(valor) || valor < 0 || valor > 3) {
          erroresFila.push(
            `Primaria ${hoja} - Fila ${filaExcel}: la valoración ${idx + 1} debe estar entre 0 y 3.`
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
      errores.push(`Primaria ${hoja}: no se encontraron estudiantes capturados en la hoja.`);
    }

    return { registros, errores };
  }

  private validarHojaSecundaria(xlsx: any, sheet: any, hoja: string): {
    registros: AlumnoValidado[];
    errores: string[];
  } {
    const errores: string[] = [];
    const registros: AlumnoValidado[] = [];
    const columnasValoraciones = this.columnasValoracionesSecundaria[hoja];

    if (!columnasValoraciones) {
      return {
        registros,
        errores: [`Secundaria ${hoja}: no se pudo determinar el rango de valoraciones.`]
      };
    }

    const datos = xlsx.utils.sheet_to_json(sheet, {
      range: 9,
      header: 'A',
      defval: ''
    }) as Array<Record<string, string>>;

    const filasIniciales = 10;

    datos.forEach((fila: Record<string, string>, indice: number) => {
      const erroresFila: string[] = [];
      const numeroLista = this.limpiarTexto(fila['B']);
      const nombre = this.limpiarTexto(fila['C']);
      const sexo = this.limpiarTexto(fila['D']).toUpperCase();
      const grupo = this.limpiarTexto(fila['E']).toUpperCase();

      const valoraciones = columnasValoraciones.map((col) => {
        const valor = this.limpiarTexto(fila[col]);
        return valor === '' ? null : Number(valor);
      });

      const filaExcel = filasIniciales + indice;
      const filaVacia =
        !numeroLista && !nombre && !sexo && !grupo && valoraciones.every((valor) => valor === null);
      if (filaVacia) {
        return;
      }

      if (!numeroLista) {
        erroresFila.push(`Secundaria ${hoja} - Fila ${filaExcel}: falta el número de lista.`);
      } else if (isNaN(Number(numeroLista))) {
        erroresFila.push(`Secundaria ${hoja} - Fila ${filaExcel}: el número de lista debe ser numérico.`);
      }

      if (!nombre) {
        erroresFila.push(`Secundaria ${hoja} - Fila ${filaExcel}: captura el nombre completo del estudiante.`);
      }

      if (!sexo) {
        erroresFila.push(`Secundaria ${hoja} - Fila ${filaExcel}: indica el sexo (H/M).`);
      } else if (sexo !== 'H' && sexo !== 'M') {
        erroresFila.push(`Secundaria ${hoja} - Fila ${filaExcel}: el sexo debe ser H o M.`);
      }

      if (!grupo) {
        erroresFila.push(`Secundaria ${hoja} - Fila ${filaExcel}: captura el grupo.`);
      } else if (!/^[A-Z]$/.test(grupo)) {
        erroresFila.push(`Secundaria ${hoja} - Fila ${filaExcel}: el grupo debe ser una sola letra (A-Z).`);
      }

      valoraciones.forEach((valor, idx) => {
        if (valor === null) {
          erroresFila.push(`Secundaria ${hoja} - Fila ${filaExcel}: falta la valoración ${idx + 1}.`);
          return;
        }
        if (isNaN(valor) || valor < 0 || valor > 3) {
          erroresFila.push(
            `Secundaria ${hoja} - Fila ${filaExcel}: la valoración ${idx + 1} debe estar entre 0 y 3.`
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
      errores.push(`Secundaria ${hoja}: no se encontraron estudiantes capturados en la hoja.`);
    }

    return { registros, errores };
  }

  private rangoColumnas(inicio: string, fin: string): string[] {
    const convertirNumero = (columna: string): number =>
      columna
        .toUpperCase()
        .split('')
        .reduce((acc, letra) => acc * 26 + (letra.charCodeAt(0) - 64), 0);
    const convertirColumna = (numero: number): string => {
      let resultado = '';
      let actual = numero;
      while (actual > 0) {
        const indice = (actual - 1) % 26;
        resultado = String.fromCharCode(65 + indice) + resultado;
        actual = Math.floor((actual - 1) / 26);
      }
      return resultado;
    };

    const inicioNumero = convertirNumero(inicio);
    const finNumero = convertirNumero(fin);
    const columnas: string[] = [];

    for (let i = inicioNumero; i <= finNumero; i += 1) {
      columnas.push(convertirColumna(i));
    }

    return columnas;
  }
}
