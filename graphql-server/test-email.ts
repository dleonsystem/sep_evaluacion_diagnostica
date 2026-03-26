import dotenv from 'dotenv';
import { MailingService } from './src/services/mailing.service.js';

dotenv.config();

async function testMailing() {
  process.env.SMTP_TEST_MODE = 'true';
  process.env.SMTP_FROM_NAME = 'Test SiCRER';
  
  const mailingService = new MailingService();
  
  console.log('Iniciando prueba de MailingService...');
  
  const success = await mailingService.sendEmail(
    'usuario_prueba@ejemplo.com',
    'Prueba de Notificación SiCRER',
    '<h1>Hola Mundo</h1><p>Esta es una prueba del modo desatendido.</p>'
  );
  
  if (success) {
    console.log('\nPrueba completada con éxito.');
  } else {
    console.error('\nLa prueba falló.');
  }
}

testMailing().catch(console.error);
