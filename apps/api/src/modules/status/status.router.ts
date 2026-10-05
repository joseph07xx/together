import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth.js';
import { writeRateLimit } from '../../middlewares/rate-limit.js';
import {
  getMyStatusHandler,
  getPartnerStatusHandler,
  putStatusHandler,
} from './status.controller.js';

export const statusRouter: Router = Router();

statusRouter.use(requireAuth);

statusRouter.get('/me', getMyStatusHandler);
statusRouter.get('/partner', getPartnerStatusHandler);
statusRouter.put('/', writeRateLimit, putStatusHandler);