import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as typeof globalThis & {
  bebooPrisma?: PrismaClient;
};

export const db = globalForPrisma.bebooPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.bebooPrisma = db;
}
