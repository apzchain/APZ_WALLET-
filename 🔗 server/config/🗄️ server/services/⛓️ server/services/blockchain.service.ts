import { ethers } from 'ethers';
import { provider, serverWallet, APZ_CHAIN_CONFIG, APZ_TOKEN_ABI } from '../config/blockchain.js';
import { dbService } from './db.service.js';
import crypto from 'crypto';

export class BlockchainService {
  /**
   * دریافت موجودی واقعی از APZ-CHAIN
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balanceWei = await provider.getBalance(address);
      return ethers.formatEther(balanceWei);
    } catch (err) {
      console.error('[BlockchainService] getBalance error:', err);
      throw new Error('Failed to fetch balance from APZ-CHAIN');
    }
  }

  /**
   * دریافت اطلاعات شبکه
   */
  async getNetworkInfo() {
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    return {
      chainId: Number(network.chainId),
      name: network.name,
      blockNumber,
      rpcUrl: APZ_CHAIN_CONFIG.rpcUrl
    };
  }

  /**
   * ایجاد کیف پول جدید روی سرور (HD wallet)
   */
  createWalletOnServer(label?: string) {
    const wallet = ethers.Wallet.createRandom();
    const id = crypto.randomUUID();

    // ⚠️ در پروژه واقعی، کلید خصوصی باید رمزنگاری شده ذخیره شود
    dbService.createWallet({
      id,
      address: wallet.address,
      encrypted_private_key: wallet.privateKey, // TODO: encrypt with KMS
      label: label || null,
      created_at: Date.now()
    });

    return {
      id,
      address: wallet.address,
      mnemonic: wallet.mnemonic?.phrase, // فقط یکبار به کاربر نشان بده
      label
    };
  }

  /**
   * ارسال تراکنش واقعی روی APZ-CHAIN
   */
  async sendTransaction(params: {
    privateKey: string;
    to: string;
    amount: string;
    walletId: string;
  }) {
    const { privateKey, to, amount, walletId } = params;

    if (!ethers.isAddress(to)) throw new Error('Invalid recipient address');

    const signer = new ethers.Wallet(privateKey, provider);
    const value = ethers.parseEther(amount);

    // تخمین گس
    const gasEstimate = await provider.estimateGas({
      from: signer.address,
      to,
      value
    });

    const feeData = await provider.getFeeData();

    const tx = await signer.sendTransaction({
      to,
      value,
      gasLimit: (gasEstimate * 120n) / 100n, // +20% buffer
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
    });

    const txId = crypto.randomUUID();
    dbService.upsertTransaction({
      id: txId,
      wallet_id: walletId,
      tx_hash: tx.hash,
      from_address: signer.address,
      to_address: to,
      amount,
      status: 'pending',
      block_number: null,
      gas_used: null,
      timestamp: Date.now()
    });

    // پیگیری در پس‌زمینه
    this.trackTransaction(tx.hash, txId);

    return {
      id: txId,
      hash: tx.hash,
      explorerUrl: `${APZ_CHAIN_CONFIG.explorer}/tx/${tx.hash}`
    };
  }

  /**
   * پیگیری وضعیت تراکنش تا تأیید نهایی
   */
  private async trackTransaction(hash: string, txId: string) {
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 5000));
      try {
        const receipt = await provider.getTransactionReceipt(hash);
        if (receipt) {
          dbService.upsertTransaction({
            id: txId,
            wallet_id: '', // update only
            tx_hash: hash,
            from_address: receipt.from,
            to_address: receipt.to || '',
            amount: '0',
            status: receipt.status === 1 ? 'confirmed' : 'failed',
            block_number: receipt.blockNumber,
            gas_used: receipt.gasUsed.toString(),
            timestamp: Date.now()
          });
          break;
        }
      } catch (err) {
        console.error('[trackTransaction]', err);
      }
    }
  }

  /**
   * تاریخچه تراکنش‌های on-chain یک آدرس
   */
  async getOnChainHistory(address: string, fromBlock = 0) {
    const currentBlock = await provider.getBlockNumber();
    const logs = await provider.getLogs({
      fromBlock: Math.max(fromBlock, currentBlock - 5000),
      toBlock: 'latest',
      topics: [
        ethers.id('Transfer(address,address,uint256)'),
        null,
        ethers.zeroPadValue(address, 32)
      ]
    });

    return logs.map(log => ({
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      data: log.data
    }));
  }
}

export const blockchainService = new BlockchainService();
