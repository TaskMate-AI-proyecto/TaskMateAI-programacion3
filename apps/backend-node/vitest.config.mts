import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // Valores ficticios: Prisma, el email y Gemini se mockean en cada suite.
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_SECRET: 'test-secret',
      GEMINI_API_KEY: 'test-gemini-key',
    },
    mockReset: true,
  },
});
