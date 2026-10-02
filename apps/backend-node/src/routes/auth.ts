import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { errorResponse, publicRoute } from '../docs/openapi';
import prisma from '../lib/prisma';
import { sendVerificationCode } from '../services/email';

export default async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/send-code', {
    schema: publicRoute('Auth', 'Envía un código OTP al correo indicado', {
      body: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } },
      response: { 200: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } }, 400: errorResponse, 500: errorResponse },
    }),
  }, async (request, reply) => {
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
      app.log.error({ err }, 'Error sending verification email');
      reply.status(500);
      return { success: false, message: 'Error enviando el código' };
    }

    return { success: true, message: 'Código de verificación enviado con éxito' };
  });

  app.post('/api/auth/verify-code', {
    schema: publicRoute('Auth', 'Verifica un código OTP y devuelve un JWT', {
      body: { type: 'object', required: ['email', 'code'], properties: { email: { type: 'string', format: 'email' }, code: { type: 'string', pattern: '^\\d{6}$' } } },
      response: {
        200: { type: 'object', required: ['success', 'token', 'user'], properties: { success: { type: 'boolean' }, token: { type: 'string' }, user: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string', format: 'email' } } } } },
        400: errorResponse,
      },
    }),
  }, async (request, reply) => {
    const bodySchema = z.object({
      email: z.string().email(),
      code: z.string().regex(/^\d{6}$/),
    });
    const parseResult = bodySchema.safeParse(request.body);

    if (!parseResult.success) {
      reply.status(400);
      return { success: false, message: 'Email o código inválido' };
    }

    const { email, code } = parseResult.data;
    const now = new Date();

    const user = await prisma.$transaction(async (transaction) => {
      const consumedCode = await transaction.verificationCode.updateMany({
        where: {
          email,
          code,
          used: false,
          expiresAt: { gt: now },
        },
        data: { used: true },
      });

      if (consumedCode.count !== 1) {
        return null;
      }

      return transaction.user.upsert({
        where: { email },
        update: {},
        create: { email },
      });
    });

    if (!user) {
      reply.status(400);
      return { success: false, message: 'Código inválido o expirado' };
    }

    const token = app.jwt.sign({ id: user.id, email: user.email });

    return {
      success: true,
      token,
      user: { id: user.id, email: user.email },
    };
  });
}
