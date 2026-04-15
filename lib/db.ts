// lib/db.ts — singleton to avoid connection issues in Next.js hot-reload
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production")
  globalForPrisma.prisma = db
