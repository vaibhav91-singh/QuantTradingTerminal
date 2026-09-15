import React, { useState } from 'react';
import { Cpu, Play, CheckCircle2, TrendingUp, TrendingDown, Percent, Award, X } from 'lucide-react';
import { calculateEMA, calculateRSI, calculateSupportResistanceLevels } from '../utils/indicators';

export function StrategyTester({ candles, isOpen, onClose }) {
  const [selectedStrategy, setSelectedStrategy] = useState('ema_cross');
  const [backtestResult, setBacktestResult] = useState(null);

  if (!isOpen) return null;

  const handleRunBacktest = () => {
    if (!candles || candles.length < 30) return;

    let trades = [];
    let position = null;
    let balance = 10000;
    const initialBalance = 10000;

    if (selectedStrategy === 'ema_cross') {
      const ema9 = calculateEMA(candles, 9);
      const ema15 = calculateEMA(candles, 15);

      const timeMap15 = new Map(ema15.map(e => [e.time, e.value]));

      for (let i = 1; i < ema9.length; i++) {
        const currTime = ema9[i].time;
        const prevTime = ema9[i - 1].time;
        const e9Curr = ema9[i].value;
        const e9Prev = ema9[i - 1].value;

        const e15Curr = timeMap15.get(currTime);
        const e15Prev = timeMap15.get(prevTime);

        if (!e15Curr || !e15Prev) continue;

        const candle = candles.find(c => c.time === currTime);
        if (!candle) continue;

        // Bullish Crossover (EMA 9 crosses above EMA 15)
        if (e9Prev <= e15Prev && e9Curr > e15Curr) {
          if (position && position.side === 'SELL') {
            const pnl = (position.entryPrice - candle.close) * position.qty;
            balance += pnl;
            trades.push({ ...position, exitPrice: candle.close, exitTime: currTime, pnl });
            position = null;
          }
          if (!position) {
            position = { side: 'BUY', entryPrice: candle.close, entryTime: currTime, qty: 0.1 };
          }
        }
        // Bearish Crossover (EMA 9 crosses below EMA 15)
        else if (e9Prev >= e15Prev && e9Curr < e15Curr) {
          if (position && position.side === 'BUY') {
            const pnl = (candle.close - position.entryPrice) * position.qty;
            balance += pnl;
            trades.push({ ...position, exitPrice: candle.close, exitTime: currTime, pnl });
            position = null;
          }
          if (!position) {
            position = { side: 'SELL', entryPrice: candle.close, entryTime: currTime, qty: 0.1 };
          }
        }
      }
    } else if (selectedStrategy === 'rsi_reversal') {
      const rsiArr = calculateRSI(candles, 14);

      for (let i = 1; i < rsiArr.length; i++) {
        const currRsi = rsiArr[i].value;
        const prevRsi = rsiArr[i - 1].value;
        const currTime = rsiArr[i].time;
        const candle = candles.find(c => c.time === currTime);
        if (!candle) continue;

        // RSI Oversold Reversal (< 30) -> BUY
        if (prevRsi <= 30 && currRsi > 30) {
          if (!position) {
            position = { side: 'BUY', entryPrice: candle.close, entryTime: currTime, qty: 0.1 };
          }
        }
        // RSI Overbought Reversal (> 70) -> SELL
        else if (prevRsi >= 70 && currRsi < 70) {
          if (position && position.side === 'BUY') {
            const pnl = (candle.close - position.entryPrice) * position.qty;
            balance += pnl;
            trades.push({ ...position, exitPrice: candle.close, exitTime: currTime, pnl });
            position = null;
          }
        }
      }
    }

    const totalTrades = trades.length;
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
    const totalProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
    const totalLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : (totalProfit > 0 ? totalProfit : 0);
    const netReturnPct = ((balance - initialBalance) / initialBalance) * 100;

    setBacktestResult({
      totalTrades,
      winCount: wins.length,
      lossCount: losses.length,
      winRatePct: Number(winRate.toFixed(1)),
      profitFactor: Number(profitFactor.toFixed(2)),
      totalProfit: Number(totalProfit.toFixed(2)),
      totalLoss: Number(totalLoss.toFixed(2)),
      netReturnPct: Number(netReturnPct.toFixed(2)),
      finalBalance: Number(balance.toFixed(2))
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 flex flex-col gap-4 shadow-2xl font-sans">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-slate-100 text-base">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>AUTO STRATEGY RULE TESTER</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Strategy Selector Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Select Algorithmic Strategy</label>
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="ema_cross">EMA 9 / EMA 15 Golden Cross Trend Strategy</option>
            <option value="rsi_reversal">RSI 14 Oversold / Overbought Reversal Strategy</option>
          </select>
        </div>

        {/* Run Backtest Button */}
        <button
          onClick={handleRunBacktest}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>RUN 1-CLICK HISTORICAL BACKTEST</span>
        </button>

        {/* Backtest Results Summary Card */}
        {backtestResult && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3 font-mono">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <span className="text-xs font-bold text-slate-300">BACKTEST PERFORMANCE REPORT</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                backtestResult.netReturnPct >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                Return: {backtestResult.netReturnPct >= 0 ? '+' : ''}{backtestResult.netReturnPct}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-500 text-[10px]">Win Rate</div>
                <div className="text-emerald-400 font-bold text-sm">{backtestResult.winRatePct}%</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-500 text-[10px]">Profit Factor</div>
                <div className="text-cyan-400 font-bold text-sm">{backtestResult.profitFactor}</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-slate-500 text-[10px]">Total Trades</div>
                <div className="text-slate-200 font-bold text-sm">{backtestResult.totalTrades}</div>
              </div>
            </div>

            <div className="flex justify-between text-xs text-slate-400 pt-1 border-t border-slate-900">
              <span>Gross Profit: <strong className="text-emerald-400">${backtestResult.totalProfit}</strong></span>
              <span>Gross Loss: <strong className="text-rose-400">${backtestResult.totalLoss}</strong></span>
              <span>Final Balance: <strong className="text-slate-200">${backtestResult.finalBalance}</strong></span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
