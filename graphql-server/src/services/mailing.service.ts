import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

export class MailingService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport(this.getTransporterConfig());
  }

  private getTransporterConfig() {
    // Configuración automática por servicio o manual por host/puerto
    const config: any = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    };

    // Si se especifica un servicio predeterminado (ej: 'gmail', 'ethereal'), nodemailer lo autoconfigura
    if (process.env.SMTP_SERVICE) {
      delete config.host;
      delete config.port;
      config.service = process.env.SMTP_SERVICE;
    }

    return config;
  }

  /**
   * Genera el HTML envolvente con la identidad visual corporativa (SEP/SiCRER).
   */
  private wrapInTemplate(title: string, subTitle: string, content: string): string {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <!-- Encabezado con color corporativo -->
        <div style="text-align: center; border-bottom: 2px solid #9d2449; padding-bottom: 20px; margin-bottom: 25px;">
          <h2 style="color: #1e293b; margin: 0; font-size: 1.5em; letter-spacing: -0.025em;">${title}</h2>
          <p style="color: #64748b; font-size: 0.95em; margin-top: 5px;">${subTitle}</p>
        </div>
        
        <!-- Contenido principal -->
        <div style="color: #334155; line-height: 1.7; font-size: 1em;">
          ${content}
        </div>
        
        <!-- Pie de página informativo -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 0.85em; color: #94a3b8; text-align: center;">
          <p style="margin-bottom: 8px;">Este es un correo automático generado por el Sistema SiRVER.</p>
          <p style="margin: 0; font-weight: 600;">&copy; 2026 Secretaría de Educación Pública (SEP)</p>
        </div>
      </div>
    `;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    const isTestMode = process.env.SMTP_TEST_MODE === 'true';
    const fromName = process.env.SMTP_FROM_NAME || 'Sistema SiRVER';
    const fromEmail =
      process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@sirver.sep.gob.mx';

    if (isTestMode) {
      logger.info('--- SMTP TEST MODE ACTIVE ---');
      logger.info(`To: ${to}`);
      logger.info(`Subject: ${subject}`);
      logger.info(`From: "${fromName}" <${fromEmail}>`);
      logger.info('Content (HTML):');
      console.log(html); // Usamos console.log para el HTML para que sea legible en la terminal
      logger.info('--- END OF SMTP TEST ---');
      return true;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
      });
      logger.info(`Email sent: ${info.messageId}`);
      return true;
    } catch (error: any) {
      logger.error('Error sending email', error);
      return false;
    }
  }

  async sendPasswordRecovery(email: string, passwordNew: string): Promise<boolean> {
    const content = `
      <p>Hola,</p>
      <p>Has solicitado restablecer tu contraseña para acceder a la plataforma <strong>SiRVER</strong>.</p>
      <div style="background: #f8fafc; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0; border: 1px dashed #cbd5e1;">
        <p style="margin-bottom: 12px; font-size: 0.95em; color: #64748b;">Tu nueva contraseña de acceso es:</p>
        <span style="font-size: 1.8em; font-weight: 700; color: #1e40af; letter-spacing: 3px;">${passwordNew}</span>
      </div>
      <p>Esta contraseña es <strong>permanente</strong> y puedes utilizarla de inmediato para acceder al portal.</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.APP_URL || 'http://localhost:4200'}/login" 
           style="display: inline-block; background-color: #9d2449; color: #ffffff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 1em;">
           Iniciar sesión ahora
        </a>
      </div>
    `;
    const html = this.wrapInTemplate(
      'Recuperación de Contraseña',
      'Sistema de Evaluación Diagnóstica SiRVER',
      content
    );
    return this.sendEmail(email, 'Tu Nueva Contraseña de Acceso - SiRVER', html);
  }

  async sendCredentials(email: string, cct: string, passwordNew: string): Promise<boolean> {
    const content = `
      <p>Estimado Director/Usuario,</p>
      <p>Se han generado oficialmente sus credenciales para la plataforma SiRVER</p>
      <div style="background: #f1f5f9; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 8px 0;"><strong>Escuela (CCT):</strong> ${cct}</p>
        <p style="margin: 8px 0;"><strong>Usuario/Email:</strong> ${email}</p>
        <p style="margin: 8px 0;"><strong>Contraseña inicial:</strong> <span style="font-family: monospace; color: #0f172a; font-weight: bold; font-size: 1.1em;">${passwordNew}</span></p>
      </div>
      <p>Esta contraseña es definitiva y no expira. Por seguridad, no la compartas con nadie.</p>
      <p>Puede acceder al sistema en la siguiente dirección: <a href="${process.env.APP_URL || 'http://localhost:4200'}" style="color: #9d2449; text-decoration: underline; font-weight: 600;">Ir al Sistema SiRVER</a></p>
    `;
    const html = this.wrapInTemplate(
      'Bienvenido al Sistema SiRVER',
      'Evaluación Diagnóstica SiRVER',
      content
    );
    return this.sendEmail(email, 'Tus Credenciales de Acceso - SiRVER', html);
  }

  async sendAdminPasswordReset(email: string, passwordNew: string): Promise<boolean> {
    const content = `
      <p>Hola,</p>
      <p>Un administrador del sistema ha actualizado tu contraseña de acceso para el portal SiRVER.</p>
      <div style="background: #fef2f2; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #fee2e2;">
        <p style="margin-bottom: 12px; color: #991b1b; font-weight: 600; font-size: 0.9em;">NUEVA CREDENCIAL ACTUALIZADA:</p>
        <span style="font-size: 1.5em; font-family: monospace; font-weight: 700; color: #dc2626;">${passwordNew}</span>
      </div>
      <p>Puedes utilizar esta nueva contraseña de inmediato. El sistema ya no requiere cambios obligatorios adicionales.</p>
      <div style="text-align: center; margin-top: 25px;">
        <a href="${process.env.APP_URL || 'http://localhost:4200'}" style="color: #9d2449; font-weight: 600;">Acceder al Portal</a>
      </div>
    `;
    const html = this.wrapInTemplate(
      'Actualización de Seguridad',
      'Sistema de Evaluación Diagnóstica SiRVER',
      content
    );
    return this.sendEmail(email, 'Actualización de Contraseña por Administrador - SiRVER', html);
  }

  async sendResultsNotification(email: string, cct: string, solicitudId: string): Promise<boolean> {
    const content = `
      <p>Estimado Director/a de la escuela <strong>${cct}</strong>,</p>
      <p>Le informamos que el procesamiento de sus reportes de evaluación ha concluido exitosamente para la solicitud <strong>ID: ${solicitudId}</strong>.</p>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${process.env.APP_URL || 'http://localhost:4200'}/descargas" 
           style="display: inline-block; background-color: #047857; color: #ffffff; padding: 14px 30px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 1em; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">
           Ir al Módulo de Descargas
        </a>
      </div>
      
      <p style="font-size: 0.9em; color: #64748b;">En el portal encontrará los siguientes documentos generados:</p>
      <ul style="font-size: 0.9em; color: #334155;">
        <li>Reportes por Campo Formativo (Análisis Cualitativo e Integrador).</li>
        <li>Resultados por Grupo (Consolidado F5).</li>
        <li>Expedientes del Director (Archivos Excel Procesa).</li>
      </ul>
    `;
    const html = this.wrapInTemplate(
      '¡Resultados de Evaluación Listos!',
      `CCT: ${cct} | Solicitud: ${solicitudId}`,
      content
    );
    return this.sendEmail(email, `Resultados de Evaluación Disponibles - ${cct}`, html);
  }
}
