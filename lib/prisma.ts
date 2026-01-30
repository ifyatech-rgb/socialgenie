import { PrismaClient } from '@prisma/client'
import path from 'path'

// Ensure DATABASE_URL is set (fixes "Environment variable not found" when .env not loaded)
if (!process.env.DATABASE_URL) {
  const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
  process.env.DATABASE_URL = `file:${dbPath}`
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
