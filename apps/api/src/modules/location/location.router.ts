import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth.js';
import { writeRateLimit } from '../../middlewares/rate-limit.js';
import {
  getMyLocationHandler,
  getPartnerLocationHandler,
  getPartnerPresenceHandler,
  putLocationHandler,
} from './location.controller.js';

export const locationRouter: Router = Router();

locationRouter.use(requireAuth);

locationRouter.get('/me', getMyLocationHandler);
locationRouter.get('/partner', getPartnerLocationHandler);
locationRouter.get('/partner/presence', getPartnerPresenceHandler);
locationRouter.put('/', writeRateLimit, putLocationHandler);