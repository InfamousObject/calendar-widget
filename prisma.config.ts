import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    // Use environment variable if available, otherwise use a dummy URL for build time
    url: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/dummy',
  },
})
