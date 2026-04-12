import { PrismaClient } from '@prisma/client';

/**
 * Shared PrismaClient for seed scripts.
 * Uses connection_limit=1 to avoid exhausting Postgres max_connections
 * when multiple seed modules are imported simultaneously.
 */
const url = process.env.DATABASE_URL ?? '';
const separator = url.includes('?') ? '&' : '?';

export const seedPrisma = new PrismaClient({
  datasources: {
    db: { url: `${url}${separator}connection_limit=1&pool_timeout=30` },
  },
});
