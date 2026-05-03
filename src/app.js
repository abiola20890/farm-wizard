import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import fs from 'fs';
import path from 'path';

import { notFound, errorHandler } from './middlewares/errorHandler.js';

import authRoutes from './routes/auth.route.js';
import farmRoutes from './routes/farm.route.js';
import rewardsRoutes from './routes/rewards.route.js';

const app = express();

// ── Security Middleware ─────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());

// ── CORS ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://farm-wizard-frontend.onrender.com']
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ───────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts' },
});

app.use(globalLimiter);

// ── Body Parsing ────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Logging ─────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  const logStream = fs.createWriteStream(
    path.join(process.cwd(), 'logs', 'access.log'),
    { flags: 'a' }
  );
  app.use(morgan('combined', { stream: logStream }));
}

// ── Health Check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'Farm Wizard API',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ──────────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/farm', farmRoutes);
app.use('/api/v1', rewardsRoutes);

// ── Error Handling ──────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;