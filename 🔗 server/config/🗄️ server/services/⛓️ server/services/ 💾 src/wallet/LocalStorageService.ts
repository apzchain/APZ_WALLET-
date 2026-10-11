import { Wallet, Transaction } from './types';

const KEYS = {
  WALLET: 'apz_wallet',
  TXS: 'apz_transactions',
  SETTINGS: 'apz_settings'
};

export const localStorageService = {
  saveWallet(wallet: Wallet) {
    localStorage.setItem(KEYS.WALLET, JSON.stringify(wallet));
  },

  getWallet(): Wallet | null {
    const raw = localStorage.getItem(KEYS.WALLET);
    return raw ? JSON.parse(raw) : null;
  },

  clearWallet() {
    localStorage.removeItem(KEYS.WALLET);
  },

  saveTransactions(txs: Transaction[]) {
    localStorage.setItem(KEYS.TXS, JSON.stringify(txs.slice(0, 200)));
  },

  getTransactions(): Transaction[] {
    const raw = localStorage.getItem(KEYS.TXS);
    return raw ? JSON.parse(raw) : [];
  },

  saveSettings(settings: Record<string, any>) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  getSettings(): Record<string, any> {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : {};
  }
};
