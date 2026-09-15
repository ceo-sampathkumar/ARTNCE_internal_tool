import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

/**
 * Check if a valid DATABASE_URL is configured in environment variables.
 */
export const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.trim().length > 0 && !url.includes('placeholder'));
};

/**
 * Prisma Client singleton instance for Next.js.
 * Only instantiated if DATABASE_URL is set.
 */
export const prisma =
  globalForPrisma.prisma ||
  (isDatabaseConfigured()
    ? new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      })
    : null);

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
