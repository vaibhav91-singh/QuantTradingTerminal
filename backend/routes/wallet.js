import express from 'express';
import { db } from '../db/database.js';

const router = express.Router();

/**
 * GET /api/wallet
 * Returns current wallet balance and active trade position
 */
router.get('/wallet', (req, res, next) => {
  try {
    const wallet = db.getWallet();
    const activeTrade = db.getActiveTrade();
    res.json({
      success: true,
      wallet,
      activeTrade
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/wallet/position
 * Sets or updates active trade position
 */
router.post('/wallet/position', (req, res, next) => {
  try {
    const { activeTrade } = req.body;
    const updatedTrade = db.setActiveTrade(activeTrade || null);
    res.json({
      success: true,
      activeTrade: updatedTrade
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/wallet/reset
 * Resets wallet balance to $10,000.00 and clears active position & trade log
 */
router.post('/wallet/reset', (req, res, next) => {
  try {
    const wallet = db.resetWallet();
    res.json({
      success: true,
      wallet,
      activeTrade: null,
      message: 'Wallet balance and trade history reset to $10,000.00'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
