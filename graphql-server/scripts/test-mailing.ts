import dotenv from 'dotenv';
import { MailingService } from '../src/services/mailing.service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testMailing() {
  console.log('--- Iniciando Prueba de Correo ---');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  
  const recipient = 'jose_mx@hotmail.com';
  const mailingService = new MailingService();
  
  console.log(`Enviando correo de prueba a: ${recipient}...`);
  try {
    const success = await mailingService.sendPasswordRecovery(recipient, 'TEST-1234');
    if (success) {
      console.log('✅ ÉXITO: El correo se reportó como enviado.');
    } else {
      console.error('❌ ERROR: El servicio de correo reportó falla.');
    }
  } catch (error) {
    console.error('❌ EXCEPCIÓN:', error);
  }
}

testMailing();
