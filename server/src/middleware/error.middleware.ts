import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { sendError } from '../utils/apiResponse.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'Uploaded file exceeds maximum allowed size', 400);
    }
    return sendError(res, err.message, 400);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return sendError(res, 'A record with that unique value already exists', 409);
    }
    if (err.code === 'P2025') {
      return sendError(res, 'Requested record was not found', 404);
    }
    if (err.code === 'P2003') {
      return sendError(res, 'Referenced resource does not exist or cannot be removed', 400);
    }
  }

  if (env.NODE_ENV !== 'production') {
    console.error('Unhandled server error:', err);
  }

  const message =
    env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error
      ? err.message
      : 'Internal server error';

  return sendError(res, message, 500);
}
