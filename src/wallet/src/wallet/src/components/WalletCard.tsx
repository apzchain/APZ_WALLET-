```tsx
import React from 'react';
import { Wallet } from '../wallet/types';

interface Props {
  wallet: Wallet;
}

export const WalletCard: React.FC<Props> = ({ wallet }) => {
  return (
    <div className="wallet-card">
      <div className="wallet-header">
        <h2>APZ Wallet</h2>
        <span className="network-badge">EVM Compatible</span>
      </div>
      <div className="wallet-balance">
        <span className="balance-amount">{wallet.balance}</span>
        <span className="balance-currency">{wallet.currency}</span>
      </div>
      <div className="wallet-address">
        <code>{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</code>
      </div>
    </div>
  );
};
```
