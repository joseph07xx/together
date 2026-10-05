import type { ErrorRequestHandler, RequestHandler } from 'express';
import crypto from 'node:crypto';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res
    .status(404)
    .json({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  // Errores de validación Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos inválidos',
        details: err.flatten().fieldErrors,
        requestId,
      },
    });
    return;
  }

  // Errores de aplicación
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
    return;
  }

  // Error de CORS lanzado por el middleware
  if (err instanceof Error && err.message.startsWith('CORS:')) {
    res.status(403).json({
      error: { code: 'FORBIDDEN_ORIGIN', message: 'Origen no permitido', requestId },
    });
    return;
  }

  // Errores inesperados
  if (env.NODE_ENV !== 'production') {
    console.error(`[error ${requestId}]`, err);
  } else {
    // En producción logueamos el requestId y el stack para el operador,
    // pero devolvemos un mensaje genérico al cliente.
    console.error(`[error ${requestId}]`, err instanceof Error ? err.stack : err);
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor',
      requestId,
    },
  });
};