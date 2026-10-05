import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import { authRouter } from './modules/auth/auth.router.js';
import { couplesRouter } from './modules/couples/couples.router.js';
import { statusRouter } from './modules/status/status.router.js';
import { locationRouter } from './modules/location/location.router.js';
import { privacyRouter } from './modules/privacy/privacy.router.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { initRealtime } from './modules/realtime/socket.server.js';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    // Esta API solo sirve JSON; no cargamos HTML ni recursos.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer' },
    hsts: env.NODE_ENV === 'production' ? { maxAge: 15552000, includeSubDomains: true } : false,
  }),
);

const allowedOrigins = new Set([env.WEB_ORIGIN]);

app.use(
  cors({
    origin(origin, cb) {
      // Permitimos peticiones sin Origin (curl, smoke tests, apps nativas)
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error('CORS: origen no permitido'));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'together-api',
    env: env.NODE_ENV,
    time: new Date().toISOString(),
  });
});

app.use('/auth', authRouter);
app.use('/couples', couplesRouter);
app.use('/status', statusRouter);
app.use('/location', locationRouter);
app.use('/privacy', privacyRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const httpServer = http.createServer(app);

// Timeouts defensivos
httpServer.keepAliveTimeout = 65_000;
httpServer.headersTimeout = 66_000;
httpServer.requestTimeout = 30_000;

initRealtime(httpServer);

httpServer.listen(env.API_PORT, () => {
  console.log(`[api] listening on http://localhost:${env.API_PORT}`);
});