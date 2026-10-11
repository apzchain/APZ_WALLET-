```tsx
import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { RegisterForm } from './RegisterForm';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  if (mode === 'register') {
    return <RegisterForm onSwitch={() => setMode('login')} />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>🔐 ورود به APZ Wallet</h2>
      <form onSubmit={onSubmit}>
        <label>
          ایمیل
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            dir="ltr"
          />
        </label>
        <label>
          رمز عبور
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            dir="ltr"
          />
        </label>
        {error && <div className="auth-error">⚠️ {error}</div>}
        <button className="btn-primary" disabled={busy} type="submit">
          {busy ? 'در حال ورود…' : 'ورود'}
        </button>
      </form>
      <p className="auth-switch">
        حساب نداری؟{' '}
        <button type="button" onClick={() => setMode('register')} className="link-btn">
          ثبت‌نام کن
        </button>
      </p>
    </div>
  );
};
```
