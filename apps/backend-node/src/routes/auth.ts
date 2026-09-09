import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { sendVerificationCode } from '../services/email';

export default async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/send-code', async (request, reply) => {
    const bodySchema = z.object({ email: z.string().email() });
    const parseResult = bodySchema.safeParse(request.body);

    if (!parseResult.success) {
      reply.status(400);
      return { success: false, message: 'Email inválido' };
    }

    const { email } = parseResult.data;

    // generar código de 6 dígitos
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // marcar códigos previos como usados/expirados
    await prisma.verificationCode.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    const user = await prisma.user.findUnique({ where: { email } });

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await prisma.verificationCode.create({
      data: {
        email,
        code,
        expiresAt,
        used: false,
        userId: user?.id,
      },
    });

    // enviar correo
    try {
      await sendVerificationCode(email, code);
    } catch (err) {
      app.log.error('Error sending verification email', err);
      reply.status(500);
      return { success: false, message: 'Error enviando el código' };
    }

    return { success: true, message: 'Código de verificación enviado con éxito' };
  });
}
