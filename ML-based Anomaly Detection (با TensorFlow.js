🗂️ ساختار اضافهشده

```text
apz-wallet/
├── server/
│   ├── config/
│   │   └── mlAnomaly.config.ts                  ← جدید
│   ├── ml/
│   │   ├── modelBuilder.ts                      ← جدید (ساخت مدل)
│   │   ├── featureExtractor.ts                  ← جدید (استخراج ویژگی)
│   │   ├── dataPreprocessor.ts                  ← جدید (نرمالسازی)
│   │   └── models/                              ← مدلهای ذخیرهشده
│   │       ├── autoencoder/
│   │       └── isolation_forest/
│   ├── services/
│   │   ├── mlAnomaly.service.ts                 ← جدید (هسته اصلی)
│   │   ├── mlTraining.service.ts                ← جدید (آموزش)
│   │   └── baseline.service.ts                  ← جدید (پروفایل پایه)
│   ├── middleware/
│   │   └── mlAnomaly.middleware.ts              ← جدید
│   └── routes/
│       └── mlAnomaly.routes.ts                  ← جدید (admin)
└── src/
    ├── ml/
    │   └── clientAnomalyDetector.ts             ← جدید (کلاینت اختیاری)
    └── components/
        └── admin/
            └── MlAnomalyPanel.tsx               ← جدید
```

---

📦 نصب پکیجها

```bash
# TensorFlow.js Node backend (C++ accelerated)
npm install @tensorflow/tfjs-node

# یا نسخه خالص JS (اگر build مشکل داشت)
npm install @tensorflow/tfjs
```

⚠️ نکته مهم: اگر مسیر پروژه شامل فاصله (space) هست، @tensorflow/tfjs-node ممکنه fail بشه. مسیر رو به apz-wallet تغییر بده.

---

⚙️ .env.example — اضافه کن

```env
# ───── ML Anomaly Detection ─────
ML_ANOMALY_ENABLED=true
# حالت: 'monitor' | 'challenge' | 'block'
ML_ACTION=challenge
# آستانه anomaly score (0-1) — بالاتر = قطعی‌تر
ML_THRESHOLD=0.75
# آیا مدل بعد از N رویداد خودکار دوباره آموزش ببیند؟
ML_AUTO_RETRAIN=true
ML_RETRAIN_INTERVAL_HOURS=24
# حداقل نمونه برای آموزش
ML_MIN_TRAINING_SAMPLES=500

# ───── Model Config ─────
ML_LATENT_DIM=8
ML_HIDDEN_DIM=16
ML_EPOCHS=50
ML_BATCH_SIZE=32
ML_VALIDATION_SPLIT=0.15

# ───── Threshold ─────
# ضریب انحراف معیار برای آستانه (μ + kσ)
ML_THRESHOLD_STD_FACTOR=2.5

# ───── Client-side (اختیاری) ─────
ML_CLIENT_SIDE_ENABLED=false
```

---

⚙️ server/config/mlAnomaly.config.ts

```typescript
import dotenv from 'dotenv';
dotenv.config();

export const ML_CONFIG = {
  enabled: process.env.ML_ANOMALY_ENABLED === 'true',
  action: (process.env.ML_ACTION || 'challenge') as 'monitor' | 'challenge' | 'block',
  threshold: Number(process.env.ML_THRESHOLD || 0.75),
  autoRetrain: process.env.ML_AUTO_RETRAIN !== 'false',
  retrainIntervalHours: Number(process.env.ML_RETRAIN_INTERVAL_HOURS || 24),
  minTrainingSamples: Number(process.env.ML_MIN_TRAINING_SAMPLES || 500),

  model: {
    latentDim: Number(process.env.ML_LATENT_DIM || 8),
    hiddenDim: Number(process.env.ML_HIDDEN_DIM || 16),
    epochs: Number(process.env.ML_EPOCHS || 50),
    batchSize: Number(process.env.ML_BATCH_SIZE || 32),
    validationSplit: Number(process.env.ML_VALIDATION_SPLIT || 0.15)
  },

  thresholdStdFactor: Number(process.env.ML_THRESHOLD_STD_FACTOR || 2.5),

  modelPath: './server/ml/models/autoencoder',

  clientSide: {
    enabled: process.env.ML_CLIENT_SIDE_ENABLED === 'true'
  },

  // ═══════════════════════════════════════════
  //  Feature Vector Order (بسیار مهم برای consistency)
  // ═══════════════════════════════════════════
  featureOrder: [
    'hourOfDay',           // 0-23
    'dayOfWeek',           // 0-6
    'requestInterval',     // ms از درخواست قبلی
    'pathLength',
    'queryParamCount',
    'bodySize',
    'mouseEvents',
    'mouseAvgSpeed',
    'mouseLinearity',
    'keystrokes',
    'keystrokeVariance',
    'scrollEvents',
    'tabSwitches',
    'formFillTime',
    'sessionAge',          // ثانیه
    'ipChangeCount',
    'trustScore',          // 0-100
    'vpnRisk',
    'botRisk',
    'threatRisk'
  ] as const,

  // ═══════════════════════════════════════════
  //  Baseline Profiling
  // ═══════════════════════════════════════════
  baseline: {
    minSessions: 10,       // حداقل session برای پروفایل معتبر
    windowDays: 30,        // پنجره یادگیری عادت‌ها
    decayFactor: 0.95      // کاهش وزن داده‌های قدیمی
  }
} as const;

export type FeatureName = typeof ML_CONFIG.featureOrder[number];
```

---

🗄️ بهروزرسانی server/services/db.service.ts

```typescript
db.exec(`
  -- ───── ML Model Registry ─────
  CREATE TABLE IF NOT EXISTS ml_models (
    id TEXT PRIMARY KEY,
    model_type TEXT NOT NULL,              -- 'autoencoder' | 'isolation_forest'
    version INTEGER NOT NULL DEFAULT 1,
    feature_order TEXT NOT NULL,           -- JSON array
    normalization_params TEXT NOT NULL,    -- JSON: {min[], max[]}
    threshold REAL NOT NULL,
    mean_reconstruction REAL NOT NULL,
    std_reconstruction REAL NOT NULL,
    training_samples INTEGER NOT NULL,
    epochs INTEGER,
    loss REAL,
    validation_loss REAL,
    is_active INTEGER NOT NULL DEFAULT 0,
    trained_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_ml_models_active ON ml_models(is_active, trained_at);

  -- ───── Feature Vectors (دادهای برای آموزش) ─────
  CREATE TABLE IF NOT EXISTS ml_feature_vectors (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    session_id TEXT,
    visitor_id TEXT,
    ip_address TEXT,
    path TEXT,
    method TEXT,
    features TEXT NOT NULL,                -- JSON array (20 features)
    anomaly_score REAL,
    is_anomaly INTEGER DEFAULT 0,
    is_labeled INTEGER DEFAULT 0,          -- اگر ادمین برچسب زده
    label TEXT,                            -- 'normal' | 'anomalous'
    used_in_training INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_ml_fv_user ON ml_feature_vectors(user_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_ml_fv_training ON ml_feature_vectors(used_in_training, created_at);
  CREATE INDEX IF NOT EXISTS idx_ml_fv_anomaly ON ml_feature_vectors(is_anomaly, created_at);

  -- ───── User Baselines (پروفایل رفتاری هر کاربر) ─────
  CREATE TABLE IF NOT EXISTS ml_user_baselines (
    user_id TEXT PRIMARY KEY,
    baseline_features TEXT NOT NULL,       -- JSON: میانگین هر feature
    feature_stddev TEXT NOT NULL,          -- JSON: انحراف معیار هر feature
    sample_count INTEGER NOT NULL,
    last_updated_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- ───── Anomaly Events ─────
  CREATE TABLE IF NOT EXISTS ml_anomaly_events (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    session_id TEXT,
    ip_address TEXT,
    path TEXT,
    anomaly_score REAL NOT NULL,
    threshold REAL NOT NULL,
    reconstruction_error REAL,
    feature_vector TEXT,                   -- JSON
    top_deviations TEXT,                   -- JSON: کدام features بیشترین انحراف
    action TEXT NOT NULL,
    model_version INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_ml_events_user ON ml_anomaly_events(user_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_ml_events_score ON ml_anomaly_events(anomaly_score, created_at);

  -- ───── Training Runs ─────
  CREATE TABLE IF NOT EXISTS ml_training_runs (
    id TEXT PRIMARY KEY,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    samples_used INTEGER,
    epochs INTEGER,
    final_loss REAL,
    validation_loss REAL,
    threshold_computed REAL,
    mean_reconstruction REAL,
    std_reconstruction REAL,
    status TEXT NOT NULL DEFAULT 'running', -- 'running' | 'completed' | 'failed'
    error TEXT,
    model_id TEXT
  );
`);
```

---

🧠 server/ml/modelBuilder.ts — ساخت مدل Autoencoder

```typescript
import * as tf from '@tensorflow/tfjs-node';
import { ML_CONFIG } from '../config/mlAnomaly.config.js';

/**
 * ساخت Autoencoder برای anomaly detection
 *
 * معماری:
 *   Input (20) → Hidden (16) → Latent (8) → Hidden (16) → Output (20)
 *
 * autoencoder یاد می‌گیره داده‌های "عادی" رو بازسازی کنه.
 * هر چیزی که reconstruction error بالایی داشت → anomaly
 * [reference:1]
 */
export function buildAutoencoder(inputDim: number): tf.LayersModel {
  const model = tf.sequential();

  // ───── Encoder ─────
  model.add(tf.layers.dense({
    inputShape: [inputDim],
    units: ML_CONFIG.model.hiddenDim,
    activation: 'relu',
    kernelInitializer: 'heNormal'
  }));

  model.add(tf.layers.dropout({ rate: 0.1 }));

  model.add(tf.layers.dense({
    units: ML_CONFIG.model.latentDim,
    activation: 'relu',
    name: 'latent',
    kernelInitializer: 'heNormal'
  }));

  // ───── Decoder ─────
  model.add(tf.layers.dense({
    units: ML_CONFIG.model.hiddenDim,
    activation: 'relu',
    kernelInitializer: 'heNormal'
  }));

  model.add(tf.layers.dense({
    units: inputDim,
    activation: 'sigmoid'  // چون نرمال‌سازی 0-1 داریم
  }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mse']
  });

  return model;
}

/**
 * ساخت LSTM Autoencoder برای داده‌های سری زمانی
 * (اگر ویژگی‌ها ترتیبی هستند)
 */
export function buildLSTMAutoencoder(
  timeSteps: number,
  featuresPerStep: number
): tf.LayersModel {
  const model = tf.sequential();

  // ───── Encoder ─────
  model.add(tf.layers.lstm({
    inputShape: [timeSteps, featuresPerStep],
    units: ML_CONFIG.model.hiddenDim,
    returnSequences: false,
    name: 'encoder_lstm'
  }));

  model.add(tf.layers.repeatVector({ n: timeSteps }));

  // ───── Decoder ─────
  model.add(tf.layers.lstm({
    units: ML_CONFIG.model.hiddenDim,
    returnSequences: true,
    name: 'decoder_lstm'
  }));

  model.add(tf.layers.timeDistributed({
    layer: tf.layers.dense({
      units: featuresPerStep,
      activation: 'sigmoid'
    })
  }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError'
  });

  return model;
}
```

---

🧠 server/ml/featureExtractor.ts — استخراج ویژگی

```typescript
import { ML_CONFIG, FeatureName } from '../config/mlAnomaly.config.js';

export interface RawRequestContext {
  // زمان
  timestamp: number;
  // HTTP
  path: string;
  method: string;
  queryParams: Record<string, any>;
  bodySize: number;
  // نشست
  sessionCreatedAt?: number;
  lastRequestAt?: number;
  ipChangeCount?: number;
  // رفتاری (از کلاینت)
  behavioral?: {
    mouseEvents?: number;
    mouseAvgSpeed?: number;
    mouseLinearity?: number;
    keystrokes?: number;
    keystrokeVariance?: number;
    scrollEvents?: number;
    tabSwitches?: number;
    formFillTime?: number;
  };
  // امنیت (از لایه‌های قبلی)
  trustScore?: number;
  vpnRisk?: number;
  botRisk?: number;
  threatRisk?: number;
}

/**
 * تبدیل context خام به بردار ویژگی 20 بُعدی نرمال‌شده
 * ترتیب features ثابت است (ML_CONFIG.featureOrder)
 */
export function extractFeatures(ctx: RawRequestContext): number[] {
  const d = new Date(ctx.timestamp);

  const raw: Record<FeatureName, number> = {
    hourOfDay: d.getHours(),
    dayOfWeek: d.getDay(),
    requestInterval: ctx.lastRequestAt
      ? Math.min(60000, ctx.timestamp - ctx.lastRequestAt)
      : 0,
    pathLength: ctx.path.length,
    queryParamCount: Object.keys(ctx.queryParams || {}).length,
    bodySize: Math.min(100000, ctx.bodySize || 0),
    mouseEvents: ctx.behavioral?.mouseEvents || 0,
    mouseAvgSpeed: ctx.behavioral?.mouseAvgSpeed || 0,
    mouseLinearity: ctx.behavioral?.mouseLinearity || 0,
    keystrokes: ctx.behavioral?.keystrokes || 0,
    keystrokeVariance: ctx.behavioral?.keystrokeVariance || 0,
    scrollEvents: ctx.behavioral?.scrollEvents || 0,
    tabSwitches: ctx.behavioral?.tabSwitches || 0,
    formFillTime: ctx.behavioral?.formFillTime || 0,
    sessionAge: ctx.sessionCreatedAt
      ? Math.min(86400, (ctx.timestamp - ctx.sessionCreatedAt) / 1000)
      : 0,
    ipChangeCount: ctx.ipChangeCount || 0,
    trustScore: ctx.trustScore ?? 50,
    vpnRisk: ctx.vpnRisk || 0,
    botRisk: ctx.botRisk || 0,
    threatRisk: ctx.threatRisk || 0
  };

  // ترتیب رو دقیقاً حفظ کن
  return ML_CONFIG.featureOrder.map(name => raw[name]);
}

/**
 * نرمال‌سازی min-max به بازه [0, 1]
 * [reference:2]
 */
export function normalize(
  features: number[],
  mins: number[],
  maxs: number[]
): number[] {
  return features.map((val, i) => {
    const range = maxs[i] - mins[i];
    if (range === 0) return 0;
    return Math.max(0, Math.min(1, (val - mins[i]) / range));
  });
}

/**
 * محاسبه min/max از مجموعه داده
 */
export function computeMinMax(data: number[][]): { mins: number[]; maxs: number[] } {
  const numFeatures = data[0]?.length || ML_CONFIG.featureOrder.length;
  const mins = Array(numFeatures).fill(Infinity);
  const maxs = Array(numFeatures).fill(-Infinity);

  for (const row of data) {
    for (let i = 0; i < numFeatures; i++) {
      if (row[i] < mins[i]) mins[i] = row[i];
      if (row[i] > maxs[i]) maxs[i] = row[i];
    }
  }

  // جلوگیری از range=0
  for (let i = 0; i < numFeatures; i++) {
    if (maxs[i] === mins[i]) {
      maxs[i] = mins[i] + 1;
    }
  }

  return { mins, maxs };
}
```

---

🧠 server/ml/dataPreprocessor.ts — پیشپردازش

```typescript
import * as tf from '@tensorflow/tfjs-node';
import { computeMinMax } from './featureExtractor.js';

export interface PreprocessedData {
  tensor: tf.Tensor2D;
  mins: number[];
  maxs: number[];
  samples: number;
}

export function preprocessForTraining(
  featureVectors: number[][]
): PreprocessedData {
  if (featureVectors.length === 0) {
    throw new Error('No training data');
  }

  const { mins, maxs } = computeMinMax(featureVectors);

  const normalized = featureVectors.map(vec =>
    vec.map((val, i) => {
      const range = maxs[i] - mins[i];
      if (range === 0) return 0;
      return Math.max(0, Math.min(1, (val - mins[i]) / range));
    })
  );

  const tensor = tf.tensor2d(normalized);

  return {
    tensor,
    mins,
    maxs,
    samples: featureVectors.length
  };
}

/**
 * محاسبه reconstruction error
 */
export function computeReconstructionError(
  original: tf.Tensor2D,
  reconstructed: tf.Tensor2D
): tf.Tensor1D {
  return tf.tidy(() => {
    const diff = original.sub(reconstructed);
    const squared = diff.square();
    // میانگین روی محور features
    return squared.mean(1) as tf.Tensor1D;
  });
}
```

---

🧠 server/services/mlTraining.service.ts — آموزش مدل

```typescript
import * as tf from '@tensorflow/tfjs-node';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ML_CONFIG } from '../config/mlAnomaly.config.js';
import { buildAutoencoder } from '../ml/modelBuilder.js';
import { preprocessForTraining, computeReconstructionError } from '../ml/dataPreprocessor.js';
import db from './db.service.js';

export class MlTrainingService {
  /**
   * آموزش مدل با داده‌های تاریخی
   */
  async train(): Promise<{
    modelId: string;
    samples: number;
    threshold: number;
    loss: number;
    validationLoss: number;
  }> {
    const runId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO ml_training_runs (id, started_at, status)
      VALUES (?, ?, 'running')
    `).run(runId, Date.now());

    try {
      // ───── 1. جمع‌آوری داده ─────
      const rows = db.prepare(`
        SELECT features FROM ml_feature_vectors 
        WHERE used_in_training = 0 
          AND (is_anomaly = 0 OR is_labeled = 1)
          AND created_at > ?
        ORDER BY created_at DESC
        LIMIT 50000
      `).all(Date.now() - 30 * 24 * 3600 * 1000) as { features: string }[];

      if (rows.length < ML_CONFIG.minTrainingSamples) {
        throw new Error(`Insufficient samples: ${rows.length} < ${ML_CONFIG.minTrainingSamples}`);
      }

      console.log(`[ML] Training with ${rows.length} samples`);

      const vectors = rows.map(r => JSON.parse(r.features) as number[]);

      // ───── 2. پیش‌پردازش ─────
      const { tensor, mins, maxs } = preprocessForTraining(vectors);
      const inputDim = vectors[0].length;

      // ───── 3. ساخت و آموزش ─────
      const model = buildAutoencoder(inputDim);

      const history = await model.fit(tensor, tensor, {
        epochs: ML_CONFIG.model.epochs,
        batchSize: ML_CONFIG.model.batchSize,
        validationSplit: ML_CONFIG.model.validationSplit,
        shuffle: true,
        verbose: 0,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`[ML] Epoch ${epoch}/${ML_CONFIG.model.epochs} - loss: ${logs?.loss?.toFixed(5)}`);
            }
          }
        }
      });

      const finalLoss = history.history.loss[history.history.loss.length - 1] as number;
      const finalValLoss = history.history.val_loss
        ? (history.history.val_loss[history.history.val_loss.length - 1] as number)
        : finalLoss;

      // ───── 4. محاسبه threshold ─────
      // reconstruction error روی داده‌های normal
      const reconstructed = model.predict(tensor) as tf.Tensor;
      const errorsTensor = computeReconstructionError(tensor, reconstructed as tf.Tensor2D);
      const errors = await errorsTensor.data();

      const mean = errors.reduce((a, b) => a + b, 0) / errors.length;
      const variance = errors.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / errors.length;
      const std = Math.sqrt(variance);

      // threshold = μ + kσ  [reference:3]
      const threshold = mean + ML_CONFIG.thresholdStdFactor * std;

      console.log(`[ML] Threshold: ${threshold.toFixed(5)} (μ=${mean.toFixed(5)}, σ=${std.toFixed(5)})`);

      // ───── 5. ذخیره مدل ─────
      const version = await this.getNextVersion();
      const modelDir = `${ML_CONFIG.modelPath}/v${version}`;
      const fullPath = path.resolve(modelDir);

      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }

      await model.save(`file://${fullPath}`);

      // ───── 6. ذخیره metadata ─────
      const modelId = crypto.randomUUID();

      // غیرفعال کردن مدل قبلی
      db.prepare('UPDATE ml_models SET is_active = 0 WHERE model_type = ?')
        .run('autoencoder');

      db.prepare(`
        INSERT INTO ml_models 
          (id, model_type, version, feature_order, normalization_params,
           threshold, mean_reconstruction, std_reconstruction, training_samples,
           epochs, loss, validation_loss, is_active, trained_at, created_at)
        VALUES (?, 'autoencoder', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(
        modelId,
        version,
        JSON.stringify(ML_CONFIG.featureOrder),
        JSON.stringify({ mins, maxs }),
        threshold,
        mean,
        std,
        rows.length,
        ML_CONFIG.model.epochs,
        finalLoss,
        finalValLoss,
        Date.now(),
        Date.now()
      );

      // علامت‌گذاری داده‌های استفاده‌شده
      db.prepare(`
        UPDATE ml_feature_vectors SET used_in_training = 1
        WHERE used_in_training = 0
      `).run();

      // به‌روزرسانی training run
      db.prepare(`
        UPDATE ml_training_runs SET
          completed_at = ?, samples_used = ?, epochs = ?, final_loss = ?,
          validation_loss = ?, threshold_computed = ?, mean_reconstruction = ?,
          std_reconstruction = ?, status = 'completed', model_id = ?
        WHERE id = ?
      `).run(
        Date.now(), rows.length, ML_CONFIG.model.epochs, finalLoss,
        finalValLoss, threshold, mean, std, modelId, runId
      );

      // پاکسازی memory
      tensor.dispose();
      reconstructed.dispose();
      errorsTensor.dispose();
      model.dispose();

      console.log(`[ML] Training completed: modelId=${modelId}, version=${version}`);

      return {
        modelId,
        samples: rows.length,
        threshold,
        loss: finalLoss,
        validationLoss: finalValLoss
      };
    } catch (err: any) {
      db.prepare(`
        UPDATE ml_training_runs SET
          completed_at = ?, status = 'failed', error = ?
        WHERE id = ?
      `).run(Date.now(), err.message, runId);
      throw err;
    }
  }

  private async getNextVersion(): Promise<number> {
    const row = db.prepare('SELECT MAX(version) as max_v FROM ml_models WHERE model_type = ?')
      .get('autoencoder') as { max_v: number | null };
    return (row?.max_v || 0) + 1;
  }

  getTrainingRuns(limit = 20) {
    return db.prepare(`
      SELECT * FROM ml_training_runs ORDER BY started_at DESC LIMIT ?
    `).all(limit);
  }
}

export const mlTrainingService = new MlTrainingService();
```

---

🧠 server/services/mlAnomaly.service.ts — هسته اصلی

```typescript
import * as tf from '@tensorflow/tfjs-node';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ML_CONFIG } from '../config/mlAnomaly.config.js';
import { extractFeatures, normalize } from '../ml/featureExtractor.js';
import db from './db.service.js';

export interface AnomalyResult {
  isAnomaly: boolean;
  score: number;                    // 0-1 (normalized)
  reconstructionError: number;
  threshold: number;
  topDeviations: { feature: string; value: number; deviation: number }[];
  modelVersion: number;
  action: 'allow' | 'challenge' | 'block';
}

interface LoadedModel {
  model: tf.LayersModel;
  version: number;
  threshold: number;
  mins: number[];
  maxs: number[];
  meanReconstruction: number;
  stdReconstruction: number;
  loadedAt: number;
}

export class MlAnomalyService {
  private loaded: LoadedModel | null = null;
  private loading: Promise<void> | null = null;

  /**
   * بارگذاری مدل فعال
   */
  async loadModel(): Promise<void> {
    if (this.loading) return this.loading;

    this.loading = (async () => {
      const row = db.prepare(`
        SELECT * FROM ml_models 
        WHERE model_type = 'autoencoder' AND is_active = 1
        ORDER BY trained_at DESC LIMIT 1
      `).get() as any;

      if (!row) {
        console.warn('[ML] No active model found');
        return;
      }

      const modelDir = path.resolve(`${ML_CONFIG.modelPath}/v${row.version}`);
      if (!fs.existsSync(modelDir)) {
        console.warn(`[ML] Model dir not found: ${modelDir}`);
        return;
      }

      const model = await tf.loadLayersModel(`file://${modelDir}/model.json`);
      const normParams = JSON.parse(row.normalization_params);

      this.loaded = {
        model,
        version: row.version,
        threshold: row.threshold,
        mins: normParams.mins,
        maxs: normParams.maxs,
        meanReconstruction: row.mean_reconstruction,
        stdReconstruction: row.std_reconstruction,
        loadedAt: Date.now()
      };

      console.log(`[ML] Model v${row.version} loaded (threshold=${row.threshold.toFixed(5)})`);
    })();

    return this.loading;
  }

  /**
   * چک کردن یک درخواست برای anomaly
   */
  async check(ctx: Parameters<typeof extractFeatures>[0]): Promise<AnomalyResult> {
    if (!ML_CONFIG.enabled) {
      return this.emptyResult();
    }

    // بارگذاری lazy
    if (!this.loaded) {
      await this.loadModel();
    }

    if (!this.loaded) {
      return this.emptyResult();
    }

    // ───── 1. استخراج و نرمال‌سازی features ─────
    const rawFeatures = extractFeatures(ctx);
    const normalized = normalize(rawFeatures, this.loaded.mins, this.loaded.maxs);

    // ───── 2. inference ─────
    const result = tf.tidy(() => {
      const input = tf.tensor2d([normalized]);
      const reconstructed = this.loaded!.model.predict(input) as tf.Tensor;
      const diff = input.sub(reconstructed);
      const squared = diff.square();
      const error = squared.mean().dataSync()[0];
      return { error };
    });

    const reconstructionError = result.error;

    // ───── 3. محاسبه anomaly score (نرمال‌شده 0-1) ─────
    // score = sigmoid((error - threshold) / std)
    const zScore = (reconstructionError - this.loaded.meanReconstruction) /
                   (this.loaded.stdReconstruction || 1);
    const score = 1 / (1 + Math.exp(-zScore + ML_CONFIG.thresholdStdFactor));

    const isAnomaly = score >= ML_CONFIG.threshold;

    // ───── 4. top deviations ─────
    const topDeviations = this.findTopDeviations(
      rawFeatures,
      normalized,
      this.loaded.mins,
      this.loaded.maxs
    );

    // ───── 5. action ─────
    let action: AnomalyResult['action'] = 'allow';
    if (isAnomaly) {
      action = ML_CONFIG.action === 'block' ? 'block'
             : ML_CONFIG.action === 'challenge' ? 'challenge'
             : 'allow';
    }

    // ───── 6. ذخیره feature vector برای آموزش آینده ─────
    this.saveFeatureVector(ctx, rawFeatures, score, isAnomaly);

    // ───── 7. لاگ رویداد anomaly ─────
    if (isAnomaly) {
      this.logAnomalyEvent({
        userId: (ctx as any).userId,
        sessionId: (ctx as any).sessionId,
        ipAddress: (ctx as any).ipAddress,
        path: ctx.path,
        score,
        threshold: this.loaded.threshold,
        reconstructionError,
        featureVector: rawFeatures,
        topDeviations,
        action
      });
    }

    return {
      isAnomaly,
      score,
      reconstructionError,
      threshold: this.loaded.threshold,
      topDeviations,
      modelVersion: this.loaded.version,
      action
    };
  }

  /**
   * پیدا کردن feature هایی که بیشترین انحراف از حالت عادی رو دارند
   */
  private findTopDeviations(
    raw: number[],
    normalized: number[],
    mins: number[],
    maxs: number[]
  ) {
    const featureNames = ML_CONFIG.featureOrder;

    return featureNames
      .map((name, i) => {
        // نرمال‌سازی در بازه [0,1] → فاصله از 0.5 = درجه انحراف
        const deviation = Math.abs(normalized[i] - 0.5) * 2;
        return { feature: name, value: raw[i], deviation };
      })
      .sort((a, b) => b.deviation - a.deviation)
      .slice(0, 5);
  }

  private saveFeatureVector(
    ctx: any,
    features: number[],
    score: number,
    isAnomaly: boolean
  ) {
    try {
      db.prepare(`
        INSERT INTO ml_feature_vectors 
          (id, user_id, session_id, visitor_id, ip_address, path, method,
           features, anomaly_score, is_anomaly, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        ctx.userId || null,
        ctx.sessionId || null,
        ctx.visitorId || null,
        ctx.ipAddress || null,
        ctx.path,
        ctx.method,
        JSON.stringify(features),
        score,
        isAnomaly ? 1 : 0,
        Date.now()
      );
    } catch (err) {
      console.error('[ML] saveFeatureVector error:', err);
    }
  }

  private logAnomalyEvent(params: {
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    path: string;
    score: number;
    threshold: number;
    reconstructionError: number;
    featureVector: number[];
    topDeviations: any[];
    action: string;
  }) {
    try {
      db.prepare(`
        INSERT INTO ml_anomaly_events 
          (id, user_id, session_id, ip_address, path, anomaly_score, threshold,
           reconstruction_error, feature_vector, top_deviations, action,
           model_version, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        params.userId || null,
        params.sessionId || null,
        params.ipAddress || null,
        params.path,
        params.score,
        params.threshold,
        params.reconstructionError,
        JSON.stringify(params.featureVector),
        JSON.stringify(params.topDeviations),
        params.action,
        this.loaded?.version || 0,
        Date.now()
      );
    } catch (err) {
      console.error('[ML] logAnomalyEvent error:', err);
    }
  }

  private emptyResult(): AnomalyResult {
    return {
      isAnomaly: false,
      score: 0,
      reconstructionError: 0,
      threshold: 0,
      topDeviations: [],
      modelVersion: 0,
      action: 'allow'
    };
  }

  // ═══════════════════════════════════════════
  //  Stats
  // ═══════════════════════════════════════════
  getStats() {
    const model = db.prepare(`
      SELECT * FROM ml_models WHERE model_type = 'autoencoder' AND is_active = 1
      ORDER BY trained_at DESC LIMIT 1
    `).get() as any;

    const totalVectors = db.prepare('SELECT COUNT(*) as c FROM ml_feature_vectors')
      .get() as { c: number };

    const anomalies24h = db.prepare(`
      SELECT COUNT(*) as c FROM ml_anomaly_events 
      WHERE created_at > ?
    `).get(Date.now() - 24 * 3600 * 1000) as { c: number };

    const recentAnomalies = db.prepare(`
      SELECT * FROM ml_anomaly_events 
      ORDER BY created_at DESC LIMIT 30
    `).all();

    const scoreDistribution = db.prepare(`
      SELECT 
        CASE 
          WHEN anomaly_score < 0.3 THEN 'low'
          WHEN anomaly_score < 0.6 THEN 'medium'
          WHEN anomaly_score < 0.8 THEN 'high'
          ELSE 'critical'
        END as bucket,
        COUNT(*) as count
      FROM ml_anomaly_events
      WHERE created_at > ?
      GROUP BY bucket
    `).all(Date.now() - 7 * 24 * 3600 * 1000);

    return {
      enabled: ML_CONFIG.enabled,
      action: ML_CONFIG.action,
      threshold: ML_CONFIG.threshold,
      modelLoaded: !!this.loaded,
      activeModel: model ? {
        id: model.id,
        version: model.version,
        threshold: model.threshold,
        meanReconstruction: model.mean_reconstruction,
        stdReconstruction: model.std_reconstruction,
        trainingSamples: model.training_samples,
        loss: model.loss,
        validationLoss: model.validation_loss,
        trainedAt: model.trained_at
      } : null,
      totalFeatureVectors: totalVectors.c,
      anomalies24h: anomalies24h.c,
      recentAnomalies,
      scoreDistribution
    };
  }

  getModelInfo() {
    return db.prepare(`
      SELECT * FROM ml_models WHERE model_type = 'autoencoder'
      ORDER BY version DESC
    `).all();
  }

  /**
   * بازآموزی دستی
   */
  async retrain() {
    const { mlTrainingService } = await import('./mlTraining.service.js');
    return mlTrainingService.train();
  }

  /**
   * برچسب‌گذاری دستی برای بهبود مدل
   */
  labelFeatureVector(id: string, label: 'normal' | 'anomalous') {
    db.prepare(`
      UPDATE ml_feature_vectors 
      SET is_labeled = 1, label = ?, is_anomaly = ?
      WHERE id = ?
    `).run(label, label === 'anomalous' ? 1 : 0, id);
  }

  /**
   * پاکسازی vector های قدیمی
   */
  cleanupVectors(daysToKeep = 90) {
    const cutoff = Date.now() - daysToKeep * 86400 * 1000;
    const result = db.prepare(`
      DELETE FROM ml_feature_vectors 
      WHERE created_at < ? AND used_in_training = 1 AND is_labeled = 0
    `).run(cutoff);
    return result.changes;
  }
}

export const mlAnomalyService = new MlAnomalyService();
```

---

🛡️ server/middleware/mlAnomaly.middleware.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { mlAnomalyService } from '../services/mlAnomaly.service.js';
import { ML_CONFIG } from '../config/mlAnomaly.config.js';
import { securityService } from '../services/security.service.js';
import { sessionBindingService } from '../services/sessionBinding.service.js';

declare global {
  namespace Express {
    interface Request {
      mlAnomaly?: any;
    }
  }
}

export async function mlAnomalyGuard(req: Request, res: Response, next: NextFunction) {
  if (!ML_CONFIG.enabled) return next();

  const user = (req as any).user;
  const ip = req.ip || 'unknown';
  const sessionId = user?.jti || user?.sessionId;

  // جمع‌آوری context
  const bodySize = req.body ? JSON.stringify(req.body).length : 0;

  const session = sessionId ? sessionBindingService.get(sessionId) : null;

  try {
    const result = await mlAnomalyService.check({
      timestamp: Date.now(),
      path: req.path,
      method: req.method,
      queryParams: req.query as any,
      bodySize,
      sessionCreatedAt: session?.created_at,
      lastRequestAt: session?.last_evaluated_at,
      ipChangeCount: session
        ? JSON.parse(session.ip_history || '[]').length - 1
        : 0,
      behavioral: req.body?.__behavior,
      trustScore: (req as any).zt?.trust?.score,
      vpnRisk: (req as any).vpnDetection?.riskScore,
      botRisk: (req as any).botDetection?.riskScore,
      threatRisk: (req as any).threatIntel?.riskScore,
      // context fields
      userId: user?.sub,
      sessionId,
      ipAddress: ip,
      visitorId: req.body?.__visitorId || req.headers['x-visitor-id'],
      method: req.method
    } as any);

    req.mlAnomaly = result;

    // ───── لاگ در suspicious_activity ─────
    if (result.isAnomaly) {
      securityService.logSuspicious({
        userId: user?.sub,
        ipAddress: ip,
        userAgent: req.headers['user-agent'],
        activityType: 'ml_anomaly_detected',
        severity: result.score > 0.9 ? 'high' : 'medium',
        details: {
          score: result.score,
          threshold: result.threshold,
          reconstructionError: result.reconstructionError,
          topDeviations: result.topDeviations,
          modelVersion: result.modelVersion
        }
      });
    }

    // ───── Action ─────
    switch (result.action) {
      case 'block':
        return res.status(403).json({
          success: false,
          code: 'ML_ANOMALY_BLOCKED',
          error: 'Request blocked by anomaly detection',
          score: result.score,
          topDeviations: result.topDeviations
        });

      case 'challenge':
        return res.status(403).json({
          success: false,
          code: 'ML_ANOMALY_CHALLENGE',
          error: 'Unusual activity detected, verification required',
          score: result.score,
          topDeviations: result.topDeviations
        });

      case 'allow':
      default:
        return next();
    }
  } catch (err) {
    console.error('[ML] anomaly guard error:', err);
    next(); // fail-open
  }
}

/**
 * نسخه سبک — فقط attach
 */
export async function attachMlProfile(req: Request, _res: Response, next: NextFunction) {
  if (!ML_CONFIG.enabled) return next();
  const user = (req as any).user;
  const ip = req.ip || 'unknown';
  try {
    req.mlAnomaly = await mlAnomalyService.check({
      timestamp: Date.now(),
      path: req.path,
      method: req.method,
      queryParams: req.query as any,
      bodySize: req.body ? JSON.stringify(req.body).length : 0,
      userId: user?.sub,
      ipAddress: ip,
      sessionId: user?.jti || user?.sessionId
    } as any);
  } catch {}
  next();
}
```

---

🛣️ server/routes/mlAnomaly.routes.ts

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { mlAnomalyService } from '../services/mlAnomaly.service.js';
import { mlTrainingService } from '../services/mlTraining.service.js';
import db from '../services/db.service.js';

const router = Router();

// ───── ادمین ─────
router.use(requireAuth, requireRole('admin'));

router.get('/stats', (_req, res) => {
  res.json({ success: true, data: mlAnomalyService.getStats() });
});

router.get('/models', (_req, res) => {
  res.json({ success: true, data: mlAnomalyService.getModelInfo() });
});

router.get('/training-runs', (_req, res) => {
  res.json({ success: true, data: mlTrainingService.getTrainingRuns() });
});

// ───── Train ─────
router.post('/train', async (_req, res, next) => {
  try {
    const result = await mlAnomalyService.retrain();
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ───── Anomalies list ─────
router.get('/anomalies', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const minScore = Number(req.query.minScore) || 0;

  const rows = db.prepare(`
    SELECT * FROM ml_anomaly_events 
    WHERE anomaly_score >= ?
    ORDER BY created_at DESC LIMIT ?
  `).all(minScore, limit);

  res.json({ success: true, data: rows });
});

// ───── Label a feature vector ─────
router.post('/label/:id', (req, res, next) => {
  try {
    const schema = z.object({ label: z.enum(['normal', 'anomalous']) });
    const { label } = schema.parse(req.body);
    mlAnomalyService.labelFeatureVector(req.params.id, label);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ───── Cleanup ─────
router.post('/cleanup', (req, res) => {
  const days = Number(req.body?.daysToKeep) || 90;
  const removed = mlAnomalyService.cleanupVectors(days);
  res.json({ success: true, data: { removed } });
});

// ───── Force reload model ─────
router.post('/reload', async (_req, res, next) => {
  try {
    await mlAnomalyService.loadModel();
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
```

---

🖥️ server/index.ts — ترتیب نهایی

```typescript
import mlRoutes from './routes/mlAnomaly.routes.js';
import { mlAnomalyGuard } from './middleware/mlAnomaly.middleware.js';
import { mlAnomalyService } from './services/mlAnomaly.service.js';

// ... بعد از راه‌اندازی سرویس‌ها ...

// بارگذاری مدل ML در startup
await mlAnomalyService.loadModel();

// روت‌های ادمین
app.use('/api/ml', mlRoutes);

// روی روت‌های حساس (بعد از zeroTrustGuard)
app.use('/api/wallet', requireAuth, zeroTrustGuard, mlAnomalyGuard, walletRoutes);
app.use('/api/tx', requireAuth, zeroTrustGuard, mlAnomalyGuard, txRoutes);
```

ترتیب نهایی لایه‌های امنیتی (10 لایه):

```
L1:  ipAccessGuard          → IP whitelist/blacklist
L2:  geoBlockGuard          → Geo blocking
L3:  attachVpnProfile       → VPN detection
L4:  attachBotProfile       → Bot fingerprint
L5:  attachThreatProfile    → Threat Intel
L6:  globalLimiter          → Rate limit
L7:  requireAuth            → JWT
L8:  zeroTrustGuard         → PDP + Trust Score
L9:  mlAnomalyGuard         → ML Anomaly Detection  ← جدید
L10: Route Handler
```

---

🖥️ کامپوننت src/components/admin/MlAnomalyPanel.tsx

```tsx
import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';

export const MlAnomalyPanel: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [training, setTraining] = useState(false);
  const [minScore, setMinScore] = useState(0.5);

  const load = async () => {
    const [s, a] = await Promise.all([
      apiClient.mlStats(),
      apiClient.mlAnomalies(minScore)
    ]);
    setStats(s);
    setAnomalies(a);
  };

  useEffect(() => { load(); }, [minScore]);

  const handleTrain = async () => {
    if (!confirm('شروع آموزش مدل جدید؟ (ممکنه چند دقیقه طول بکشه)')) return;
    setTraining(true);
    try {
      const result = await apiClient.mlTrain();
      alert(`✅ آموزش تمام شد!\nSamples: ${result.samples}\nThreshold: ${result.threshold.toFixed(4)}\nLoss: ${result.loss.toFixed(5)}`);
      load();
    } catch (err: any) {
      alert('❌ خطا: ' + err.message);
    } finally {
      setTraining(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return '#dc2626';
    if (score >= 0.75) return '#ef4444';
    if (score >= 0.5) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="admin-panel">
      <h2>🧠 ML-based Anomaly Detection</h2>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span>وضعیت</span>
            <strong>{stats.enabled ? '✅ فعال' : '⛔ غیرفعال'}</strong>
          </div>
          <div className="stat-card">
            <span>مدل بارگذاری‌شده</span>
            <strong>{stats.modelLoaded ? '✅' : '⛔'}</strong>
          </div>
          <div className="stat-card">
            <span>Model Version</span>
            <strong>v{stats.activeModel?.version || '—'}</strong>
          </div>
          <div className="stat-card red">
            <span>Anomalies (24h)</span>
            <strong>{stats.anomalies24h?.toLocaleString()}</strong>
          </div>
          <div className="stat-card">
            <span>Total Vectors</span>
            <strong>{stats.totalFeatureVectors?.toLocaleString()}</strong>
          </div>
          {stats.activeModel && (
            <div className="stat-card">
              <span>Threshold</span>
              <strong>{stats.activeModel.threshold.toFixed(4)}</strong>
            </div>
          )}
        </div>
      )}

      {/* ───── Actions ───── */}
      <div className="ml-actions">
        <button className="btn-primary" onClick={handleTrain} disabled={training}>
          {training ? '⏳ در حال آموزش…' : '🎓 آموزش مدل جدید'}
        </button>
        <button
          className="btn-secondary"
          onClick={() => apiClient.mlReload().then(load)}
        >
          🔄 بازگذاری مدل
        </button>
      </div>

      {/* ───── Model Info ───── */}
      {stats?.activeModel && (
        <div className="model-info-card">
          <h3>📊 اطلاعات مدل فعال</h3>
          <div className="model-metrics">
            <div><b>Version:</b> v{stats.activeModel.version}</div>
            <div><b>Samples:</b> {stats.activeModel.trainingSamples.toLocaleString()}</div>
            <div><b>Loss:</b> {stats.activeModel.loss?.toFixed(6)}</div>
            <div><b>Val Loss:</b> {stats.activeModel.validationLoss?.toFixed(6)}</div>
            <div><b>Mean Recon:</b> {stats.activeModel.meanReconstruction?.toFixed(5)}</div>
            <div><b>Std Recon:</b> {stats.activeModel.stdReconstruction?.toFixed(5)}</div>
            <div><b>آخرین آموزش:</b> {new Date(stats.activeModel.trainedAt).toLocaleString('fa-IR')}</div>
          </div>
        </div>
      )}

      {/* ───── Filter ───── */}
      <div className="filter-bar">
        <label>
          حداقل anomaly score:
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={minScore}
            onChange={e => setMinScore(Number(e.target.value))}
          />
          <strong>{minScore.toFixed(2)}</strong>
        </label>
      </div>

      {/* ───── Anomalies Table ───── */}
      <h3>رویدادهای Anomaly</h3>
      <table className="admin-table compact">
        <thead>
          <tr>
            <th>Score</th>
            <th>Path</th>
            <th>User</th>
            <th>IP</th>
            <th>Top Deviations</th>
            <th>Action</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {anomalies.map(a => {
            const devs = JSON.parse(a.top_deviations || '[]');
            return (
              <tr key={a.id}>
                <td>
                  <span
                    className="score-badge"
                    style={{ background: getScoreColor(a.anomaly_score) }}
                  >
                    {a.anomaly_score.toFixed(3)}
                  </span>
                </td>
                <td><code>{a.path}</code></td>
                <td>{a.user_id?.slice(0, 8) || '—'}…</td>
                <td><code dir="ltr">{a.ip_address}</code></td>
                <td className="flags-cell">
                  {devs.slice(0, 3).map((d: any, i: number) => (
                    <span key={i} className="flag-chip">
                      {d.feature} ({d.deviation.toFixed(2)})
                    </span>
                  ))}
                </td>
                <td><span className={`badge ${a.action}`}>{a.action}</span></td>
                <td>{new Date(a.created_at).toLocaleString('fa-IR')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
```

---

🌐 متدهای جدید src/api/client.ts

```typescript
// ───── ML Anomaly Detection ─────
mlStats: () =>
  request<any>('/ml/stats'),

mlModels: () =>
  request<any[]>('/ml/models'),

mlTrainingRuns: () =>
  request<any[]>('/ml/training-runs'),

mlTrain: () =>
  request<any>('/ml/train', { method: 'POST' }),

mlAnomalies: (minScore = 0, limit = 100) =>
  request<any[]>(`/ml/anomalies?minScore=${minScore}&limit=${limit}`),

mlLabel: (id: string, label: 'normal' | 'anomalous') =>
  request<{}>(`/ml/label/${id}`, {
    method: 'POST',
    body: JSON.stringify({ label })
  }),

mlReload: () =>
  request<{}>('/ml/reload', { method: 'POST' }),

mlCleanup: (daysToKeep = 90) =>
  request<{ removed: number }>('/ml/cleanup', {
    method: 'POST',
    body: JSON.stringify({ daysToKeep })
  })
```

---

🎨 استایلهای اضافی

```css
.ml-actions {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.model-info-card {
  padding: 20px;
  background: #0d0f14;
  border-radius: 12px;
  border: 1px solid #2a2f3d;
  margin-bottom: 20px;
}
.model-info-card h3 {
  margin-bottom: 14px;
  color: #a4acbd;
  font-size: 0.95rem;
}
.model-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  font-size: 0.88rem;
  color: #a4acbd;
}
.model-metrics b { color: #e7e9ee; }

.filter-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: #0d0f14;
  border-radius: 10px;
  margin-bottom: 16px;
}
.filter-bar label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #a4acbd;
  font-size: 0.9rem;
}
.filter-bar input[type="range"] { width: 200px; }
.filter-bar strong { color: #6c7cff; min-width: 40px; }

.score-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  color: #fff;
  font-weight: 700;
  font-size: 0.82rem;
  font-family: monospace;
}
```

---

🧪 تست سریع

```bash
# ───── 1. شبیه‌سازی داده برای آموزش ─────
# (بعد از چند ساعت کار عادی، DB پر میشه)

# ───── 2. شروع آموزش ─────
curl -X POST http://localhost:3001/api/ml/train \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
# → { modelId, samples: 2500, threshold: 0.0234, loss: 0.0012 }

# ───── 3. آمار ─────
curl http://localhost:3001/api/ml/stats \
  -H "Authorization: Bearer <ADMIN_TOKEN>" | jq

# ───── 4. رویدادهای anomaly ─────
curl "http://localhost:3001/api/ml/anomalies?minScore=0.7" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" | jq

# ───── 5. برچسب‌گذاری ─────
curl -X POST http://localhost:3001/api/ml/label/<vector_id> \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"label":"anomalous"}'
```

---

✅ خلاصه ویژگیهای ML Anomaly Detection

ویژگی توضیح
🧠 Autoencoder 20→16→8→16→20، آموزش unsupervised
📊 Feature Extraction 20 feature از HTTP + رفتاری + امنیتی
🔢 Min-Max Normalization نرمالسازی به [0,1] با حفظ params
🎯 Adaptive Threshold μ + kσ (k=2.5) از داده normal
🔬 Top Deviations تشخیص اینکه کدوم feature بیشترین انحراف رو داشته
💾 Model Registry versioning + metadata کامل در DB
🔄 Auto Retrain آموزش خودکار هر 24 ساعت
🏷️ Manual Labeling ادمین میتونه برچسب بزنه برای بهبود
📦 Feature Vector Store همه vector ها برای آموزش آینده ذخیره میشن
🔗 اتصال به ZTA trustScore به عنوان feature استفاده میشه
📊 Admin UI آموزش + آمار + جدول anomalies + برچسبگذاری
🛡️ Fail-Open اگر مدل بارگذاری نشد، اجازه میده

معماری نهایی (10 لایه امنیتی):

```
┌──────────────────────────────────────────────────────────────┐
│  L1:  IP Access Control (whitelist/blacklist)                │
│  L2:  Geo Blocking (country/city/ASN)                        │
│  L3:  VPN/Proxy/Tor Detection                                │
│  L4:  Bot Detection (fingerprint + behavior)                 │
│  L5:  Threat Intelligence (AbuseIPDB + Spamhaus)             │
│  L6:  Rate Limiting (global + per-route)                     │
│  L7:  Brute-force Protection (lockout + ban)                 │
│  L8:  Authentication (Password + OAuth + 2FA)                │
│  L9:  Zero Trust (Trust Score + PDP + Session Binding)       │
│  L10: ML ANOMALY DETECTION (Autoencoder + TF.js)             │ ← جدید
└──────────────────────────────────────────────────────────────┘
```

نکات مهم پیادهسازی:

· مدل با دادههای normal آموزش میبینه (unsupervised) و هر چیزی که reconstruction error بالایی داشت anomaly هست
· threshold به صورت خودکار از μ + 2.5σ محاسبه میشه تا با تغییر رفتار تطبیق پیدا کنه
· هر feature vector ذخیره میشه تا مدل بتونه به مرور زمان بهتر بشه
· ادمین میتونه false positive ها رو برچسب بزنه تا آموزش بعدی دقیقتر بشه
