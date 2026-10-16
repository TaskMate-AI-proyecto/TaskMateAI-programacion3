import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestApp } from './helpers';

const prismaMock = vi.hoisted(() => ({
  verificationCode: { updateMany: vi.fn(), create: vi.fn() },
  user: { findUnique: vi.fn(), upsert: vi.fn() },
  $transaction: vi.fn(),
}));
const sendVerificationCode = vi.hoisted(() => vi.fn());

vi.mock('../src/lib/prisma', () => ({ default: prismaMock }));
vi.mock('../src/services/email', () => ({ sendVerificationCode }));

describe('rutas de auth', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const sendCode = (payload: object) =>
    app.inject({ method: 'POST', url: '/api/auth/send-code', payload });
  const verifyCode = (payload: object) =>
    app.inject({ method: 'POST', url: '/api/auth/verify-code', payload });

  beforeEach(() => {
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock),
    );
  });

  describe('POST /api/auth/send-code', () => {
    it('rechaza un email inválido sin tocar la base de datos', async () => {
      const response = await sendCode({ email: 'no-es-un-email' });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({ success: false, message: 'Email inválido' });
      expect(prismaMock.verificationCode.create).not.toHaveBeenCalled();
    });

    it('invalida códigos previos, guarda uno nuevo de 6 dígitos y lo envía', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });

      const response = await sendCode({ email: 'ana@example.com' });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ success: true });
      expect(prismaMock.verificationCode.updateMany).toHaveBeenCalledWith({
        where: { email: 'ana@example.com', used: false },
        data: { used: true },
      });

      const { data } = prismaMock.verificationCode.create.mock.calls[0][0];
      expect(data).toMatchObject({ email: 'ana@example.com', used: false, userId: 'user-1' });
      expect(data.code).toMatch(/^\d{6}$/);
      expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(sendVerificationCode).toHaveBeenCalledWith('ana@example.com', data.code);
    });

    it('responde 500 si falla el envío del email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      sendVerificationCode.mockRejectedValue(new Error('SMTP caído'));

      const response = await sendCode({ email: 'ana@example.com' });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ success: false, message: 'Error enviando el código' });
    });
  });

  describe('POST /api/auth/verify-code', () => {
    it('rechaza un código con formato inválido', async () => {
      const response = await verifyCode({ email: 'ana@example.com', code: '12ab' });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({ success: false, message: 'Email o código inválido' });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('rechaza un código inexistente, usado o expirado sin crear usuario', async () => {
      prismaMock.verificationCode.updateMany.mockResolvedValue({ count: 0 });

      const response = await verifyCode({ email: 'ana@example.com', code: '123456' });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({ success: false, message: 'Código inválido o expirado' });
      expect(prismaMock.user.upsert).not.toHaveBeenCalled();
    });

    it('consume el código y devuelve un JWT válido para el usuario', async () => {
      prismaMock.verificationCode.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.user.upsert.mockResolvedValue({ id: 'user-1', email: 'ana@example.com' });

      const response = await verifyCode({ email: 'ana@example.com', code: '123456' });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.user).toEqual({ id: 'user-1', email: 'ana@example.com' });
      expect(app.jwt.verify(body.token)).toMatchObject({ id: 'user-1', email: 'ana@example.com' });

      const { where } = prismaMock.verificationCode.updateMany.mock.calls[0][0];
      expect(where).toMatchObject({ email: 'ana@example.com', code: '123456', used: false });
      expect(where.expiresAt.gt).toBeInstanceOf(Date);
    });
  });
});
