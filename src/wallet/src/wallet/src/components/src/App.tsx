
```tsx
import React, { useState } from 'react';
import { WalletCard } from './components/WalletCard';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { WalletService } from './wallet/WalletService';
import { Wallet, Transaction } from './wallet/types';
import './styles/globals.css';

function App() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const walletService = WalletService.getInstance();

  const handleCreateWallet = () => {
    const newWallet = walletService.createWallet();
    setWallet(newWallet);
  };

  const handleSend = async (to: string, amount: number) => {
    try {
      const tx = await walletService.sendTransaction(to, amount);
      setTransactions([...walletService.getTransactions()]);
      setWallet({ ...walletService.getWallet()! });
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>⛓️ APZ Wallet</h1>
        <p>Layer 1 Blockchain EVM-Compatible · Non-custodial</p>
      </header>

      {!wallet ? (
        <div className="onboarding">
          <button className="btn-primary" onClick={handleCreateWallet}>
            Create New Wallet
          </button>
        </div>
      ) : (
        <div className="wallet-dashboard">
          <WalletCard wallet={wallet} />
          <TransactionForm onSubmit={handleSend} />
          <TransactionList transactions={transactions} />
        </div>
      )}
    </div>
  );
}

export default App;
```
