/**
 * Utility for validating Mexican CCT (Clave de Centro de Trabajo)
 * Following the algorithm in ProcedimientoElementoVerificador.md
 */

const TABLA_1: Record<string, string> = {
  A: '01',
  B: '02',
  C: '03',
  D: '04',
  E: '05',
  F: '06',
  G: '07',
  H: '08',
  I: '09',
  J: '10',
  K: '11',
  L: '12',
  M: '13',
  N: '14',
  O: '15',
  P: '16',
  Q: '17',
  R: '18',
  S: '19',
  T: '20',
  U: '21',
  V: '22',
  W: '23',
  X: '24',
  Y: '25',
  Z: '26',
};

const TABLA_2: string[] = [
  'A',
  'B',
  'C',
  'D',
  'E',
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
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  '0', // Adjusted: usually 0-25 are A-Z, if there's a 26th it might be 0 or something else. The doc stops at Z=25. 192%27 can range 0-26.
];
// Wait, Step (g) says divide by 27. Residuo can be 0 to 26.
// Tabla 2 in doc: A=00 ... Z=25. That's 26 values.
// If residuo is 26, what is it? Usually these algorithms use 0-9 as well or a specific char.
// Let's assume the doc covers 0-25. I'll add 'X' or '0' for 26 and check if I can find more info.
// Actually, many Mexican algorithms use 'X' or a digit for the 27th value.
// Re-reading: "Dividir entre 27". "El residuo... se convierte... de acuerdo con la Tabla 2".
// If Tabla 2 only goes to 25 (Z), there's a missing value for residuo 26.
// Let's check common SEP CCT verifier info. Often it's A-Z excluding I, O, Q? No, the doc has them.
// I'll stick to the doc and use a placeholder for 26, maybe it never happens or I should use '0'.

export function calculateCCTVerifier(cct9: string): string {
  if (cct9.length !== 9) return '';

  const expanded: number[] = [];
  for (let i = 0; i < 9; i++) {
    const char = cct9[i].toUpperCase();
    if (/[0-9]/.test(char)) {
      expanded.push(0, parseInt(char, 10));
    } else if (TABLA_1[char]) {
      const val = TABLA_1[char];
      expanded.push(parseInt(val[0], 10), parseInt(val[1], 10));
    } else {
      return ''; // Invalid character
    }
  }

  // expanded should have 18 digits now?
  // Wait, the example: 01DPR0001 -> 01 (2) + D (2) + P (2) + R (2) + 0001 (4) = 12 digits.
  // My expansion:
  // 0 -> 0, 0
  // 1 -> 0, 1
  // D -> 0, 4
  // P -> 1, 6
  // R -> 1, 8
  // 0 -> 0, 0
  // 0 -> 0, 0
  // 0 -> 0, 0
  // 1 -> 0, 1
  // Total: 18 digits? No, the example says:
  // Entidad 01 stays 01. (2 digits)
  // Clasificador D becomes 04. (2 digits)
  // Identificador 1 P becomes 16. (2 digits)
  // Identificador 2 R becomes 18. (2 digits)
  // Num Progr 0001 stays 0001. (4 digits)
  // Total 2+2+2+2+4 = 12 digits.

  const finalDigits: number[] = [];
  // Entidad (pos 1, 2)
  finalDigits.push(parseInt(cct9[0], 10), parseInt(cct9[1], 10));
  // Clasificador (pos 3)
  const c3 = TABLA_1[cct9[2].toUpperCase()] || '00';
  finalDigits.push(parseInt(c3[0], 10), parseInt(c3[1], 10));
  // Id1 (pos 4)
  const c4 = TABLA_1[cct9[3].toUpperCase()] || '00';
  finalDigits.push(parseInt(c4[0], 10), parseInt(c4[1], 10));
  // Id2 (pos 5)
  const c5 = TABLA_1[cct9[4].toUpperCase()] || '00';
  finalDigits.push(parseInt(c5[0], 10), parseInt(c5[1], 10));
  // Progr (pos 6, 7, 8, 9)
  finalDigits.push(
    parseInt(cct9[5], 10),
    parseInt(cct9[6], 10),
    parseInt(cct9[7], 10),
    parseInt(cct9[8], 10)
  );

  let sumNones = 0; // Pos 1, 3, 5, 7, 9, 11
  let sumPares = 0; // Pos 2, 4, 6, 8, 10, 12

  for (let i = 0; i < 12; i++) {
    if ((i + 1) % 2 !== 0) {
      sumNones += finalDigits[i];
    } else {
      sumPares += finalDigits[i];
    }
  }

  const total = sumNones * 7 + sumPares * 26;
  const residuo = total % 27;

  return TABLA_2[residuo] || '';
}

export function validateCCT(cct: string): { isValid: boolean; error?: string } {
  if (!cct) return { isValid: false, error: 'La CCT es requerida' };

  const cleanedCCT = cct.trim().toUpperCase();

  // Basic format check: 10 characters
  // Regex: 2 digits, 1 letter, 2 letters, 4 digits, 1 letter/digit
  // Actually, the example shows 01DPR0001D.
  // DDL said: ^[0-9]{2}[A-Z]{1}[A-Z0-9]{7}$
  if (!/^[0-9]{2}[A-Z]{3}[0-9]{4}[A-Z0-9]$/.test(cleanedCCT)) {
    return {
      isValid: false,
      error: 'Formato de CCT inválido. Debe ser de 10 caracteres (ej: 01DPR0001D)',
    };
  }

  const base = cleanedCCT.substring(0, 9);
  const verifierExpected = cleanedCCT[9];
  const verifierCalculated = calculateCCTVerifier(base);

  if (verifierCalculated !== verifierExpected) {
    return {
      isValid: false,
      error: `CCT inválida. El dígito verificador no coincide (esperado: ${verifierCalculated})`,
    };
  }

  return { isValid: true };
}
