import React from 'react';
import { XCircle, TrendingUp, TrendingDown, ShieldAlert, CheckCircle2, Target } from 'lucide-react';

export function ActivePositionCard({ activeTrade, currentPrice, onClosePosition }) {
  if (!activeTrade) {
    return (
      <div className="terminal-card rounded-xl p-4 border border-slate-800 flex flex-col items-center justify-center text-center py-8 text-slate-500">
        <Target className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
        <p className="text-xs font-medium">No Active Positions</p>
        <p className="text-[11px] text-slate-600 mt-0.5">Use Order Panel to execute LONG or SHORT orders.</p>
      </div>
    );
  }

  const isLong = activeTrade.side === 'BUY';
  const entryPrice = activeTrade.entryPrice;
  const priceDiff = isLong ? (currentPrice - entryPrice) : (entryPrice - currentPrice);
  
  // Calculate Unrealized PnL in USD and %
  const pnlUsd = priceDiff * activeTrade.quantity;
  const pnlPct = (priceDiff / entryPrice) * 100 * activeTrade.leverage;
  const isProfitable = pnlUsd >= 0;

  return (
    <div className="terminal-card rounded-xl p-4 border border-slate-800 flex flex-col gap-3 relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-10 rounded-full blur-2xl ${
        isProfitable ? 'bg-emerald-500' : 'bg-rose-500'
      }`} />

      {/* Card Top Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono tracking-wider ${
            isLong ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
          }`}>
            {activeTrade.side === 'BUY' ? 'LONG' : 'SHORT'} {activeTrade.leverage}x
          </span>
          <span className="font-bold text-sm text-slate-100 font-mono">{activeTrade.symbol}</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">ACTIVE</span>
        </div>
      </div>

      {/* Main PnL Big Display */}
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 flex justify-between items-center">
        <div>
          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Unrealized P&L</div>
          <div className={`text-xl font-bold font-mono ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isProfitable ? '+' : ''}${pnlUsd.toFixed(2)}
          </div>
        </div>
        <div className={`text-right px-2.5 py-1 rounded-lg font-mono font-bold text-sm ${
          isProfitable ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
        }`}>
          {isProfitable ? '+' : ''}{pnlPct.toFixed(2)}%
        </div>
      </div>

      {/* Position Detail Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
          <span className="text-slate-500 text-[10px] block">Entry Price</span>
          <span className="text-slate-200 font-semibold">${entryPrice.toLocaleString()}</span>
        </div>
        <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
          <span className="text-slate-500 text-[10px] block">Mark Price</span>
          <span className="text-slate-200 font-semibold">${currentPrice ? currentPrice.toLocaleString() : '---'}</span>
        </div>
        <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
          <span className="text-slate-500 text-[10px] block flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-400" /> Stop Loss
          </span>
          <span className="text-rose-400 font-semibold">
            {activeTrade.stopLoss ? `$${activeTrade.stopLoss.toLocaleString()}` : 'None'}
          </span>
        </div>
        <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
          <span className="text-slate-500 text-[10px] block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Take Profit
          </span>
          <span className="text-emerald-400 font-semibold">
            {activeTrade.takeProfit ? `$${activeTrade.takeProfit.toLocaleString()}` : 'None'}
          </span>
        </div>
      </div>

      {/* Close Position Action Button */}
      <button
        onClick={onClosePosition}
        className="mt-1 w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-600/90 text-slate-100 hover:text-white font-bold py-2 px-4 rounded-xl text-xs transition-all border border-slate-700 hover:border-rose-500 active:scale-95 cursor-pointer shadow-md"
      >
        <XCircle className="w-4 h-4 text-rose-400 group-hover:text-white" />
        <span>CLOSE POSITION @ MARKET</span>
      </button>
    </div>
  );
}
