import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth.js';
import { writeRateLimit } from '../../middlewares/rate-limit.js';
import { getPrivacyHandler, putPrivacyHandler } from './privacy.controller.js';

export const privacyRouter: Router = Router();

privacyRouter.use(requireAuth);

privacyRouter.get('/me', getPrivacyHandler);
privacyRouter.put('/', writeRateLimit, putPrivacyHandler);