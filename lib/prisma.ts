import { PrismaClient } from '@prisma/client'

// DATABASE_URL must be set (PostgreSQL). In production use your Supabase/hosted Postgres URL.
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL is required in production. Set it to your PostgreSQL connection string.')
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
