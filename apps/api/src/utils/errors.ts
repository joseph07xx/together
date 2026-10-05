export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (msg = 'Solicitud inválida', details?: unknown) =>
  new AppError(400, 'BAD_REQUEST', msg, details);

export const unauthorized = (msg = 'No autenticado') =>
  new AppError(401, 'UNAUTHORIZED', msg);

export const forbidden = (msg = 'Acceso denegado') =>
  new AppError(403, 'FORBIDDEN', msg);

export const notFound = (msg = 'No encontrado') =>
  new AppError(404, 'NOT_FOUND', msg);

export const conflict = (msg = 'Conflicto', details?: unknown) =>
  new AppError(409, 'CONFLICT', msg, details);

export const tooManyRequests = (msg = 'Demasiadas solicitudes') =>
  new AppError(429, 'TOO_MANY_REQUESTS', msg);