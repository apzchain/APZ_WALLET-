```typescript
export interface Wallet {
  id: string;
  address: string;
  balance: number;
  currency: string;
  publicKey: string;
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  txHash: string;
}

export interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}
```
