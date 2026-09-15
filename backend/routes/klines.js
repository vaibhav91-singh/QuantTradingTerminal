import express from 'express';
import { getBinanceKlines } from '../services/binanceService.js';
import { getTwelveDataGold } from '../services/twelveDataService.js';
import { db } from '../db/database.js';

const router = express.Router();

/**
 * GET /api/klines
 * Query params: symbol (default BTCUSDT), interval (default 1h), limit (default 2000), endTime
 */
router.get('/klines', async (req, res, next) => {
  try {
    const { symbol = 'BTCUSDT', interval = '1h', limit = '2000', endTime } = req.query;
    const parsedLimit = Math.min(10000, Math.max(10, parseInt(limit, 10) || 2000));
    const parsedEndTime = endTime ? parseInt(endTime, 10) : null;

    const result = await getBinanceKlines(symbol, interval, parsedLimit, parsedEndTime);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});
/**
 * GET /api/gold
 * Query params: interval (default 1h), limit (default 500), apiKey
 */
router.get('/gold', async (req, res, next) => {
  try {
    const { interval = '1h', limit = '500', apiKey: queryKey } = req.query;
    const dbSettings = db.getSettings();
    const activeKey = queryKey || dbSettings.twelveDataKey || '';
    const parsedLimit = Math.min(1000, Math.max(10, parseInt(limit, 10) || 500));

    const result = await getTwelveDataGold(activeKey, interval, parsedLimit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

export default router;
