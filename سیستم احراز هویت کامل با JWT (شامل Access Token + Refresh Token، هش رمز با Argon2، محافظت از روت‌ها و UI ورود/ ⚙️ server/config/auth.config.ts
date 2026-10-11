import dotenv from 'dotenv';
dotenv.config();

export const AUTH_CONFIG = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'CHANGE_ME_ACCESS_SECRET',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'CHANGE_ME_REFRESH_SECRET',
  accessTokenTTL: process.env.JWT_ACCESS_TTL || '15m',
  refreshTokenTTL: process.env.JWT_REFRESH_TTL || '7d',
  argon2Options: {
    type: 2, // argon2id
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
  },
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};
