import { Router } from 'express';
import { z } from 'zod';
import { blockchainService } from '../services/blockchain.service.js';
import { dbService } from '../services/db.service.js';

const router = Router();

// ارسال تراکنش
router.post('/send', async (req, res, next) => {
  try {
    const schema = z.object({
      walletId: z.string(),
      to: z.string(),
      amount: z.string(),
      privateKey: z.string().optional() // ⚠️ فقط برای dev
    });
    const body = schema.parse(req.body);

    // اگر privateKey ارسال نشد، از DB بخون
    let privateKey = body.privateKey;
    if (!privateKey) {
      const wallets = dbService.getAllWallets();
      const w = wallets.find(x => x.id === body.walletId);
      if (!w?.encrypted_private_key) throw new Error('Wallet not found');
      privateKey = w.encrypted_private_key;
    }

    const tx = await blockchainService.sendTransaction({
      privateKey,
      to: body.to,
      amount: body.amount,
      walletId: body.walletId
    });

    res.json({ success: true, data: tx });
  } catch (err) { next(err); }
});

// تاریخچه محلی
router.get('/:walletId/history', (req, res) => {
  const txs = dbService.getTransactionsByWallet(req.params.walletId);
  res.json({ success: true, data: txs });
});

// وضعیت یک تراکنش
router.get('/status/:hash', (req, res) => {
  const tx = dbService.getTransactionByHash(req.params.hash);
  if (!tx) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: tx });
});

export default router;
