import type { RequestHandler } from 'express';
import { updatePrivacySchema } from '@together/shared';
import { getPrivacy, updatePrivacy } from './privacy.service.js';

export const getPrivacyHandler: RequestHandler = async (req, res, next) => {
  try {
    const privacy = await getPrivacy(req.user!.id);
    res.json({ privacy });
  } catch (err) {
    next(err);
  }
};

export const putPrivacyHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updatePrivacySchema.parse(req.body);
    const privacy = await updatePrivacy(req.user!.id, input);
    res.json({ privacy });
  } catch (err) {
    next(err);
  }
};