import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    // Valores ficticios: Prisma, el email y Gemini se mockean en cada suite.
    // SMTP vacío: aunque haya un .env con credenciales reales, los tests nunca envían correo.
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_SECRET: 'test-secret',
      GEMINI_API_KEY: 'test-gemini-key',
      SMTP_HOST: '',
      SMTP_USER: '',
      SMTP_PASS: '',
    },
    mockReset: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'cobertura'],
      reportsDirectory: './coverage',
      // Solo código fuente de la API: tests, tipos y el arranque por consola quedan fuera del conteo.
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts'],
    },
  },
});
