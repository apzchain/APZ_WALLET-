```typescript
import { Request, Response, NextFunction } from 'express';
import { ipAccessService } from '../services/ipAccess.service.js';

export function ipAccessGuard(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const result = ipAccessService.check(ip);

  if (!result.allowed) {
    console.warn(`[IPAccess] Blocked ${ip}: ${result.reason}`);
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      code: 'IP_BLOCKED',
      reason: result.reason
    });
  }

  // برای دیباگ
  (req as any).ipAccess = result;
  next();
}
```
