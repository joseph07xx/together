import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth.js';
import { joinRateLimit } from '../../middlewares/rate-limit.js';
import {
  createInviteHandler,
  getMeHandler,
  joinHandler,
  unlinkHandler,
} from './couples.controller.js';

export const couplesRouter: Router = Router();

couplesRouter.use(requireAuth);

couplesRouter.get('/me', getMeHandler);
couplesRouter.post('/invite', createInviteHandler);
couplesRouter.post('/join', joinRateLimit, joinHandler);
couplesRouter.delete('/me', unlinkHandler);