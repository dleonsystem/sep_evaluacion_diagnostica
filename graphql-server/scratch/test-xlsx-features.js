import XLSX from 'xlsx';

// Create a workbook with formula and link
const wb = XLSX.utils.book_new();
const ws_data = [
  ["S1", "S2", "S3"],
  [1, 2, "=A2+B2"], // Formula in C2
  [4, 5, { t: 'n', v: 6, l: { Target: 'http://google.com' } }] // Link in C3
];
const ws = XLSX.utils.aoa_to_sheet(ws_data);
XLSX.utils.book_append_sheet(wb, ws, "Test");

// Accessing raw cell
ws['C2'] = { t: 'n', v: 3, f: 'A2+B2' };
const c2 = ws['C2'];
console.log('C2 cell:', c2);
console.log('C2 has formula:', !!c2.f);

const c3 = ws['C3'];
console.log('C3 cell:', c3);
console.log('C3 has link:', !!c3.l);

// Test extra columns
const row = { A: '1', B: 'Juan', F: '3', G: '2', Z: 'Extra' };
const expectedCols = ['F', 'G'];
const extraCols = Object.keys(row).filter(key => {
  if (key.length === 1 && key >= 'A' && key <= 'E') return false; // Metadata
  if (expectedCols.includes(key)) return false; // Valid evaluations
  return true;
});
console.log('Detected extra cols:', extraCols);

// Test decimals
const val1 = 1.5;
const val2 = 3;
console.log('Is 1.5 integer?', Number.isInteger(val1));
console.log('Is 3 integer?', Number.isInteger(val2));
