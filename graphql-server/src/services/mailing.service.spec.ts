import { MailingService } from './mailing.service';
import nodemailer from 'nodemailer';

// Mock de nodemailer
jest.mock('nodemailer');

describe('MailingService (Issue #315 - Refactor & Security)', () => {
  let service: MailingService;
  let mockSendMail: jest.Mock;

  beforeEach(() => {
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });
    
    // Limpiar variables de entorno para cada test
    delete process.env.SMTP_SERVICE;
    delete process.env.SMTP_TEST_MODE;
    
    service = new MailingService();
  });

  describe('Configuración del Transporter', () => {
    it('debe inicializarse con Gmail por defecto si no hay variables', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
        host: 'smtp.gmail.com',
        port: 465
      }));
    });

    it('debe preferir SMTP_SERVICE si está definido (modo flexible)', () => {
      process.env.SMTP_SERVICE = 'ethereal';
      service = new MailingService(); // Reiniciar para tomar env
      expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
        service: 'ethereal'
      }));
    });
  });

  describe('Generación de Plantillas (wrapInTemplate)', () => {
    it('debe incluir el título y el diseño corporativo de la SEP', () => {
      // Accedemos al método privado mediante casting para el test
      const html = (service as any).wrapInTemplate('Título Test', 'Subtítulo Test', '<p>Contenido Test</p>');
      
      expect(html).toContain('Título Test');
      expect(html).toContain('Subtítulo Test');
      expect(html).toContain('Contenido Test');
      expect(html).toContain('Secretaría de Educación Pública (SEP)');
      expect(html).toContain('#9d2449'); // Color guinda corporativo
    });
  });

  describe('Validación de Políticas de Seguridad (Issue #268)', () => {
    it('sendPasswordRecovery NO debe contener lenguaje de temporalidad o expiración', async () => {
      await service.sendPasswordRecovery('user@test.com', 'newpass123');
      
      const sentHtml = mockSendMail.mock.calls[0][0].html;
      
      // Verificación de lo que NO debe estar (Issue #268)
      expect(sentHtml.toLowerCase()).not.toContain('temporal');
      expect(sentHtml.toLowerCase()).not.toContain('expira');
      expect(sentHtml.toLowerCase()).not.toContain('obligatorio');
      
      // Verificación de lo que SÍ debe estar
      expect(sentHtml).toContain('permanente');
      expect(sentHtml).toContain('newpass123');
    });

    it('sendAdminPasswordReset debe indicar que es definitiva', async () => {
      await service.sendAdminPasswordReset('user@test.com', 'adminpass');
      const sentHtml = mockSendMail.mock.calls[0][0].html;
      
      expect(sentHtml).toContain('ya no requiere cambios obligatorios');
    });
  });

  describe('Modos de Envío', () => {
    it('debe imprimir en consola y no llamar a sendMail si SMTP_TEST_MODE es true', async () => {
      process.env.SMTP_TEST_MODE = 'true';
      const result = await service.sendEmail('test@test.com', 'Test Subject', '<p>Hello</p>');
      
      expect(result).toBe(true);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('debe manejar errores de envío y retornar false', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP Error'));
      const result = await service.sendEmail('test@test.com', 'Test Subject', '<p>Hello</p>');
      
      expect(result).toBe(false);
    });
  });
});
