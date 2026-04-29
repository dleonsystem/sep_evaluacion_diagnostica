import imapsimple from 'imap-simple';
import { simpleParser } from 'mailparser';
import { logger } from '../utils/logger.js';
import { DistributionService } from './distribution.service.js';
import { SolicitudService } from './solicitud.service.js';
import fs from 'fs';
import path from 'path';

export class EmailWatcherService {
  private connection: imapsimple.ImapSimple | null = null;
  private isRunning: boolean = false;
  private solicitudService: SolicitudService;

  constructor(private distributionService: DistributionService) {
    this.solicitudService = new SolicitudService(distributionService.pool);
  }

  private getConfig() {
    return {
      imap: {
        user: process.env.IMAP_USER || '',
        password: process.env.IMAP_PASSWORD || '',
        host: process.env.IMAP_HOST || 'imap.gmail.com',
        port: parseInt(process.env.IMAP_PORT || '993'),
        tls: process.env.IMAP_TLS === 'true' || true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 3000,
      },
    };
  }

  public async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('Iniciando EmailWatcherService...');

    try {
      this.connection = await imapsimple.connect(this.getConfig());
      await this.connection.openBox('INBOX');

      logger.info('Conectado a INBOX. Esperando correos...');

      // Monitoreo periódico (Poll) o IDLE si el servidor lo soporta
      // Por simplicidad para este MVP, usaremos un intervalo de 1 minuto
      setInterval(() => {
        void this.checkNewEmails();
      }, 60000);

      // Primer chequeo inmediato
      await this.checkNewEmails();
    } catch (error: any) {
      logger.error('Error en EmailWatcherService al conectar o abrir INBOX:', {
        message: error.message,
        stack: error.stack,
      });
      this.isRunning = false;
    }
  }

  private async checkNewEmails() {
    if (!this.connection) return;

    try {
      const searchCriteria = ['UNSEEN'];
      const fetchOptions = {
        bodies: [''], // Fetch whole email
        struct: true,
        markSeen: true,
      };

      const messages = await this.connection.search(searchCriteria, fetchOptions);
      logger.info(`Búsqueda completada. Correos nuevos encontrados: ${messages.length}`);

      for (const message of messages) {
        await this.processMessage(message);
      }
    } catch (error) {
      logger.error('Error al buscar correos nuevos', error);
    }
  }

  private async processMessage(message: imapsimple.Message) {
    try {
      const part = message.parts.find((p) => p.which === '');
      if (!part) {
        logger.warn('No se encontró la parte principal del mensaje.');
        return;
      }

      const parsed = await simpleParser(part.body);

      logger.info(`Nuevo correo detectado de: ${parsed.from?.text} - Asunto: ${parsed.subject}`);

      if (parsed.attachments && parsed.attachments.length > 0) {
        logger.info(`El correo contiene ${parsed.attachments.length} adjuntos.`);
        for (const attachment of parsed.attachments) {
          if (attachment.filename?.toLowerCase().endsWith('.xlsx')) {
            await this.handleAttachment(attachment, parsed.from?.text || 'Desconocido');
          } else {
            logger.debug(`Ignorando adjunto no Excel: ${attachment.filename}`);
          }
        }
      } else {
        logger.info('El correo no contiene adjuntos .xlsx, ignorando.');
      }
    } catch (error: any) {
      logger.error('Error al procesar mensaje individual:', {
        message: error.message,
        stack: error.stack,
      });
    }
  }

  private async handleAttachment(attachment: any, fromEmail: string) {
    const fileName = attachment.filename;
    // Extraer CCT: Generalmente viene en el nombre del archivo o podríamos parsear el Excel.
    // Según RF-05.5: [CCT].[PERIODO].Reporte...
    // Pero aquí estamos recibiendo el FRV del director.
    const cctMatch = fileName.match(/([0-9]{2}[A-Z]{3}[0-9]{4}[A-Z])/i);
    const cct = cctMatch ? cctMatch[1].toUpperCase() : 'DESCONOCIDO';

    logger.info(
      `Archivo FRV detectado: ${fileName} - CCT extraído: ${cct} - Remitente: ${fromEmail}`
    );

    const team = this.distributionService.getTeamForCCT(cct);

    // Guardar archivo
    const uploadDir = path.join(process.cwd(), 'storage', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const archivoPath = path.join(uploadDir, fileName);
    fs.writeFileSync(archivoPath, attachment.content);

    // Calcular hash
    const fileHash = this.solicitudService.calculateHash(attachment.content);

    // Determinar nivel educativo (simplificado para este flujo)
    const nivelId = fileName.toLowerCase().includes('secund') ? 3 : 2; // Primaria por defecto

    try {
      // Crear registro de solicitud
      const solicitudId = await this.solicitudService.createSolicitud({
        cct,
        nombreArchivo: fileName,
        nivelId,
        archivoPath: `storage/uploads/${fileName}`,
        archivoSize: attachment.content.length,
        fileHash,
      });

      // Asignar al equipo
      await this.distributionService.logDistribution(solicitudId, team.id);

      logger.info(`Solicitud ${solicitudId} procesada y asignada al equipo: ${team.nombre}`);
    } catch (error) {
      logger.error('Error al registrar solicitud desde email', error);
    }
  }
}
