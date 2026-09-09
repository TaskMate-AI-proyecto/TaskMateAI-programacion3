import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  // Allow storing Prisma client on globalThis in dev to avoid multiple instances
  var __prisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

const prisma = global.__prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

export default prisma;
