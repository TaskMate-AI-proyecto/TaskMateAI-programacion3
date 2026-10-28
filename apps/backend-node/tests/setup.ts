import { vi } from 'vitest';

// Red de seguridad: ningún test puede enviar correos reales, aunque se olvide mockear el envío.
vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: () => {
        throw new Error('Envío de correo real bloqueado en tests');
      },
    }),
  },
}));
