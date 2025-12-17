import { PrismaClient } from '../generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
const url = process.env.DATABASE_URL || ''
const provider = (process.env.DATABASE_PROVIDER || '').toLowerCase()
let prisma: PrismaClient
if (provider === 'postgresql' || url.startsWith('postgres')) {
  const adapter = new PrismaPg({ connectionString: url })
  prisma = new PrismaClient({ adapter })
} else if (provider === 'mysql' || url.startsWith('mysql')) {
  const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
  } as any)
  prisma = new PrismaClient({ adapter })
} else {
  const adapter = new PrismaBetterSqlite3({ url: url || 'file:./dev.db' })
  prisma = new PrismaClient({ adapter })
}
export { prisma }
