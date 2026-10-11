import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

export const APZ_CHAIN_CONFIG = {
  rpcUrl: process.env.APZ_RPC_URL || 'https://rpc.apz-chain.io',
  chainId: Number(process.env.APZ_CHAIN_ID || 8811),
  name: 'APZ-CHAIN',
  currency: 'APZ',
  explorer: process.env.APZ_EXPLORER || 'https://explorer.apz-chain.io'
};

// Provider (read-only)
export const provider = new ethers.JsonRpcProvider(
  APZ_CHAIN_CONFIG.rpcUrl,
  {
    chainId: APZ_CHAIN_CONFIG.chainId,
    name: APZ_CHAIN_CONFIG.name
  }
);

// Wallet (for server-side signing / deploying)
export const serverWallet = process.env.DEPLOYER_PRIVATE_KEY
  ? new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)
  : null;

// Contract ABI (minimal ERC-20 style for APZ)
export const APZ_TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];
