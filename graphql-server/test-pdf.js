import { comprobantePdfService } from './dist/services/comprobante-pdf.service.js';

async function testPdf() {
    console.log('--- Iniciando prueba de generación de PDF (JS) ---');
    try {
        const base64 = await comprobantePdfService.generarBase64({
            consecutivo: '999',
            fechaCarga: new Date(),
            archivoOriginal: 'test_EIA.xlsx',
            hashArchivo: 'f57bd2dd65022e37920f666750005d5c64c7ad3a8bb65715a31a986230f8812c',
            cct: '09DPR0001X',
            email: 'test@docente.mx'
        });

        const binary = Buffer.from(base64, 'base64');
        const header = binary.slice(0, 4).toString();
        
        console.log('Primeros 4 bytes:', header);
        if (header === '%PDF') {
            console.log('✅ ÉXITO: El archivo generado es un PDF válido.');
        } else {
            console.error('❌ ERROR: El archivo NO empieza con %PDF.');
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ ERROR DURANTE LA PRUEBA:', err);
        process.exit(1);
    }
}

testPdf();
