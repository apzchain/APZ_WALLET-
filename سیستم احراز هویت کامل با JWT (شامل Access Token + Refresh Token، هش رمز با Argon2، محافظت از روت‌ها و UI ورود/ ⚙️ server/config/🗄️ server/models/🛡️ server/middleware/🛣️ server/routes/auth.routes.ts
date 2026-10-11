import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { AUTH_CONFIG } from '../config/auth.config.js';

const router = Router();

const emailSchema = z.string().email();
const passwordSchema = z.string().min(8).max(128);

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().min(2).max(50).optional()
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string()
});

// ───── POST /api/auth/register ─────
router.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await authService.register(body);

    res.cookie('refreshToken', refreshToken, AUTH_CONFIG.cookieOptions);
    res.status(201).json({ success: true, data: { user, accessToken } });
  } catch (err) { next(err); }
});

// ───── POST /api/auth/login ─────
router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await authService.login({
      ...body,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    res.cookie('refreshToken', refreshToken, AUTH_CONFIG.cookieOptions);
    res.json({ success: true, data: { user, accessToken } });
  } catch (err) { next(err); }
});

// ───── POST /api/auth/refresh ─────
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) throw Object.assign(new Error('No refresh token'), { status: 401 });

    const { accessToken } = await authService.refresh(token);
    res.json({ success: true, data: { accessToken } });
  } catch (err) { next(err); }
});

// ───── POST /api/auth/logout ─────
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) await authService.logout(token);
    res.clearCookie('refreshToken');
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ───── GET /api/auth/me (محافظت‌شده) ─────
router.get('/me', requireAuth, async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

// ───── POST /api/auth/logout-all ─────
router.post('/logout-all', requireAuth, async (req, res, next) => {
  try {
    await authService.logoutAll(req.user!.sub);
    res.clearCookie('refreshToken');
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
