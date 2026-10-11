import { Router } from 'express';
import { z } from 'zod';
import { blockchainService } from '../services/blockchain.service.js';
import { dbService } from '../services/db.service.js';

const router = Router();

// ایجاد کیف پول جدید
router.post('/create', async (req, res, next) => {
  try {
    const schema = z.object({ label: z.string().optional() });
    const { label } = schema.parse(req.body);
    const wallet = blockchainService.createWalletOnServer(label);
    res.json({ success: true, data: wallet });
  } catch (err) { next(err); }
});

// دریافت لیست کیف پول‌ها
router.get('/list', (_req, res) => {
  const wallets = dbService.getAllWallets().map(w => ({
    id: w.id,
    address: w.address,
    label: w.label,
    createdAt: w.created_at
  }));
  res.json({ success: true, data: wallets });
});

// موجودی
router.get('/:address/balance', async (req, res, next) => {
  try {
    const balance = await blockchainService.getBalance(req.params.address);
    res.json({ success: true, data: { address: req.params.address, balance, currency: 'APZ' } });
  } catch (err) { next(err); }
});

// اطلاعات شبکه
router.get('/network/info', async (_req, res, next) => {
  try {
    const info = await blockchainService.getNetworkInfo();
    res.json({ success: true, data: info });
  } catch (err) { next(err); }
});

export default router;
