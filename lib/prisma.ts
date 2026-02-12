import { PrismaClient } from '@prisma/client'

// Schema uses PostgreSQL. DATABASE_URL must start with postgresql:// or postgres:// (not file:).
const url = process.env.DATABASE_URL || ''
if (process.env.NODE_ENV === 'production' && (!url || (!url.startsWith('postgresql://') && !url.startsWith('postgres://')))) {
  throw new Error('DATABASE_URL must be a PostgreSQL URL (e.g. postgresql://user:pass@host:5432/db). Set it in .env from your Supabase/host.')
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
