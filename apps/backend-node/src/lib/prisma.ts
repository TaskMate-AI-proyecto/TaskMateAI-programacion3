import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  // Allow storing Prisma client on globalThis in dev to avoid multiple instances
  var __prisma?: PrismaClient;
}

const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

export default prisma;
