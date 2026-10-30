import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prismaDouble = vi.hoisted(() => ({
  client: vi.fn(),
  adapter: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: prismaDouble.client,
}));
vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: prismaDouble.adapter,
}));

const originalEnv = process.env.NODE_ENV;

async function loadPrisma() {
  vi.resetModules();
  return import('../src/lib/prisma');
}

describe('lib/prisma', () => {
  beforeEach(() => {
    delete globalThis.__prisma;
    prismaDouble.client.mockImplementation(function () {
      return { name: 'cliente-nuevo' };
    });
    prismaDouble.adapter.mockImplementation(function () {
      return { name: 'adaptador-pg' };
    });
  });

  afterEach(() => {
    delete globalThis.__prisma;
    process.env.NODE_ENV = originalEnv;
  });

  it('crea el cliente con el adaptador de PostgreSQL y lo guarda en globalThis fuera de producción', async () => {
    const { default: prisma } = await loadPrisma();

    expect(prismaDouble.adapter).toHaveBeenCalledWith(
      expect.objectContaining({ connectionString: expect.any(String) }),
    );
    expect(prismaDouble.client).toHaveBeenCalledWith({ adapter: { name: 'adaptador-pg' } });
    expect(prisma).toEqual({ name: 'cliente-nuevo' });
    expect(globalThis.__prisma).toBe(prisma);
  });

  it('reutiliza la instancia ya guardada en globalThis en lugar de crear otra', async () => {
    const existing = { name: 'ya-existente' };
    globalThis.__prisma = existing as unknown as typeof globalThis.__prisma;

    const { default: prisma } = await loadPrisma();

    expect(prisma).toBe(existing);
    expect(prismaDouble.client).not.toHaveBeenCalled();
  });

  it('no guarda la instancia en globalThis en producción', async () => {
    process.env.NODE_ENV = 'production';

    const { default: prisma } = await loadPrisma();

    expect(prisma).toEqual({ name: 'cliente-nuevo' });
    expect(globalThis.__prisma).toBeUndefined();
  });
});
