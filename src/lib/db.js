import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

const globalForPrisma = globalThis;

let prismaInstance;

if (process.env.VERCEL && process.env.POSTGRES_PRISMA_URL) {
  // Use Neon Serverless Adapter in Vercel environment
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.POSTGRES_PRISMA_URL });
  const adapter = new PrismaNeon(pool);
  prismaInstance = new PrismaClient({ adapter });
} else {
  // Standard Prisma Client for local development (SQLite or local Postgres)
  prismaInstance = new PrismaClient();
}

export const db = globalForPrisma.prisma || prismaInstance;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
