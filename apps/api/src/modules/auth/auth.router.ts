import { Router } from 'express';
import {
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerHandler,
} from './auth.controller.js';
import { requireAuth } from '../../middlewares/require-auth.js';
import { authRateLimit } from '../../middlewares/rate-limit.js';

export const authRouter : Router = Router();

authRouter.post('/register', authRateLimit, registerHandler);
authRouter.post('/login', authRateLimit, loginHandler);
authRouter.post('/refresh', refreshHandler); // no limitamos aquí; el refresh es legítimo y frecuente
authRouter.post('/logout', logoutHandler);
authRouter.get('/me', requireAuth, meHandler);