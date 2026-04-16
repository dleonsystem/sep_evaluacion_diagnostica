import { Injectable } from '@angular/core';
import { GraphqlService } from './graphql.service';
import { firstValueFrom } from 'rxjs';

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
  nivel?: TipoArchivoCarga;
}

export type TipoArchivoCarga = 'preescolar' | 'primaria' | 'secundaria';

export interface ResultadoDeteccionNivel {
  nivel: TipoArchivoCarga | null;
  hojas: string[];
  mensajesError: string[];
}

@Injectable({ providedIn: 'root' })
export class ExcelValidationService {
  constructor(private readonly graphql: GraphqlService) { }
  private parsearErrorXlsx(error: any): string {
    const errorMsg = error?.message?.toLowerCase() || '';
    if (
      errorMsg.includes('password') ||
      errorMsg.includes('decrypt') ||
      errorMsg.includes('encrypted') ||
      errorMsg.includes('secure')
    ) {
      return 'El archivo está protegido con contraseña o encriptado. Por favor, quita la protección antes de subirlo.';
    }
    return 'El archivo está dañado o no es un formato Excel válido.';
  }
  private xlsxPromise: Promise<any> | null = null;
  // Hojas base (centralizadas para evitar duplicidad de nombres).
  private readonly hojasBase = {
    esc: 'ESC',
    instrucciones: 'INSTRUCCIONES',
    primero: 'PRIMERO',
    segundo: 'SEGUNDO',
    tercero: 'TERCERO',
    cuarto: 'CUARTO',
    quinto: 'QUINTO',
    sexto: 'SEXTO'
  };
  // Configuración por nivel (hojas requeridas por tipo de archivo).
  private readonly hojasPorNivel = {
    preescolar: [this.hojasBase.esc, this.hojasBase.instrucciones, this.hojasBase.tercero],
    primaria: [
      this.hojasBase.esc,
      this.hojasBase.instrucciones,
      this.hojasBase.primero,
      this.hojasBase.segundo,
      this.hojasBase.tercero,
      this.hojasBase.cuarto,
      this.hojasBase.quinto,
      this.hojasBase.sexto
    ],
    secundaria: [
      this.hojasBase.esc,
      this.hojasBase.instrucciones,
      this.hojasBase.primero,
      this.hojasBase.segundo,
      this.hojasBase.tercero
    ]
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
  private readonly encabezadosPrimariaBase = {
    B6: 'NÚM. DE LISTA',
    C6: 'NOMBRE DEL ESTUDIANTE (Primer Apellido - Segundo Apellido - Nombre)',
    D6: 'SEXO H: NIÑO - M: NIÑA',
    E6: 'GRUPO',
    F6: 'VALORACIÓN ASIGNADA SEGÚN LA RÚBRICA'
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
  private readonly columnasValoracionesPrimaria: Record<string, string[]> = {
    PRIMERO: this.rangoColumnas('F', 'O'),
    SEGUNDO: this.rangoColumnas('F', 'O'),
    TERCERO: this.rangoColumnas('F', 'AE'),
    CUARTO: this.rangoColumnas('F', 'AE'),
    QUINTO: this.rangoColumnas('F', 'AD'),
    SEXTO: this.rangoColumnas('F', 'AD')
  };
  private readonly encabezadosSecundariaBase = {
    B5: 'NÚM. DE LISTA',
    C5: 'NOMBRE DEL ESTUDIANTE (Primer Apellido - Segundo Apellido - Nombre)',
    D5: 'SEXO H: HOMBRE - M: MUJER',
    E5: 'GRUPO',
    F5: 'VALORACIÓN ASIGNADA SEGÚN LA RÚBRICA'
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
  private readonly columnasValoracionesSecundaria: Record<string, string[]> = {
    PRIMERO: this.rangoColumnas('F', 'Z'),
    SEGUNDO: this.rangoColumnas('F', 'Z'),
    TERCERO: this.rangoColumnas('F', 'Y')
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
  /**
   * Valida una CCT según el algoritmo oficial (Elemento Verificador)
   * @psp Algorithm - CCT Verification
   */
  public validarFormatoCCT(cct: string): { isValid: boolean; error?: string } {
    if (!cct) return { isValid: false, error: 'La CCT es requerida.' };

    const cleanCCT = cct.trim().toUpperCase();

    // Formato base: 10 caracteres
    if (cleanCCT.length !== 10) {
      return { isValid: false, error: 'La CCT debe tener exactamente 10 caracteres.' };
    }

    // Estructura: 2 dígitos, 3 letras, 4 dígitos, 1 caracter validador
    const regex = /^[0-9]{2}[A-Z]{3}[0-9]{4}[0-9A-Z]$/;
    if (!regex.test(cleanCCT)) {
      return { isValid: false, error: 'El formato de la CCT es incorrecto (ej: 01DPR0001D).' };
    }

    try {
      const base = cleanCCT.substring(0, 9);
      const digitVerificador = cleanCCT.substring(9, 10);

      const TABLA_1: Record<string, string> = {
        A: '01', B: '02', C: '03', D: '04', E: '05', F: '06', G: '07', H: '08', I: '09',
        J: '10', K: '11', L: '12', M: '13', N: '14', O: '15', P: '16', Q: '17', R: '18',
        S: '19', T: '20', U: '21', V: '22', W: '23', X: '24', Y: '25', Z: '26'
      };

      const finalDigits: number[] = [];
      // Entidad (pos 1, 2)
      finalDigits.push(parseInt(base[0], 10), parseInt(base[1], 10));
      // Alfabetización de Clasificador (pos 3, 4, 5)
      for (let i = 2; i < 5; i++) {
        const val = TABLA_1[base[i]];
        if (!val) throw new Error('Caracter no alfabetizable');
        finalDigits.push(parseInt(val[0], 10), parseInt(val[1], 10));
      }
      // Programa (pos 6, 7, 8, 9)
      finalDigits.push(parseInt(base[5], 10), parseInt(base[6], 10), parseInt(base[7], 10), parseInt(base[8], 10));

      // 12 dígitos en total
      let sumNones = 0; // Pos 1, 3, 5, 7, 9, 11 (O index 0, 2, 4...)
      let sumPares = 0; // Pos 2, 4, 6, 8, 10, 12 (O index 1, 3, 5...)

      for (let i = 0; i < 12; i++) {
        if ((i + 1) % 2 !== 0) {
          sumNones += finalDigits[i];
        } else {
          sumPares += finalDigits[i];
        }
      }

      // Algoritmo oficial: (Posiciones Pares * 7) + (Posiciones Nones * 26)
      const total = (sumPares * 7) + (sumNones * 26);
      const residuo = total % 27;

      const TABLA_2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0";
      const calculado = TABLA_2[residuo];

      if (digitVerificador !== calculado) {
        return {
          isValid: false,
          error: `CCT inválida. El dígito verificador no coincide (esperado: ${calculado})`
        };
      }

      return { isValid: true };
    } catch (e) {
      return { isValid: false, error: 'Error al procesar algoritmo CCT.' };
    }
  }

  /**
   * Verifica si la CCT existe en la base de datos
   */
  public async verificarCctEnBaseDeDatos(cct: string): Promise<boolean> {
    const QUERY = `
      query CheckCct($clave: String!) {
        getCCT(clave: $clave) {
          id
        }
      }
    `;
    try {
      const res = await firstValueFrom(this.graphql.execute<{ getCCT: any }>(QUERY, { clave: cct }));
      return !!res.data?.getCCT;
    } catch (error) {
      console.error('Error al verificar CCT', error);
      return false;
    }
  }

  async detectarTipoArchivo(buffer: ArrayBuffer): Promise<TipoArchivoCarga | null> {
    const resultado = await this.detectarNivelConDetalle(buffer);
    return resultado.nivel;
  }

  async detectarNivelConDetalle(buffer: ArrayBuffer): Promise<ResultadoDeteccionNivel> {
    const xlsx = await this.cargarXlsx();
    let workbook;
    try {
      workbook = xlsx.read(buffer, { type: 'array' });
    } catch (e: any) {
      return { nivel: null, hojas: [], mensajesError: [this.parsearErrorXlsx(e)] };
    }
    const hojas = workbook.SheetNames as string[];
    const hojasNormalizadas = this.normalizarHojas(hojas);
    const nivel = this.detectarNivel(hojasNormalizadas);
    if (!nivel) {
      return {
        nivel: null,
        hojas,
        mensajesError: this.construirMensajesNivelNoReconocido(hojasNormalizadas)
      };
    }
    return { nivel, hojas, mensajesError: [] };
  }

  async validarArchivo(buffer: ArrayBuffer): Promise<ResultadoValidacion> {
    const xlsx = await this.cargarXlsx();
    let workbook;
    try {
      workbook = xlsx.read(buffer, { type: 'array' });
    } catch (e: any) {
      return { ok: false, errores: [this.parsearErrorXlsx(e)], advertencias: [], hojasEncontradas: [] };
    }
    const hojas = workbook.SheetNames as string[];
    const hojasNormalizadas = this.normalizarHojas(hojas);
    const nivel = this.detectarNivel(hojasNormalizadas);

    if (!nivel) {
      return {
        ok: false,
        errores: this.construirMensajesNivelNoReconocido(hojasNormalizadas),
        advertencias: [],
        hojasEncontradas: hojas
      };
    }

    let resultado: ResultadoValidacion;
    switch (nivel) {
      case 'primaria':
        resultado = await this.validarPrimariaWorkbook(xlsx, workbook, hojas);
        break;
      case 'secundaria':
        resultado = await this.validarSecundariaWorkbook(xlsx, workbook, hojas);
        break;
      case 'preescolar':
      default:
        resultado = await this.validarPreescolarWorkbook(xlsx, workbook, hojas);
        break;
    }
    resultado.nivel = nivel;

    return resultado;
  }

  async validarPreescolar(buffer: ArrayBuffer): Promise<ResultadoValidacion> {
    const xlsx = await this.cargarXlsx();
    let workbook;
    try {
      workbook = xlsx.read(buffer, { type: 'array' });
    } catch (e: any) {
      return { ok: false, errores: [this.parsearErrorXlsx(e)], advertencias: [], hojasEncontradas: [] };
    }
    return await this.validarPreescolarWorkbook(xlsx, workbook, workbook.SheetNames as string[]);
  }

  private async validarPreescolarWorkbook(xlsx: any, workbook: any, hojas: string[]): Promise<ResultadoValidacion> {
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

    const esc = await this.validarEsc(escSheet);
    resultado.errores.push(...esc.errores);
    if (esc.advertencia) {
      resultado.advertencias.push(esc.advertencia);
    }

    const alumnos = this.validarHojaAlumnos(xlsx, terceroSheet, 'TERCERO');
    resultado.errores.push(...alumnos.errores);

    if (!resultado.errores.length) {
      if (alumnos.registros.length === 0) {
        resultado.ok = false;
        resultado.errores.push('El archivo no contiene ningún estudiante capturado en la hoja de grado de Preescolar.');
      } else {
        resultado.ok = true;
        resultado.esc = esc.datos!;
        resultado.alumnos = alumnos.registros;
      }
    }

    return resultado;
  }

  private async validarPrimariaWorkbook(xlsx: any, workbook: any, hojas: string[]): Promise<ResultadoValidacion> {
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

    const esc = await this.validarEsc(escSheet);
    resultado.errores.push(...esc.errores);
    if (esc.advertencia) {
      resultado.advertencias.push(esc.advertencia);
    }

    const alumnos = this.validarHojasPorNombre(xlsx, workbook, grados);
    resultado.errores.push(...alumnos.errores);

    if (!resultado.errores.length) {
      if (alumnos.registros.length === 0) {
        resultado.ok = false;
        resultado.errores.push('El archivo no contiene ningún estudiante capturado en las hojas de grado de Primaria.');
      } else {
        resultado.ok = true;
        resultado.esc = esc.datos!;
        resultado.alumnos = alumnos.registros;
      }
    }

    return resultado;
  }

  private async validarSecundariaWorkbook(xlsx: any, workbook: any, hojas: string[]): Promise<ResultadoValidacion> {
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

    const esc = await this.validarEsc(escSheet);
    resultado.errores.push(...esc.errores);
    if (esc.advertencia) {
      resultado.advertencias.push(esc.advertencia);
    }

    const alumnos = this.validarHojasPorNombre(xlsx, workbook, grados);
    resultado.errores.push(...alumnos.errores);

    if (!resultado.errores.length) {
      if (alumnos.registros.length === 0) {
        resultado.ok = false;
        resultado.errores.push('El archivo no contiene ningún registro de evaluación válido para procesar.');
      } else {
        resultado.ok = true;
        resultado.esc = esc.datos!;
        resultado.alumnos = alumnos.registros;
      }
    }

    return resultado;
  }

  async validarPrimaria(buffer: ArrayBuffer): Promise<ResultadoValidacion> {
    const xlsx = await this.cargarXlsx();
    let workbook;
    try {
      workbook = xlsx.read(buffer, { type: 'array' });
    } catch (e: any) {
      return { ok: false, errores: [this.parsearErrorXlsx(e)], advertencias: [], hojasEncontradas: [] };
    }
    const errores: string[] = [];
    const advertencias: string[] = [];
    const hojas = workbook.SheetNames as string[];
    const hojasNormalizadas = new Set(hojas.map((hoja: string) => this.normalizarHoja(hoja)));
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

    const esc = await this.validarEsc(escSheet);
    resultado.errores.push(...esc.errores.map((error) => `Primaria: ${error}`));
    if (esc.advertencia) {
      resultado.advertencias.push(`Primaria: ${esc.advertencia}`);
    }

    const alumnos: AlumnoValidado[] = [];

    hojasRequeridas
      .filter((hoja) => hoja !== this.hojasBase.esc && hoja !== this.hojasBase.instrucciones)
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
    let workbook;
    try {
      workbook = xlsx.read(buffer, { type: 'array' });
    } catch (e: any) {
      return { ok: false, errores: [this.parsearErrorXlsx(e)], advertencias: [], hojasEncontradas: [] };
    }
    const errores: string[] = [];
    const advertencias: string[] = [];
    const hojas = workbook.SheetNames as string[];
    const hojasNormalizadas = new Set(hojas.map((hoja: string) => this.normalizarHoja(hoja)));
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

    const esc = await this.validarEsc(escSheet);
    resultado.errores.push(...esc.errores.map((error) => `Secundaria: ${error}`));
    if (esc.advertencia) {
      resultado.advertencias.push(`Secundaria: ${esc.advertencia}`);
    }

    const alumnos: AlumnoValidado[] = [];

    hojasRequeridas
      .filter((hoja) => hoja !== this.hojasBase.esc && hoja !== this.hojasBase.instrucciones)
      .forEach((hoja) => {
        const hojaSheet = workbook.Sheets[hoja];
        if (!hojaSheet) {
          resultado.errores.push(`Secundaria: falta la hoja ${hoja} en el archivo.`);
          return;
        }

        // Se omite la validación de encabezados en secundaria por solicitud del usuario (Issue #381)
        // para dar mayor flexibilidad al formato visual, iniciando directamente en Fila 10.
        // resultado.errores.push(...this.validarEncabezadosSecundaria(hojaSheet, hoja));

        const resultadoHoja = this.validarHojaSecundaria(xlsx, hojaSheet, hoja);
        resultado.errores.push(...resultadoHoja.errores);
        alumnos.push(...resultadoHoja.registros);
      });

    if (!resultado.errores.length) {
      if (alumnos.length === 0) {
        resultado.ok = false;
        resultado.errores.push('El archivo no contiene ningún estudiante capturado en las hojas de grado de Secundaria.');
      } else {
        resultado.ok = true;
        resultado.esc = esc.datos!;
        resultado.alumnos = alumnos;
      }
    }

    return resultado;
  }

  private async validarEsc(sheet: any): Promise<{
    datos?: EscDatos;
    errores: string[];
    advertencia?: string;
  }> {
    const errores: string[] = [];

    const cct = this.primeraCeldaNoVacia(sheet, ['D9', 'E9', 'C9']);
    const turno = this.primeraCeldaNoVacia(sheet, ['D11', 'E11']);
    const nombreEscuela = this.primeraCeldaNoVacia(sheet, ['D13', 'E13']);
    const correo = this.primeraCeldaNoVacia(sheet, ['D18', 'E18']);

    if (!cct) {
      errores.push('Captura la CCT en la hoja ESC.');
    } else {
      const vFormat = this.validarFormatoCCT(cct);
      if (!vFormat.isValid) {
        errores.push(`CCT [${cct}]: ${vFormat.error!}`);
      } else {
        // Validación de existencia en DB (Opcional - Permitir nuevas escuelas si la CCT es válida)
        const existe = await this.verificarCctEnBaseDeDatos(cct);
        if (!existe) {
          // Si no existe, no bloqueamos la carga masiva (Issue #NuevaEscuela)
          // Solo informamos al usuario que se registrará automáticamente.
          return {
            datos: {
              cct: cct.trim(),
              turno: turno?.trim() ?? '',
              nombreEscuela: nombreEscuela?.trim() ?? '',
              correo: correo?.trim() ?? ''
            },
            errores,
            advertencia: `La CCT [${cct}] no está registrada actualmente. El sistema la dará de alta automáticamente con la información proporcionada en este archivo.`
          };
        }
      }
    }

    if (!turno) {
      errores.push('Selecciona un turno válido en la hoja ESC.');
    } else if (!this.turnosValidos.has(turno.toUpperCase().trim())) {
      errores.push(`El turno [${turno}] capturado no coincide con las opciones de la plantilla.`);
    }

    // Se omite el error obligatorio para Nombre Escuela ya que se puede recuperar vía CCT (Issue #385)

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
      advertencia: !sheet || !sheet['!ref']
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
      blankrows: true,
      defval: ''
    }) as Array<Record<string, string>>;

    const filasIniciales = 10; // la fila 10 en Excel es el primer registro

    const allowedCols = ['A', 'B', 'C', 'D', 'E', ...this.columnasValoraciones];

    datos.forEach((fila: Record<string, string>, indice: number) => {
      const erroresFila: string[] = [];

      const filaExcel = filasIniciales + indice;

      // 1. Detección de columnas extra a la derecha (Sanitización #385)
      const extraCols = Object.keys(fila).filter((k) => !allowedCols.includes(k) && fila[k] !== '');
      if (extraCols.length > 0) {
        erroresFila.push(
          `Fila ${filaExcel} (${nombreHoja}): se detectaron datos en columnas no autorizadas: ${extraCols.join(
            ', '
          )}.`
        );
      }

      const numeroLista = this.limpiarTexto(fila['B']);
      const nombre = this.limpiarTexto(fila['C']);
      const sexo = this.limpiarTexto(fila['D']).toUpperCase();
      const grupo = this.limpiarTexto(fila['E']).toUpperCase();

      const valoraciones = this.columnasValoraciones.map((col, idx) => {
        const cellAddress = col + filaExcel;
        const cell = sheet[cellAddress];

        if (cell?.t === 'e') {
          erroresFila.push(`Fila ${filaExcel} (${nombreHoja}): la valoración ${idx + 1} contiene un error de Excel.`);
        }

        // Detección de fórmulas y links (Sanitización #385)
        if (cell?.f) {
          erroresFila.push(`Fila ${filaExcel} (${nombreHoja}): la valoración ${idx + 1} contiene una fórmula.`);
        }
        if (cell?.l) {
          erroresFila.push(
            `Fila ${filaExcel} (${nombreHoja}): la valoración ${idx + 1} contiene un hipervínculo.`
          );
        }

        const valorRaw = this.limpiarTexto(fila[col]);
        if (valorRaw === '') return null;

        const valor = Number(valorRaw);

        // Detección de puntos decimales
        if (!Number.isInteger(valor)) {
          erroresFila.push(
            `Fila ${filaExcel} (${nombreHoja}): la valoración ${idx + 1} (${valorRaw}) no debe contener puntos decimales.`
          );
        }

        return valor;
      });

      // Regla de Negocio Issue #384: Si no hay ninguna valoración y NO hay errores de sanitización, omitir fila
      if (valoraciones.every((v) => v === null) && erroresFila.length === 0) {
        return;
      }

      const filaVacia = !numeroLista && !nombre && !sexo && !grupo;
      if (filaVacia && erroresFila.length === 0) {
        return;
      }

      // Se omite la validación numérica estricta para el número de lista por flexibilidad (Issue #385)

      if (nombre && !/^[A-ZÑÁÉÍÓÚÜü\s.]+$/i.test(nombre)) {
        erroresFila.push(`Fila ${filaExcel} (${nombreHoja}): el nombre contiene caracteres no permitidos.`);
      }

      if (sheet['C' + filaExcel]?.t === 'e' || sheet['E' + filaExcel]?.t === 'e') {
        erroresFila.push(`Fila ${filaExcel} (${nombreHoja}): se detectó un error de Excel en Nombre o Grupo.`);
      }

      if (sheet['C' + filaExcel]?.l) {
        erroresFila.push(`Fila ${filaExcel} (${nombreHoja}): el nombre del estudiante contiene un hipervínculo.`);
      }

      if (sexo && sexo !== 'H' && sexo !== 'M') {
        erroresFila.push(`Fila ${filaExcel} (${nombreHoja}): el sexo debe ser H o M.`);
      }

      if (!grupo) {
        erroresFila.push(`Fila ${filaExcel} (${nombreHoja}): captura el grupo.`);
      } else if (!/^[a-zA-Z0-9\s]+$/.test(grupo)) {
        erroresFila.push(`Fila ${filaExcel} (${nombreHoja}): el grupo solo debe contener letras y números. No se permiten comillas ni caracteres especiales.`);
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

    // Se elimina el error fatal por hoja vacía para permitir archivos con grados sin alumnos (Issue #381)
    // La validación de que el archivo tenga al menos un registro se hace a nivel de Workbook.

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

  private construirMensajesNivelNoReconocido(hojasNormalizadas: Set<string>): string[] {
    const hojas = Array.from(hojasNormalizadas);
    const hojasListado = hojas.length ? hojas.sort().join(', ') : 'ninguna';
    return [
      `No se pudo determinar el nivel con las hojas encontradas: ${hojasListado}.`,
      'Patrones esperados: Preescolar (ESC, INSTRUCCIONES, TERCERO); ' +
      'Primaria (ESC, INSTRUCCIONES, PRIMERO, SEGUNDO, TERCERO, CUARTO, QUINTO, SEXTO); ' +
      'Secundaria (ESC, INSTRUCCIONES, PRIMERO, SEGUNDO, TERCERO).'
    ];
  }

  private limpiarTexto(valor: any): string {
    if (valor === null || valor === undefined) return '';
    return valor.toString().replace(/\s+/g, ' ').trim();
  }

  private normalizarEncabezado(valor: string): string {
    return (valor ?? '')
      .toString()
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
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

  private validarHojaPrimaria(
    xlsx: any, sheet: any, hoja: string): {
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
      blankrows: true,
      defval: ''
    }) as Array<Record<string, string>>;

    const filasIniciales = 10;

    const allowedCols = ['A', 'B', 'C', 'D', 'E', ...columnasValoraciones];

    datos.forEach((fila: Record<string, string>, indice: number) => {
      const erroresFila: string[] = [];

      const filaExcel = filasIniciales + indice;

      // 1. Detección de columnas extra a la derecha (Sanitización #385)
      const extraCols = Object.keys(fila).filter((k) => !allowedCols.includes(k) && fila[k] !== '');
      if (extraCols.length > 0) {
        erroresFila.push(
          `Primaria ${hoja} - Fila ${filaExcel}: se detectaron datos en columnas no autorizadas: ${extraCols.join(
            ', '
          )}.`
        );
      }

      const numeroLista = this.limpiarTexto(fila['B']);
      const nombre = this.limpiarTexto(fila['C']);
      const sexo = this.limpiarTexto(fila['D']).toUpperCase();
      const grupo = this.limpiarTexto(fila['E']).toUpperCase();

      const valoraciones = columnasValoraciones.map((col, idx) => {
        const cellAddress = col + filaExcel;
        const cell = sheet[cellAddress];

        if (cell?.t === 'e') {
          erroresFila.push(`Primaria ${hoja} - Fila ${filaExcel}: la valoración ${idx + 1} contiene un error de Excel.`);
        }

        // Detección de fórmulas y links (Sanitización #385)
        if (cell?.f) {
          erroresFila.push(
            `Primaria ${hoja} - Fila ${filaExcel}: la valoración ${idx + 1} contiene una fórmula.`
          );
        }
        if (cell?.l) {
          erroresFila.push(
            `Primaria ${hoja} - Fila ${filaExcel}: la valoración ${idx + 1} contiene un hipervínculo.`
          );
        }

        const valorRaw = this.limpiarTexto(fila[col]);
        if (valorRaw === '') return null;

        const valor = Number(valorRaw);

        // Detección de puntos decimales
        if (!Number.isInteger(valor)) {
          erroresFila.push(
            `Primaria ${hoja} - Fila ${filaExcel}: la valoración ${idx + 1} (${valorRaw}) no debe contener puntos decimales.`
          );
        }

        return valor;
      });

      // Regla de Negocio Issue #384: Si no hay ninguna valoración y NO hay errores de sanitización, omitir fila
      if (valoraciones.every((valor) => valor === null) && erroresFila.length === 0) {
        return;
      }

      const filaVacia = !numeroLista && !nombre && !sexo && !grupo;
      if (filaVacia && erroresFila.length === 0) {
        return;
      }

      // Se omite la validación numérica estricta para el número de lista por flexibilidad (Issue #385)

      if (nombre && !/^[A-ZÑÁÉÍÓÚÜü\s.]+$/i.test(nombre)) {
        erroresFila.push(`Primaria ${hoja} - Fila ${filaExcel}: el nombre contiene caracteres no permitidos.`);
      }

      if (sheet['C' + filaExcel]?.t === 'e' || sheet['E' + filaExcel]?.t === 'e') {
        erroresFila.push(`Primaria ${hoja} - Fila ${filaExcel}: se detectó un error de Excel en Nombre o Grupo.`);
      }

      if (sheet['C' + filaExcel]?.l) {
        erroresFila.push(`Primaria ${hoja} - Fila ${filaExcel}: el nombre del estudiante contiene un hipervínculo.`);
      }

      if (sexo && sexo !== 'H' && sexo !== 'M') {
        erroresFila.push(`Primaria ${hoja} - Fila ${filaExcel}: el sexo debe ser H o M.`);
      }

      if (!grupo) {
        erroresFila.push(`Primaria ${hoja} - Fila ${filaExcel}: captura el grupo.`);
      } else if (!/^[a-zA-Z0-9\s]+$/.test(grupo)) {
        erroresFila.push(`Primaria ${hoja} - Fila ${filaExcel}: el grupo solo debe contener letras y números. No se permiten comillas ni caracteres especiales.`);
      }

      valoraciones.forEach((valor, idx) => {
        const colName = columnasValoraciones[idx];
        if (valor === null) {
          // Solo reportar falta de valoración si NO hubo error de sanitización en esa celda
          if (!erroresFila.some((e) => e.includes(`valoración ${idx + 1}`))) {
            erroresFila.push(`Primaria ${hoja} - Fila ${filaExcel}: falta la valoración ${idx + 1}.`);
          }
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

    // Comportamiento Issue #381: Hoja sin alumnos no es error fatal

    return { registros, errores };
  }

  private validarHojaSecundaria(
    xlsx: any,
    sheet: any,
    hoja: string
  ): {
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
      blankrows: true,
      defval: ''
    }) as Array<Record<string, string>>;

    const filasIniciales = 10;

    const allowedCols = ['A', 'B', 'C', 'D', 'E', ...columnasValoraciones];

    datos.forEach((fila: Record<string, string>, indice: number) => {
      const erroresFila: string[] = [];

      const filaExcel = filasIniciales + indice;

      // 1. Detección de columnas extra a la derecha (Sanitización #385)
      const extraCols = Object.keys(fila).filter((k) => !allowedCols.includes(k) && fila[k] !== '');
      if (extraCols.length > 0) {
        erroresFila.push(
          `Secundaria ${hoja} - Fila ${filaExcel}: se detectaron datos en columnas no autorizadas: ${extraCols.join(
            ', '
          )}.`
        );
      }

      const numeroLista = this.limpiarTexto(fila['B']);
      const nombre = this.limpiarTexto(fila['C']);
      const sexo = this.limpiarTexto(fila['D']).toUpperCase();
      const grupo = this.limpiarTexto(fila['E']).toUpperCase();

      const valoraciones = columnasValoraciones.map((col, idx) => {
        const cellAddress = col + filaExcel;
        const cell = sheet[cellAddress];

        if (cell?.t === 'e') {
          erroresFila.push(`Secundaria ${hoja} - Fila ${filaExcel}: la valoración ${idx + 1} contiene un error de Excel.`);
        }

        // Detección de fórmulas y links (Sanitización #385)
        if (cell?.f) {
          erroresFila.push(
            `Secundaria ${hoja} - Fila ${filaExcel}: la valoración ${idx + 1} contiene una fórmula.`
          );
        }
        if (cell?.l) {
          erroresFila.push(
            `Secundaria ${hoja} - Fila ${filaExcel}: la valoración ${idx + 1} contiene un hipervínculo.`
          );
        }

        const valorRaw = this.limpiarTexto(fila[col]);
        if (valorRaw === '') return null;

        const valor = Number(valorRaw);

        // Detección de puntos decimales
        if (!Number.isInteger(valor)) {
          erroresFila.push(
            `Secundaria ${hoja} - Fila ${filaExcel}: la valoración ${idx + 1} (${valorRaw}) no debe contener puntos decimales.`
          );
        }

        return valor;
      });

      // Regla de Negocio Issue #384: Si no hay ninguna valoración y NO hay errores de sanitización, omitir fila
      if (valoraciones.every((valor) => valor === null) && erroresFila.length === 0) {
        return;
      }

      const filaVacia = !numeroLista && !nombre && !sexo && !grupo;
      if (filaVacia && erroresFila.length === 0) {
        return;
      }

      // Se omite la validación numérica estricta para el número de lista por flexibilidad (Issue #385)

      if (nombre && !/^[A-ZÑÁÉÍÓÚÜü\s.]+$/i.test(nombre)) {
        erroresFila.push(`Secundaria ${hoja} - Fila ${filaExcel}: el nombre contiene caracteres no permitidos.`);
      }

      if (sheet['C' + filaExcel]?.t === 'e' || sheet['E' + filaExcel]?.t === 'e') {
        erroresFila.push(`Secundaria ${hoja} - Fila ${filaExcel}: se detectó un error de Excel en Nombre o Grupo.`);
      }

      if (sheet['C' + filaExcel]?.l) {
        erroresFila.push(`Secundaria ${hoja} - Fila ${filaExcel}: el nombre del estudiante contiene un hipervínculo.`);
      }

      if (sexo && sexo !== 'H' && sexo !== 'M') {
        erroresFila.push(`Secundaria ${hoja} - Fila ${filaExcel}: el sexo debe ser H o M.`);
      }

      if (!grupo) {
        erroresFila.push(`Secundaria ${hoja} - Fila ${filaExcel}: captura el grupo.`);
      } else if (!/^[a-zA-Z0-9\s]+$/.test(grupo)) {
        erroresFila.push(`Secundaria ${hoja} - Fila ${filaExcel}: el grupo solo debe contener letras y números. No se permiten comillas ni caracteres especiales.`);
      }

      valoraciones.forEach((valor, idx) => {
        const colName = columnasValoraciones[idx];
        if (valor === null) {
          // Solo reportar falta de valoración si NO hubo error de sanitización en esa celda
          if (!erroresFila.some((e) => e.includes(`valoración ${idx + 1}`))) {
            erroresFila.push(`Secundaria ${hoja} - Fila ${filaExcel}: falta la valoración ${idx + 1}.`);
          }
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

    // Comportamiento Issue #381: Hoja sin alumnos no es error fatal

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
