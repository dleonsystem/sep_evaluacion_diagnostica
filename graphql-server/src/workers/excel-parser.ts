import * as XLSX from 'xlsx';

export interface ParsedStudent {
  curp: string;
  nombre: string;
  grupo: string;
  grado: number;
  evaluaciones: { materiaIndex: number; valor: number }[];
}

export interface SchoolMetadata {
  nivelDetectado: string;
  gradoDetectado: string;
  turno: string;
  nombreEscuela: string;
  correo: string;
}

export interface ExcelValidationError {
  fila?: number;
  columna?: string;
  campo?: string;
  error: string;
  valorEncontrado?: string;
  valorEsperado?: string;
  hoja?: string;
}

export interface ParsedAssessmentData {
  cct: string;
  nivel: string;
  grado: number;
  alumnos: ParsedStudent[];
  metadata: SchoolMetadata;
  erroresEstructurados?: ExcelValidationError[];
}

const TURNOS_VALIDOS = new Set([
  'MATUTINO',
  'VESPERTINO',
  'NOCTURNO',
  'DISCONTINUO',
  'TIEMPO COMPLETO',
  'JORNADA AMPLIADA',
]);

const COLUMNAS_PREESCOLAR = buildColumnRange('F', 'P');
const COLUMNAS_PRIMARIA: Record<string, string[]> = {
  PRIMERO: buildColumnRange('F', 'O'),
  SEGUNDO: buildColumnRange('F', 'O'),
  TERCERO: buildColumnRange('F', 'AE'),
  CUARTO: buildColumnRange('F', 'AE'),
  QUINTO: buildColumnRange('F', 'AD'),
  SEXTO: buildColumnRange('F', 'AD'),
};
const COLUMNAS_SECUNDARIA: Record<string, string[]> = {
  PRIMERO: buildColumnRange('F', 'Z'),
  SEGUNDO: buildColumnRange('F', 'Z'),
  TERCERO: buildColumnRange('F', 'Y'),
};

export function parseExcelAssessmentBuffer(buffer: Buffer): ParsedAssessmentData {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || '';
    let friendlyError = 'El archivo está dañado o no es un formato Excel válido.';
    if (
      errorMsg.includes('password') ||
      errorMsg.includes('decrypt') ||
      errorMsg.includes('encrypted') ||
      errorMsg.includes('secure')
    ) {
      friendlyError =
        'El archivo está protegido con contraseña o encriptado. Por favor, quita la protección antes de subirlo.';
    }
    return {
      cct: '',
      nivel: '',
      grado: 0,
      alumnos: [],
      metadata: {} as any,
      erroresEstructurados: [{ error: friendlyError, hoja: 'General' }],
    };
  }

  const allErrors: ExcelValidationError[] = [];

  if (!workbook.SheetNames.includes('ESC')) {
    allErrors.push({ error: 'No se encontró la hoja obligatoria "ESC".', hoja: 'General' });
    return {
      cct: '',
      nivel: '',
      grado: 0,
      alumnos: [],
      metadata: {} as any,
      erroresEstructurados: allErrors,
    };
  }

  const escSheet = workbook.Sheets.ESC;
  const escData = extractEscData(escSheet, allErrors);
  const nivel = detectLevel(workbook.SheetNames, escSheet);

  if (!nivel) {
    allErrors.push({
      error: 'No se pudo identificar el nivel educativo del archivo.',
      hoja: 'General',
    });
  }

  const dataSheetNames = findAllDataSheetNames(workbook.SheetNames, nivel, allErrors);
  if (nivel && dataSheetNames.length === 0) {
    allErrors.push({
      error:
        'No se encontró la hoja de captura de evaluaciones (ej. PREESCOLAR, PRIMERO, SEGUNDO, TERCERO).',
      hoja: 'General',
    });
  }

  if (allErrors.some((e) => ['CCT', 'Turno', 'Email'].includes(e.campo || ''))) {
    // No continuamos si hay errores críticos en ESC
  } else if (nivel) {
    const candidateSheets = dataSheetNames;
    const alumnos: ParsedStudent[] = [];
    let primerGradoDetectado = 0;

    for (const sheetName of candidateSheets) {
      const sheetData = workbook.Sheets[sheetName];
      const grado = detectGrade(sheetName, nivel);
      const alumnosHoja = extractStudents(sheetData, sheetName, nivel, escData.cct, grado, allErrors);
      if (alumnosHoja.length > 0) {
        if (!primerGradoDetectado) primerGradoDetectado = grado;
        alumnos.push(...alumnosHoja);
      }
    }

    if (!alumnos.length && !allErrors.length) {
      allErrors.push({
        error: 'El archivo no contiene ningún registro de evaluación válido para procesar.',
        hoja: 'General',
      });
    }

    return {
      cct: escData.cct,
      nivel: nivel,
      grado: primerGradoDetectado || 0,
      alumnos,
      metadata: {
        nivelDetectado: nivel,
        gradoDetectado: nivel,
        turno: escData.turno,
        nombreEscuela: escData.nombreEscuela,
        correo: escData.correo,
      },
      erroresEstructurados: allErrors,
    };
  }

  return {
    cct: escData.cct || '',
    nivel: nivel || '',
    grado: 0,
    alumnos: [],
    metadata: {
      nivelDetectado: nivel || '',
      gradoDetectado: '',
      turno: escData.turno || '',
      nombreEscuela: escData.nombreEscuela || '',
      correo: escData.correo || '',
    },
    erroresEstructurados: allErrors,
  };
}

function extractEscData(sheet: XLSX.WorkSheet, errors: ExcelValidationError[]) {
  const cct = firstNonEmptyCell(sheet, ['D9', 'E9', 'C9']);
  const turno = firstNonEmptyCell(sheet, ['D11', 'E11']).toUpperCase();
  const nombreEscuela = firstNonEmptyCell(sheet, ['D13', 'E13']);
  const correo = firstNonEmptyCell(sheet, ['D18', 'E18']).toLowerCase();

  if (!cct) {
    errors.push({
      campo: 'CCT',
      error: 'La CCT no está capturada en la hoja ESC.',
      hoja: 'ESC',
      columna: 'D',
      fila: 9,
    });
  } else if (!/^[0-9]{2}[A-Z]{3}[0-9]{4}[0-9A-Z]$/.test(cct)) {
    errors.push({
      campo: 'CCT',
      error: `La CCT "${cct}" tiene un formato inválido.`,
      hoja: 'ESC',
      columna: 'D',
      fila: 9,
      valorEncontrado: cct,
    });
  }

  if (!turno) {
    errors.push({
      campo: 'Turno',
      error: 'Selecciona un turno válido en la hoja ESC.',
      hoja: 'ESC',
      columna: 'D',
      fila: 11,
    });
  } else if (!TURNOS_VALIDOS.has(turno)) {
    errors.push({
      campo: 'Turno',
      error: 'El turno capturado no coincide con las opciones de la plantilla.',
      hoja: 'ESC',
      columna: 'D',
      fila: 11,
      valorEncontrado: turno,
    });
  }

    // Se omite el error obligatorio para Nombre Escuela ya que se puede recuperar vía CCT (Issue #385)

  if (!correo) {
    errors.push({
      campo: 'Email',
      error: 'Ingresa el correo de contacto en la hoja ESC.',
      hoja: 'ESC',
      columna: 'D',
      fila: 18,
    });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    errors.push({
      campo: 'Email',
      error: 'El correo de contacto no tiene un formato válido.',
      hoja: 'ESC',
      columna: 'D',
      fila: 18,
      valorEncontrado: correo,
    });
  }

  return { cct, turno, nombreEscuela, correo };
}

function detectLevel(sheetNames: string[], escSheet: XLSX.WorkSheet): string | null {
  const possibleCells = ['B6', 'C6', 'D6', 'B5', 'C5', 'D5'];
  for (const cell of possibleCells) {
    const val = normalizeCellValue(escSheet[cell]?.v).toUpperCase();
    if (
      [
        'PREESCOLAR',
        'PRIMARIA',
        'SECUNDARIA',
        'TELESECUNDARIA',
        'INICIAL GENERAL',
        'INICIAL_GENERAL',
      ].includes(val)
    ) {
      return val;
    }
  }

  const normalized = sheetNames.map((name) => name.toUpperCase());
  if (normalized.includes('PREESCOLAR')) return 'PREESCOLAR';

  // Fallback: Si solo está la hoja TERCERO y no hay PRIMERO, es Preescolar
  if (normalized.includes('TERCERO') && !normalized.includes('PRIMERO')) return 'PREESCOLAR';

  const primariaSheets = ['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO', 'SEXTO'];
  if (primariaSheets.every((sheet) => normalized.includes(sheet))) return 'PRIMARIA';
  if (['PRIMERO', 'SEGUNDO', 'TERCERO'].every((sheet) => normalized.includes(sheet)))
    return 'SECUNDARIA';
  return null;
}

function findAllDataSheetNames(sheetNames: string[], nivel: string | null, errors: ExcelValidationError[]): string[] {
  const normalizedMap = new Map(sheetNames.map((name) => [name.toUpperCase(), name]));
  const sheets: string[] = [];

  if (nivel === 'PREESCOLAR') {
    const required = ['TERCERO'];
    required.forEach(name => {
      const s = normalizedMap.get(name);
      if (s) sheets.push(s);
      else errors.push({ error: `Falta la hoja requerida: ${name}`, hoja: 'General' });
    });
  } else if (nivel === 'PRIMARIA') {
    const required = ['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO', 'SEXTO'];
    required.forEach((name) => {
      const s = normalizedMap.get(name);
      if (s) sheets.push(s);
      else errors.push({ error: `Falta la hoja requerida: ${name}`, hoja: 'General' });
    });
  } else if (nivel === 'SECUNDARIA' || nivel === 'TELESECUNDARIA') {
    const required = ['PRIMERO', 'SEGUNDO', 'TERCERO'];
    required.forEach((name) => {
      const s = normalizedMap.get(name);
      if (s) sheets.push(s);
      else errors.push({ error: `Falta la hoja requerida: ${name}`, hoja: 'General' });
    });
  }
  return sheets;
}

function detectGrade(sheetName: string, nivel: string): number {
  const gradeText = sheetName.toUpperCase();
  const gradoMap: Record<string, number> = {
    PREESCOLAR: 3,
    PRIMERO: 1,
    SEGUNDO: 2,
    TERCERO: 3,
    CUARTO: 4,
    QUINTO: 5,
    SEXTO: 6,
  };
  const found = Object.keys(gradoMap).find((key) => gradeText.includes(key));
  if (found) return gradoMap[found];
  return nivel === 'PREESCOLAR' ? 3 : 1;
}

function extractStudents(
  sheet: XLSX.WorkSheet,
  sheetName: string,
  nivel: string,
  cct: string,
  grado: number,
  errors: ExcelValidationError[]
): ParsedStudent[] {
  const data = XLSX.utils.sheet_to_json(sheet, { range: 9, header: 'A', blankrows: true, raw: false });
  const columnas = resolveEvaluationColumns(nivel, sheetName.toUpperCase());
  if (!columnas.length) {
    errors.push({
      error: `No se pudo determinar el rango de valoraciones para la hoja ${sheetName}.`,
      hoja: sheetName,
    });
    return [];
  }

  const alumnos: ParsedStudent[] = [];
  let index = -1;

  for (const row of data as any[]) {
    index++;
    const filaExcel = 10 + index;

    const allowedCols = ['A', 'B', 'C', 'D', 'E', ...columnas];
    const erroresFila: ExcelValidationError[] = [];

    // 1. Detección de columnas extra a la derecha (Sanitización #385)
    const extraCols = Object.keys(row).filter((k) => !allowedCols.includes(k));
    if (extraCols.length > 0) {
      erroresFila.push({
        fila: filaExcel,
        error: `Se detectaron datos en columnas no autorizadas: ${extraCols.join(', ')}.`,
        hoja: sheetName,
      });
    }

    // 2. Extraer y limpiar valoraciones con validación de sanitización
    const valoraciones = columnas.map((col, idx) => {
      const cellAddress = col + filaExcel;
      const cell = sheet[cellAddress];

      // Detección de errores de Excel (#REF!, ###, etc.)
      if (cell?.t === 'e') {
        erroresFila.push({
          fila: filaExcel,
          columna: col,
          campo: `Valoración ${idx + 1}`,
          error: `La celda contiene un error de Excel (${cell.v}).`,
          hoja: sheetName,
        });
      }

      // Detección de fórmulas y links
      if (cell?.f) {
        erroresFila.push({
          fila: filaExcel,
          columna: col,
          campo: `Valoración ${idx + 1}`,
          error: 'La celda contiene una fórmula. Solo se permiten valores directos.',
          hoja: sheetName,
        });
      }
      if (cell?.l) {
        erroresFila.push({
          fila: filaExcel,
          columna: col,
          campo: `Valoración ${idx + 1}`,
          error: 'La celda contiene un hipervínculo. Por seguridad, no están permitidos.',
          hoja: sheetName,
        });
      }

      const val = row[col];
      if (val === undefined || val === null || String(val).trim() === '') {
        return null;
      }
      const parsed = Number(val);

      // Detección de puntos decimales
      if (!Number.isInteger(parsed)) {
        erroresFila.push({
          fila: filaExcel,
          columna: col,
          campo: `Valoración ${idx + 1}`,
          error: 'La valoración no debe contener puntos decimales.',
          hoja: sheetName,
          valorEncontrado: String(val),
        });
      }

      return Number.isNaN(parsed) ? null : parsed;
    });

    // 3. Regla de Negocio Issue #384: Si todas las valoraciones son nulas y NO hay errores de sanitización, omitir fila
    if (valoraciones.every((v) => v === null) && erroresFila.length === 0) {
      continue;
    }

    const numeroLista = cleanText(row.B);
    const nombre = cleanText(row.C);

    // Validación de error de Excel en Nombre o Grupo e Hipervínculos
    const nameCell = sheet['C' + filaExcel];
    if (nameCell?.t === 'e' || sheet['E' + filaExcel]?.t === 'e') {
      erroresFila.push({
        fila: filaExcel,
        error: 'Se detectaron errores de Excel (#REF!, #VALUE!) en las columnas de Nombre o Grupo.',
        hoja: sheetName,
      });
    }
    if (nameCell?.l) {
      erroresFila.push({
        fila: filaExcel,
        columna: 'C',
        campo: 'Nombre',
        error: 'El nombre del estudiante contiene un hipervínculo. Por seguridad, no están permitidos.',
        hoja: sheetName,
      });
    }

    const sexo = cleanText(row.D).toUpperCase();
    const grupo = cleanText(row.E).toUpperCase();

    const filaVacia = !numeroLista && !nombre && !sexo && !grupo;
    if (filaVacia && erroresFila.length === 0) continue;

    // Se omite la validación numérica estricta para el número de lista por flexibilidad (Issue #385)

    if (nombre && !/^[A-ZÑÁÉÍÓÚÜü\s.]+$/i.test(nombre))
      erroresFila.push({
        fila: filaExcel,
        columna: 'C',
        campo: 'Nombre',
        error: 'El nombre contiene caracteres no permitidos (solo letras, espacios y puntos).',
        hoja: sheetName,
        valorEncontrado: nombre,
      });
    if (sexo && !['H', 'M'].includes(sexo))
      erroresFila.push({
        fila: filaExcel,
        columna: 'D',
        campo: 'Sexo',
        error: 'El sexo debe ser H o M.',
        hoja: sheetName,
        valorEncontrado: sexo,
        valorEsperado: 'H/M',
      });

    if (!grupo)
      erroresFila.push({
        fila: filaExcel,
        columna: 'E',
        campo: 'Grupo',
        error: 'Captura el grupo.',
        hoja: sheetName,
      });
    else if (String(row.E).includes('.')) {
      erroresFila.push({
        fila: filaExcel,
        columna: 'E',
        campo: 'Grupo',
        error: 'El grupo no debe contener puntos decimales (ej. solo "1" o "A", no "1.00").',
        hoja: sheetName,
        valorEncontrado: String(row.E),
      });
    } else if (!/^[a-zA-Z0-9\s]+$/.test(grupo))
      erroresFila.push({
        fila: filaExcel,
        columna: 'E',
        campo: 'Grupo',
        error: 'El grupo solo debe contener letras y números. No se permiten comillas ni caracteres especiales.',
        hoja: sheetName,
        valorEncontrado: grupo,
      });

    const evaluaciones: { materiaIndex: number; valor: number }[] = [];

    valoraciones.forEach((valor, idx) => {
      const colName = columnas[idx];
      if (valor === null) {
        // Solo reportar falta de valoración si NO es una fila vacía y NO hubo error de sanitización en esa celda
        if (!erroresFila.some((e) => e.columna === colName)) {
          erroresFila.push({
            fila: filaExcel,
            columna: colName,
            campo: `Valoración ${idx + 1}`,
            error: 'Falta la valoración.',
            hoja: sheetName,
          });
        }
        return;
      }
      if (valor < 0 || valor > 3) {
        erroresFila.push({
          fila: filaExcel,
          columna: colName,
          campo: `Valoración ${idx + 1}`,
          error: 'La valoración debe estar entre 0 y 3.',
          hoja: sheetName,
          valorEncontrado: String(valor),
          valorEsperado: '0-3',
        });
        return;
      }
      evaluaciones.push({ materiaIndex: idx, valor });
    });

    if (erroresFila.length > 0) {
      errors.push(...erroresFila);
      continue;
    }

    alumnos.push({
      curp: buildSyntheticCurp(cct, grado, grupo, Number(numeroLista), nombre),
      nombre,
      grupo,
      grado,
      evaluaciones,
    });
  }


  return alumnos;
}

function resolveEvaluationColumns(nivel: string, sheetName: string): string[] {
  if (nivel === 'PREESCOLAR') return COLUMNAS_PREESCOLAR;
  if (nivel === 'PRIMARIA') return COLUMNAS_PRIMARIA[sheetName] || [];
  if (nivel === 'SECUNDARIA' || nivel === 'TELESECUNDARIA')
    return COLUMNAS_SECUNDARIA[sheetName] || [];
  return [];
}

function buildSyntheticCurp(
  cct: string,
  grado: number,
  grupo: string,
  numeroLista: number,
  nombre: string
): string {
  const normalizedName = nombre
    .normalize('NFD')
    .replace(/[^\w\s]/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();
  return `${cct}${grado}${grupo}${String(numeroLista).padStart(2, '0')}${normalizedName}`.slice(
    0,
    18
  );
}

function firstNonEmptyCell(sheet: XLSX.WorkSheet, addresses: string[]): string {
  for (const address of addresses) {
    const value = normalizeCellValue(sheet[address]?.v);
    if (value) return value;
  }
  return '';
}

function cleanText(value: unknown): string {
  return normalizeCellValue(value);
}

function normalizeCellValue(value: unknown): string {
  return value == null ? '' : String(value).trim().replace(/\s+/g, ' ');
}

function buildColumnRange(start: string, end: string): string[] {
  const cols: string[] = [];
  const startCode = XLSX.utils.decode_col(start);
  const endCode = XLSX.utils.decode_col(end);
  for (let col = startCode; col <= endCode; col++) {
    cols.push(XLSX.utils.encode_col(col));
  }
  return cols;
}
