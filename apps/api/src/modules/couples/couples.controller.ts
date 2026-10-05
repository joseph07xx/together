import type { RequestHandler } from 'express';
import { joinCoupleSchema } from '@together/shared';
import { createInvite, getCoupleState, joinByCode, unlinkCouple } from './couples.service.js';
import { forbidden } from '../../utils/errors.js';

export const getMeHandler: RequestHandler = async (req, res, next) => {
  try {
    const state = await getCoupleState(req.user!.id);
    res.json(state);
  } catch (err) {
    next(err);
  }
};

export const createInviteHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await createInvite(req.user!.id);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const joinHandler: RequestHandler = async (req, res, next) => {
  try {
    const { code } = joinCoupleSchema.parse(req.body);
    const couple = await joinByCode(req.user!.id, code);
    res.status(201).json({ couple });
  } catch (err) {
    next(err);
  }
};

export const unlinkHandler: RequestHandler = async (req, res, next) => {
  try {
    await unlinkCouple(req.user!.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};