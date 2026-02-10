import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    // DIRECT_URL (session mode, port 5432) is used by Prisma CLI for migrations/db push.
    // The app uses DATABASE_URL (transaction mode, port 6543) via the pg adapter in lib/prisma.ts.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/dummy',
  },
})
