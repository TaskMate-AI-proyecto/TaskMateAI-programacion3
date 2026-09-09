import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'TaskMate AI <no-reply@taskmate.ai>';

const hasSmtp = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter: nodemailer.Transporter | null = null;

if (hasSmtp) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export async function sendVerificationCode(email: string, code: string) {
  const subject = 'Tu código de verificación - TaskMate AI';
  const text = `Tu código de verificación es: ${code}. Caduca en 10 minutos.`;
  const html = `<p>Tu código de verificación es: <strong>${code}</strong></p><p>Caduca en 10 minutos.</p>`;

  if (!hasSmtp || !transporter) {
    // Fallback para desarrollo: imprimir en consola
    // eslint-disable-next-line no-console
    console.info(`[EMAIL-DEV] Envío simulado a ${email}: ${code}`);
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM,
    to: email,
    subject,
    text,
    html,
  });
}

export default { sendVerificationCode };
