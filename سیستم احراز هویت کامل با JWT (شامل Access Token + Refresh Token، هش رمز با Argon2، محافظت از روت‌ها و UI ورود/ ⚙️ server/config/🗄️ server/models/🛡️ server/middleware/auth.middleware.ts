import { Request, Response, NextFunction } from 'express';
import { authService, TokenPayload } from '../services/auth.service.js';

// تایپ Request رو گسترش می‌دیم
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * احراز هویت اجباری
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw Object.assign(new Error('Missing token'), { status: 401 });
    }
    const token = header.slice(7);
    req.user = authService.verifyAccessToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * نقش‌محور
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(Object.assign(new Error('Not authenticated'), { status: 401 }));
    if (!roles.includes(req.user.role)) {
      return next(Object.assign(new Error('Forbidden'), { status: 403 }));
    }
    next();
  };
    }
