import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { prisma } from './prisma.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.allowedOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', service: 'la-difference-backend', time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'DB connection failed', error: String(err) });
  }
});

app.listen(env.port, () => {
  console.log(`API running on port ${env.port}`);
});