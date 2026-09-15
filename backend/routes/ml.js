import express from 'express';
import { runMLInference } from '../services/mlEngine.js';
import { getBinanceKlines } from '../services/binanceService.js';
import { generateMockCandles } from '../services/mockDataService.js';

const router = express.Router();

/**
 * POST /api/ml/predict
 * Body: { candles?: array, symbol?: string, interval?: string }
 */
router.post('/ml/predict', async (req, res, next) => {
  try {
    const { candles, symbol = 'BTC/USDT', interval = '1h' } = req.body;

    let klines = candles;

    // Fetch candles if client didn't supply them
    if (!Array.isArray(klines) || klines.length === 0) {
      if (symbol.includes('BTC')) {
        const binanceRes = await getBinanceKlines('BTCUSDT', interval, 300);
        klines = binanceRes.candles;
      } else {
        klines = generateMockCandles(symbol, 300);
      }
    }

    const prediction = runMLInference(klines, symbol);

    if (!prediction.success) {
      return res.status(400).json(prediction);
    }

    return res.json(prediction);
  } catch (err) {
    next(err);
  }
});

export default router;
