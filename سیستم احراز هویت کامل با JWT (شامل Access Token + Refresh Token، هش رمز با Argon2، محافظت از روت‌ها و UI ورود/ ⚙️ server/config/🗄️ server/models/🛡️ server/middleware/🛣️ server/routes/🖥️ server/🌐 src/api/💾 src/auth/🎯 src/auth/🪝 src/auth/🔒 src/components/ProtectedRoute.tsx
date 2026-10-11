```tsx
import React from 'react';
import { useAuth } from '../auth/useAuth';
import { LoginForm } from './LoginForm';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">⏳ Loading wallet…</div>;
  }
  if (!user) {
    return <LoginForm />;
  }
  return <>{children}</>;
};
```
