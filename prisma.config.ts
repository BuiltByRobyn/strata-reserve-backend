// prisma.config.ts
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  migrations: {
    seed: 'tsx prisma/seeds/seed-backup.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})