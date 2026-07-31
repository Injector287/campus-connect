import { PrismaClient } from '@prisma/client';
import { PrismaNeonHttp } from '@prisma/adapter-neon';

const globalForPrisma = globalThis;

let prismaInstance;

if (process.env.VERCEL && process.env.POSTGRES_PRISMA_URL) {
  // Use Neon HTTP Serverless Adapter in Vercel environment (prevents "Connection terminated" errors)
  const adapter = new PrismaNeonHttp(process.env.POSTGRES_PRISMA_URL, { fetchOptions: { cache: 'no-store' } });
  prismaInstance = new PrismaClient({ adapter });
} else {
  // Standard Prisma Client for local development (SQLite or local Postgres)
  prismaInstance = new PrismaClient();
}

export const db = globalForPrisma.prisma || prismaInstance;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
