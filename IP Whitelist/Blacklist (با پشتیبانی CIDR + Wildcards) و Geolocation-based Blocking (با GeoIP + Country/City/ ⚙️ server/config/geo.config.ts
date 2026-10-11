```typescript
import dotenv from 'dotenv';
dotenv.config();

export const IP_ACCESS_CONFIG = {
  mode: (process.env.IP_ACCESS_MODE || 'allow_all') as 'allow_all' | 'deny_all',
  allowLocalhost: process.env.ALLOW_LOCALHOST !== 'false',
  allowPrivateIps: process.env.ALLOW_PRIVATE_IPS !== 'false',
  // TTL کش برای چک‌ها (کاهش query به DB)
  cacheTtlMs: 60_000
};

export const GEO_CONFIG = {
  enabled: process.env.GEO_BLOCKING_ENABLED === 'true',
  mode: (process.env.GEO_MODE || 'block_list') as 'allow_all' | 'block_list' | 'allow_list',
  blockedCountries: (process.env.BLOCKED_COUNTRIES || '').split(',').map(c => c.trim()).filter(Boolean),
  allowedCountries: (process.env.ALLOWED_COUNTRIES || '').split(',').map(c => c.trim()).filter(Boolean),
  // لیست سفید برای روت‌های حساس (مثلاً فقط ایران بتونه لاگین کنه)
  highRiskCountries: ['KP', 'SY', 'CU', 'IR'],
  maxmindDbPath: process.env.MAXMIND_DB_PATH || '',
  failOpen: process.env.GEO_FAIL_OPEN !== 'false', // اگر IP نامشخص → اجازه بده
  // فیلدهایی که در پروفایل IP ذخیره می‌شه
  trackedFields: ['country', 'city', 'region', 'timezone', 'asn', 'isp'] as const
};
```
