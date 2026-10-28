import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

// Crea el transporte SMTP una sola vez y falla de forma explícita si falta configuración,
// para no responder "código enviado" cuando en realidad nada salió.
function getTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error('SMTP no está configurado: define SMTP_HOST, SMTP_USER y SMTP_PASS');
  }

  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendVerificationCode(email: string, code: string) {
  await getTransporter().sendMail({
    from: env.SMTP_FROM || env.SMTP_USER,
    to: email,
    subject: 'Tu código de verificación - TaskMate AI',
    text: `Tu código de verificación es: ${code}. Caduca en 10 minutos.`,
    html: `<p>Tu código de verificación es: <strong>${code}</strong></p><p>Caduca en 10 minutos.</p>`,
  });
}

export default { sendVerificationCode };
