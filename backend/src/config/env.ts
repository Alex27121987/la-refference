import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET', 'REFRESH_SECRET'] as const;

required.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`[env] Missing ${key} in environment`);
  }
});

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  refreshSecret: process.env.REFRESH_SECRET || 'dev-refresh',
  allowedOrigin: (process.env.ALLOWED_ORIGIN || '*').split(',').map((s) => s.trim()),
};