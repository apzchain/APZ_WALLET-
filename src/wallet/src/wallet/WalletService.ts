```typescript
import { Wallet, Transaction } from './types';

export class WalletService {
  private static instance: WalletService;
  private wallet: Wallet | null = null;
  private transactions: Transaction[] = [];

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  createWallet(): Wallet {
    const id = crypto.randomUUID();
    const address = '0x' + Array.from({length: 40}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    this.wallet = {
      id,
      address,
      balance: 1000, // Initial balance for demo
      currency: 'APZ',
      publicKey: '0x' + Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')
    };
    
    return this.wallet;
  }

  getWallet(): Wallet | null {
    return this.wallet;
  }

  async sendTransaction(to: string, amount: number): Promise<Transaction> {
    if (!this.wallet) throw new Error('No wallet connected');
    if (amount > this.wallet.balance) throw new Error('Insufficient balance');

    const tx: Transaction = {
      id: crypto.randomUUID(),
      from: this.wallet.address,
      to,
      amount,
      timestamp: Date.now(),
      status: 'pending',
      txHash: '0x' + Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')
    };

    this.transactions.push(tx);
    this.wallet.balance -= amount;

    // Simulate confirmation
    setTimeout(() => {
      tx.status = 'confirmed';
    }, 2000);

    return tx;
  }

  getTransactions(): Transaction[] {
    return this.transactions;
  }
}
```
