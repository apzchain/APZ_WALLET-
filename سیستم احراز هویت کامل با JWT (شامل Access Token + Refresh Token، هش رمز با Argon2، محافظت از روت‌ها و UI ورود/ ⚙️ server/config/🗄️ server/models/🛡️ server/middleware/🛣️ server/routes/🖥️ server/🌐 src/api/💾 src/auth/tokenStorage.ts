```typescript
const ACCESS_KEY = 'apz_access_token';

export const tokenStorage = {
  getAccess(): string | null {
    return sessionStorage.getItem(ACCESS_KEY);
  },
  setAccess(token: string) {
    sessionStorage.setItem(ACCESS_KEY, token);
  },
  clear() {
    sessionStorage.removeItem(ACCESS_KEY);
  }
};
```
