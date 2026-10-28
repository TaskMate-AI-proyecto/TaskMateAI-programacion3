import { beforeEach, describe, expect, it, vi } from 'vitest';

const smtp = vi.hoisted(() => ({
  sendMail: vi.fn(),
  createTransport: vi.fn(),
}));

const smtpSettings = {
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: 587,
  SMTP_USER: 's.donati@alumno.etec.um.edu.ar',
  SMTP_PASS: 'clave-de-prueba',
  SMTP_FROM: 'TaskMate AI <s.donati@alumno.etec.um.edu.ar>',
};
const envMock = vi.hoisted(() => ({}) as Record<string, string | number | undefined>);

vi.mock('nodemailer', () => ({ default: { createTransport: smtp.createTransport } }));
vi.mock('../src/config/env', () => ({ env: envMock }));

async function loadEmailService() {
  // Recarga el módulo para que el transporte cacheado no se comparta entre tests.
  vi.resetModules();
  return import('../src/services/email');
}

describe('services/email', () => {
  beforeEach(() => {
    Object.assign(envMock, smtpSettings);
    smtp.createTransport.mockReturnValue({ sendMail: smtp.sendMail });
    smtp.sendMail.mockResolvedValue({ messageId: 'mensaje-de-prueba' });
  });

  it('envía el código desde el remitente configurado al destinatario', async () => {
    const { sendVerificationCode } = await loadEmailService();

    await sendVerificationCode('ana@example.com', '123456');

    expect(smtp.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'TaskMate AI <s.donati@alumno.etec.um.edu.ar>',
        to: 'ana@example.com',
        subject: 'Tu código de verificación - TaskMate AI',
        text: expect.stringContaining('123456'),
        html: expect.stringContaining('<strong>123456</strong>'),
      }),
    );
  });

  it('crea el transporte SMTP con las credenciales del entorno', async () => {
    const { sendVerificationCode } = await loadEmailService();

    await sendVerificationCode('ana@example.com', '123456');

    expect(smtp.createTransport).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: 's.donati@alumno.etec.um.edu.ar', pass: 'clave-de-prueba' },
    });
  });

  it('usa SMTP_USER como remitente si SMTP_FROM no está definido', async () => {
    envMock.SMTP_FROM = '';
    const { sendVerificationCode } = await loadEmailService();

    await sendVerificationCode('ana@example.com', '123456');

    expect(smtp.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 's.donati@alumno.etec.um.edu.ar' }),
    );
  });

  it('reutiliza el mismo transporte entre envíos', async () => {
    const { sendVerificationCode } = await loadEmailService();

    await sendVerificationCode('ana@example.com', '111111');
    await sendVerificationCode('ana@example.com', '222222');

    expect(smtp.createTransport).toHaveBeenCalledTimes(1);
    expect(smtp.sendMail).toHaveBeenCalledTimes(2);
  });

  it('usa conexión TLS directa en el puerto 465', async () => {
    envMock.SMTP_PORT = 465;
    const { sendVerificationCode } = await loadEmailService();

    await sendVerificationCode('ana@example.com', '123456');

    expect(smtp.createTransport).toHaveBeenCalledWith(expect.objectContaining({ secure: true }));
  });

  it('falla sin intentar enviar cuando SMTP no está configurado', async () => {
    envMock.SMTP_HOST = '';
    const { sendVerificationCode } = await loadEmailService();

    await expect(sendVerificationCode('ana@example.com', '123456')).rejects.toThrow(
      'SMTP no está configurado',
    );
    expect(smtp.createTransport).not.toHaveBeenCalled();
    expect(smtp.sendMail).not.toHaveBeenCalled();
  });

  it('propaga el error si el servidor SMTP rechaza el envío', async () => {
    smtp.sendMail.mockRejectedValue(new Error('535 Autenticación fallida'));
    const { sendVerificationCode } = await loadEmailService();

    await expect(sendVerificationCode('ana@example.com', '123456')).rejects.toThrow(
      '535 Autenticación fallida',
    );
  });
});
