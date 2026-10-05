import type { RequestHandler } from 'express';
import { updateLocationSchema } from '@together/shared';
import {
  getMyLocation,
  getPartnerLocation,
  getPartnerPresence,
  updateLocation,
} from './location.service.js';

export const putLocationHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateLocationSchema.parse(req.body);
    const location = await updateLocation(req.user!.id, input);
    res.json({ location });
  } catch (err) {
    next(err);
  }
};

export const getMyLocationHandler: RequestHandler = async (req, res, next) => {
  try {
    const location = await getMyLocation(req.user!.id);
    res.json({ location });
  } catch (err) {
    next(err);
  }
};

export const getPartnerLocationHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await getPartnerLocation(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getPartnerPresenceHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await getPartnerPresence(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};