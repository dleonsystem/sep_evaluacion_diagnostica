import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

export class MailingService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'Sistema de Evaluación'}" <${process.env.SMTP_USER}>`,
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
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px;">
          <h2 style="color: #1e293b; margin: 0;">Recuperación de Contraseña</h2>
          <p style="color: #64748b; font-size: 0.9em;">Sistema de Evaluación Diagnóstica</p>
        </div>
        <div style="color: #334155; line-height: 1.6;">
          <p>Hola,</p>
          <p>Has solicitado restablecer tu contraseña para acceder a la plataforma <strong>SiCRER</strong>.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; border: 1px dashed #cbd5e1;">
            <p style="margin-bottom: 10px; font-size: 0.9em; color: #64748b;">Tu nueva contraseña de acceso es:</p>
            <span style="font-size: 1.5em; font-weight: bold; color: #2563eb; letter-spacing: 2px;">${passwordNew}</span>
          </div>
          <p>A partir de ahora, deberás utilizar esta contraseña para ingresar al sistema.</p>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 0.8em; color: #94a3b8; text-align: center;">
          <p>Si no has solicitado este cambio, puedes ignorar este correo o contactar al administrador del sistema.</p>
          <p>&copy; 2026 SEP - Secretaría de Educación Pública</p>
        </div>
      </div>
    `;
    return this.sendEmail(email, 'Recuperación de Contraseña - SiCRER', html);
  }

  async sendCredentials(email: string, cct: string, passwordNew: string): Promise<boolean> {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px;">
          <h2 style="color: #1e293b; margin: 0;">Bienvenido al Sistema</h2>
          <p style="color: #64748b; font-size: 0.9em;">Evaluación Diagnóstica SiCRER</p>
        </div>
        <div style="color: #334155; line-height: 1.6;">
          <p>Estimado Director/Usuario de la escuela <strong>${cct}</strong>,</p>
          <p>Se han generado tus credenciales de acceso para la plataforma de Evaluación Diagnóstica.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 5px 0;"><strong>Usuario/Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Contraseña de Acceso:</strong> <span style="font-family: monospace; color: #2563eb; font-weight: bold;">${passwordNew}</span></p>
          </div>
          <p>Puedes acceder al sistema en la siguiente dirección: <a href="${process.env.APP_URL || 'http://localhost:4200'}" style="color: #2563eb; text-decoration: none; font-weight: 500;">Ir al Sistema</a></p>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 0.8em; color: #94a3b8; text-align: center;">
          <p>&copy; 2026 SEP - Secretaría de Educación Pública</p>
        </div>
      </div>
    `;
    return this.sendEmail(email, 'Tus Credenciales de Acceso - SiCRER', html);
  }

  /**
   * Envía notificación de resultados disponibles (CU-09v2).
   */
  async sendResultsNotification(email: string, cct: string, solicitudId: string): Promise<boolean> {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px;">
          <div style="display: inline-block; background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; font-size: 0.85em; font-weight: 600; margin-bottom: 12px;">Resultados Listos</div>
          <h2 style="color: #1e293b; margin: 0;">¡Tus Reportes están Disponibles!</h2>
          <p style="color: #64748b; font-size: 0.9em;">CCT: ${cct} | Solicitud: ${solicitudId}</p>
        </div>
        <div style="color: #334155; line-height: 1.6;">
          <p>Estimado Director/a,</p>
          <p>Le informamos que el procesamiento de sus archivos FRV ha finalizado. Los reportes por campo formativo y el archivo de resultados para su escuela ya se encuentran disponibles en el portal.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'http://localhost:4200'}/descargas" 
               style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
               Acceder a Módulo de Descargas
            </a>
          </div>
          
          <p style="font-size: 0.9em; color: #64748b;">Podrá encontrar:</p>
          <ul style="font-size: 0.9em; color: #475569;">
            <li>Reportes por Campo Formativo (ENS, HYC, LEN, SPC)</li>
            <li>Reporte de Resultados por Grupo (F5)</li>
            <li>Paquete consolidado (.7z)</li>
          </ul>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 0.8em; color: #94a3b8; text-align: center;">
          <p>Este es un correo automático, por favor no responda a este mensaje.</p>
          <p>&copy; 2026 SEP - Secretaría de Educación Pública</p>
        </div>
      </div>
    `;
    return this.sendEmail(email, `Resultados de Evaluación Listos - ${cct}`, html);
  }
}
