import type { RequestHandler } from 'express';
import { setStatusSchema } from '@together/shared';
import { getMyStatus, getPartnerStatus, setStatus } from './status.service.js';

export const putStatusHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = setStatusSchema.parse(req.body);
    const status = await setStatus(req.user!.id, input);
    res.json({ status });
  } catch (err) {
    next(err);
  }
};

export const getMyStatusHandler: RequestHandler = async (req, res, next) => {
  try {
    const status = await getMyStatus(req.user!.id);
    res.json({ status });
  } catch (err) {
    next(err);
  }
};

export const getPartnerStatusHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await getPartnerStatus(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};