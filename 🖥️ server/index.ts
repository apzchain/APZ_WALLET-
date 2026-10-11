import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import walletRoutes from './routes/wallet.routes.js';
import txRoutes from './routes/transaction.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'APZ Wallet API', time: Date.now() });
});

app.use('/api/wallet', walletRoutes);
app.use('/api/tx', txRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 APZ Wallet API running on http://localhost:${PORT}`);
});
