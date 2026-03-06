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
            <p style="margin: 5px 0;"><strong>Contraseña Temporal:</strong> <span style="font-family: monospace; color: #2563eb; font-weight: bold;">${passwordNew}</span></p>
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
}
