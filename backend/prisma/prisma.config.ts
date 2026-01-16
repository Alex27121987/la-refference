import { defineConfig } from '@prisma/internals';

export default defineConfig({
  schema: './schema.prisma',
  datasource: {
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL,
    },
  },
});
