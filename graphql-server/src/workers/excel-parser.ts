import * as XLSX from 'xlsx';

export interface ParsedStudent {
  curp: string;
  nombre: string;
  grupo: string;
  evaluaciones: { materiaIndex: number; valor: number }[];
}

export interface SchoolMetadata {
  nivelDetectado: string;
  gradoDetectado: string;
  turno: string;
  nombreEscuela: string;
  correo: string;
}

export interface ParsedAssessmentData {
  cct: string;
  nivel: string;
  grado: number;
  alumnos: ParsedStudent[];
  metadata: SchoolMetadata;
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
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const errors: string[] = [];

  if (!workbook.SheetNames.includes('ESC')) {
    throw new Error('No se encontró la hoja obligatoria "ESC".');
  }

  const escSheet = workbook.Sheets.ESC;
  const escData = extractEscData(escSheet, errors);
  const nivel = detectLevel(workbook.SheetNames, escSheet);
  if (!nivel) {
    errors.push('No se pudo identificar el nivel educativo del archivo.');
  }

  const dataSheetName = findDataSheetName(workbook.SheetNames, nivel);
  if (!dataSheetName) {
    errors.push(
      'No se encontró la hoja de captura de evaluaciones (ej. PREESCOLAR, PRIMERO, SEGUNDO, TERCERO).'
    );
  }

  if (errors.length > 0) {
    throw new Error(errors.join(' | '));
  }

  const sheetData = workbook.Sheets[dataSheetName!];
  const grado = detectGrade(dataSheetName!, nivel!);
  const alumnos = extractStudents(sheetData, dataSheetName!, nivel!, escData.cct, grado, errors);

  if (!alumnos.length) {
    errors.push(`No se encontraron estudiantes capturados en la hoja ${dataSheetName}.`);
  }

  if (errors.length > 0) {
    throw new Error(errors.join(' | '));
  }

  return {
    cct: escData.cct,
    nivel: nivel!,
    grado,
    alumnos,
    metadata: {
      nivelDetectado: nivel!,
      gradoDetectado: dataSheetName!.toUpperCase(),
      turno: escData.turno,
      nombreEscuela: escData.nombreEscuela,
      correo: escData.correo,
    },
  };
}

function extractEscData(sheet: XLSX.WorkSheet, errors: string[]) {
  const cct = firstNonEmptyCell(sheet, ['D9', 'E9', 'C9']);
  const turno = firstNonEmptyCell(sheet, ['D11', 'E11']).toUpperCase();
  const nombreEscuela = firstNonEmptyCell(sheet, ['D13', 'E13']);
  const correo = firstNonEmptyCell(sheet, ['D18', 'E18']).toLowerCase();

  if (!cct) {
    errors.push('La CCT no está capturada en la hoja ESC.');
  } else if (!/^[0-9]{2}[A-Z]{3}[0-9]{4}[A-Z]$/.test(cct)) {
    errors.push(`La CCT "${cct}" tiene un formato inválido.`);
  }

  if (!turno) {
    errors.push('Selecciona un turno válido en la hoja ESC.');
  } else if (!TURNOS_VALIDOS.has(turno)) {
    errors.push('El turno capturado no coincide con las opciones de la plantilla.');
  }

  if (!nombreEscuela) {
    errors.push('Ingresa el nombre de la escuela en la hoja ESC.');
  }

  if (!correo) {
    errors.push('Ingresa el correo de contacto en la hoja ESC.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    errors.push('El correo de contacto no tiene un formato válido.');
  }

  return { cct, turno, nombreEscuela, correo };
}

function detectLevel(sheetNames: string[], escSheet: XLSX.WorkSheet): string | null {
  const possibleCells = ['B6', 'C6', 'D6', 'B5', 'C5', 'D5'];
  for (const cell of possibleCells) {
    const val = normalizeCellValue(escSheet[cell]?.v).toUpperCase();
    if (['PREESCOLAR', 'PRIMARIA', 'SECUNDARIA', 'TELESECUNDARIA'].includes(val)) {
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

function findDataSheetName(sheetNames: string[], nivel: string | null): string | undefined {
  const normalizedMap = new Map(sheetNames.map((name) => [name.toUpperCase(), name]));
  if (nivel === 'PREESCOLAR')
    return normalizedMap.get('TERCERO') || normalizedMap.get('PREESCOLAR');
  if (nivel === 'PRIMARIA') {
    return ['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO', 'SEXTO']
      .map((name) => normalizedMap.get(name))
      .find(Boolean);
  }
  if (nivel === 'SECUNDARIA' || nivel === 'TELESECUNDARIA') {
    return ['PRIMERO', 'SEGUNDO', 'TERCERO'].map((name) => normalizedMap.get(name)).find(Boolean);
  }
  return undefined;
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
  errors: string[]
): ParsedStudent[] {
  const data = XLSX.utils.sheet_to_json(sheet, { range: 9, header: 'A', defval: '' }) as Array<
    Record<string, string>
  >;
  const columnas = resolveEvaluationColumns(nivel, sheetName.toUpperCase());
  if (!columnas.length) {
    errors.push(`No se pudo determinar el rango de valoraciones para la hoja ${sheetName}.`);
    return [];
  }

  const alumnos: ParsedStudent[] = [];
  data.forEach((row, index) => {
    const numeroLista = cleanText(row.B);
    const nombre = cleanText(row.C);
    const sexo = cleanText(row.D).toUpperCase();
    const grupo = cleanText(row.E).toUpperCase();
    const filaExcel = 10 + index;
    const valoraciones = columnas.map((col) => {
      const raw = cleanText(row[col]);
      return raw === '' ? null : Number(raw);
    });
    const filaVacia =
      !numeroLista && !nombre && !sexo && !grupo && valoraciones.every((valor) => valor === null);
    if (filaVacia) return;

    const erroresFila: string[] = [];
    if (!numeroLista)
      erroresFila.push(`Fila ${filaExcel} (${sheetName}): falta el número de lista.`);
    else if (Number.isNaN(Number(numeroLista)))
      erroresFila.push(`Fila ${filaExcel} (${sheetName}): el número de lista debe ser numérico.`);

    if (!nombre)
      erroresFila.push(
        `Fila ${filaExcel} (${sheetName}): captura el nombre completo del estudiante.`
      );
    if (!sexo) erroresFila.push(`Fila ${filaExcel} (${sheetName}): indica el sexo (H/M).`);
    else if (!['H', 'M'].includes(sexo))
      erroresFila.push(`Fila ${filaExcel} (${sheetName}): el sexo debe ser H o M.`);

    if (!grupo) erroresFila.push(`Fila ${filaExcel} (${sheetName}): captura el grupo.`);
    else if (!/^[A-Z]$/.test(grupo))
      erroresFila.push(`Fila ${filaExcel} (${sheetName}): el grupo debe ser una sola letra (A-Z).`);

    const evaluaciones: { materiaIndex: number; valor: number }[] = [];
    valoraciones.forEach((valor, idx) => {
      if (valor === null) {
        erroresFila.push(`Fila ${filaExcel} (${sheetName}): falta la valoración ${idx + 1}.`);
        return;
      }
      if (Number.isNaN(valor) || valor < 0 || valor > 3) {
        erroresFila.push(
          `Fila ${filaExcel} (${sheetName}): la valoración ${idx + 1} debe estar entre 0 y 3.`
        );
        return;
      }
      evaluaciones.push({ materiaIndex: idx, valor });
    });

    if (erroresFila.length > 0) {
      errors.push(...erroresFila);
      return;
    }

    alumnos.push({
      curp: buildSyntheticCurp(cct, grado, grupo, Number(numeroLista), nombre),
      nombre,
      grupo,
      evaluaciones,
    });
  });

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
