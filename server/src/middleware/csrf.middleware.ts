import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const EXEMPT_PATHS = new Set(['/api/auth/login', '/api/auth/register']);

export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method) || EXEMPT_PATHS.has(req.path)) {
    return next();
  }

  // Only enforce CSRF token check when request authenticates via cookies
  const usesCookieAuth = Boolean(req.cookies?.accessToken || req.cookies?.refreshToken);
  if (!usesCookieAuth) {
    return next();
  }

  const cookieCsrf = req.cookies?.clubconnect_csrf;
  const headerCsrf = req.headers['x-csrf-token'];

  if (!cookieCsrf || !headerCsrf || cookieCsrf !== headerCsrf) {
    return next(new AppError('Invalid or missing CSRF token', 403));
  }

  next();
}
