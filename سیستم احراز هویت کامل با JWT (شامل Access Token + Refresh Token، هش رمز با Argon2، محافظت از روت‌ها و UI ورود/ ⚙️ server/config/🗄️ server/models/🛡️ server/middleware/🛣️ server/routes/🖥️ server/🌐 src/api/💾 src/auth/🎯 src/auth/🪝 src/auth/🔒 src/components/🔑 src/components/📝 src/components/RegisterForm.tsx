```tsx
import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';

export const RegisterForm: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) return setError('رمز عبور باید حداقل ۸ کاراکتر باشد');
    if (password !== confirm) return setError('تکرار رمز عبور مطابقت ندارد');

    setBusy(true);
    try {
      await register(email.trim().toLowerCase(), password, displayName || undefined);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>✨ ساخت حساب جدید</h2>
      <form onSubmit={onSubmit}>
        <label>
          نام نمایشی (اختیاری)
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            maxLength={50}
          />
        </label>
        <label>
          ایمیل
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            dir="ltr"
          />
        </label>
        <label>
          رمز عبور (حداقل ۸ کاراکتر)
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            dir="ltr"
          />
        </label>
        <label>
          تکرار رمز عبور
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            dir="ltr"
          />
        </label>
        {error && <div className="auth-error">⚠️ {error}</div>}
        <button className="btn-primary" disabled={busy} type="submit">
          {busy ? 'در حال ایجاد…' : 'ثبت‌نام'}
        </button>
      </form>
      <p className="auth-switch">
        قبلاً ثبت‌نام کردی؟{' '}
        <button type="button" onClick={onSwitch} className="link-btn">
          وارد شو
        </button>
      </p>
    </div>
  );
};
```
