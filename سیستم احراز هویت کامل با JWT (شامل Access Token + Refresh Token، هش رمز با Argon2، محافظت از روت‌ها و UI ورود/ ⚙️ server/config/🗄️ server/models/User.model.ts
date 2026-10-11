```typescript
import db from '../services/db.service.js';

// جدول users رو در db.service.ts اضافه کن (پایین توضیح می‌دم)

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  role: 'user' | 'admin';
  is_active: number;
  created_at: number;
  last_login_at: number | null;
}

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: number;
  revoked: number;
  created_at: number;
  user_agent: string | null;
  ip_address: string | null;
}

export const userModel = {
  create(user: {
    id: string;
    email: string;
    password_hash: string;
    display_name?: string;
    role?: 'user' | 'admin';
  }): void {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, role, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(
      user.id,
      user.email.toLowerCase(),
      user.password_hash,
      user.display_name || null,
      user.role || 'user',
      Date.now()
    );
  },

  findByEmail(email: string): UserRow | undefined {
    return db.prepare('SELECT * FROM users WHERE email = ?')
      .get(email.toLowerCase()) as UserRow | undefined;
  },

  findById(id: string): UserRow | undefined {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  },

  updateLastLogin(id: string): void {
    db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(Date.now(), id);
  },

  // Refresh Tokens
  saveRefreshToken(row: RefreshTokenRow): void {
    db.prepare(`
      INSERT INTO refresh_tokens 
        (id, user_id, token_hash, expires_at, revoked, created_at, user_agent, ip_address)
      VALUES 
        (@id, @user_id, @token_hash, @expires_at, 0, @created_at, @user_agent, @ip_address)
    `).run(row);
  },

  findRefreshToken(hash: string): RefreshTokenRow | undefined {
    return db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0')
      .get(hash) as RefreshTokenRow | undefined;
  },

  revokeRefreshToken(hash: string): void {
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?').run(hash);
  },

  revokeAllUserTokens(userId: string): void {
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').run(userId);
  }
};
```
