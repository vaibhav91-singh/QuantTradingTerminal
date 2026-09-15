import express from 'express';
import { db } from '../db/database.js';

const router = express.Router();

/**
 * GET /api/trades
 * Returns list of executed trades and computed performance metrics
 */
router.get('/trades', (req, res, next) => {
  try {
    const tradeHistory = db.getTradeHistory();
    const wallet = db.getWallet();

    const totalTrades = tradeHistory.length;
    const wins = tradeHistory.filter(t => t.pnlUsd > 0);
    const losses = tradeHistory.filter(t => t.pnlUsd < 0);

    const winRatePct = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
    const totalProfit = wins.reduce((acc, t) => acc + t.pnlUsd, 0);
    const totalLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnlUsd, 0));
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : (totalProfit > 0 ? totalProfit : 0);

    res.json({
      success: true,
      tradeHistory,
      analytics: {
        totalTrades,
        winCount: wins.length,
        lossCount: losses.length,
        winRatePct: Number(winRatePct.toFixed(1)),
        profitFactor: Number(profitFactor.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2)),
        totalLoss: Number(totalLoss.toFixed(2)),
        currentBalance: wallet.balance
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/trades
 * Log a completed trade and update wallet balance
 */
router.post('/trades', (req, res, next) => {
  try {
    const { trade } = req.body;
    if (!trade || typeof trade.pnlUsd !== 'number') {
      return res.status(400).json({ success: false, error: 'Invalid trade payload' });
    }

    // Save trade
    const updatedHistory = db.addTrade(trade);

    // Update wallet balance
    const wallet = db.getWallet();
    const newBalance = wallet.balance + trade.pnlUsd;
    const updatedWallet = db.saveWallet({ balance: newBalance });

    // Clear active position
    db.setActiveTrade(null);

    res.json({
      success: true,
      trade,
      wallet: updatedWallet,
      tradeHistory: updatedHistory
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/trades
 * Clears trade history
 */
router.delete('/trades', (req, res, next) => {
  try {
    const cleared = db.clearTradeHistory();
    res.json({
      success: true,
      tradeHistory: cleared,
      message: 'Trade history log cleared'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
