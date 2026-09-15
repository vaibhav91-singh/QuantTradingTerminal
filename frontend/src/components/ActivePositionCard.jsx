import React from 'react';
import { XCircle, ShieldAlert, CheckCircle2, Target, Zap } from 'lucide-react';

export function ActivePositionCard({ activeTrades = [], activeTrade, currentPrice, onClosePosition }) {
  // Normalize trades array (supports both array activeTrades and legacy activeTrade)
  let trades = [];
  if (Array.isArray(activeTrades) && activeTrades.length > 0) {
    trades = activeTrades;
  } else if (activeTrade) {
    trades = [activeTrade];
  }

  if (trades.length === 0) {
    return (
      <div className="terminal-card rounded-xl p-4 border border-slate-800 flex flex-col items-center justify-center text-center py-8 text-slate-500">
        <Target className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
        <p className="text-xs font-medium">No Active Positions</p>
        <p className="text-[11px] text-slate-600 mt-0.5">Use Order Panel or Quick Buy/Sell to execute multiple orders.</p>
      </div>
    );
  }

  // Total Portfolio PnL
  let totalPnlUsd = 0;
  trades.forEach((trade) => {
    const isLong = trade.side === 'BUY';
    const entryPrice = trade.entryPrice;
    const priceDiff = isLong ? (currentPrice - entryPrice) : (entryPrice - currentPrice);
    totalPnlUsd += priceDiff * trade.quantity;
  });

  const isTotalProfitable = totalPnlUsd >= 0;

  return (
    <div className="terminal-card rounded-xl p-4 border border-slate-800 flex flex-col gap-3 relative overflow-hidden">
      {/* Overall Portfolio Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-xs text-slate-100 font-mono uppercase tracking-wider">
            OPEN POSITIONS ({trades.length})
          </span>
        </div>

        {trades.length > 1 && (
          <button
            onClick={() => onClosePosition && onClosePosition(null)}
            className="text-[10px] bg-rose-500/20 hover:bg-rose-500 border border-rose-500/40 text-rose-300 hover:text-white px-2 py-0.5 rounded font-mono font-bold transition-all cursor-pointer"
          >
            CLOSE ALL ({totalPnlUsd >= 0 ? '+' : ''}${totalPnlUsd.toFixed(2)})
          </button>
        )}
      </div>

      {/* Main Overall PnL Display */}
      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex justify-between items-center">
        <div>
          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Total Floating P&L</div>
          <div className={`text-lg font-bold font-mono ${isTotalProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isTotalProfitable ? '+' : ''}${totalPnlUsd.toFixed(2)}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">LIVE AGGREGATE</span>
        </div>
      </div>

      {/* Scrollable Individual Position List */}
      <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
        {trades.map((trade, idx) => {
          const isLong = trade.side === 'BUY';
          const entryPrice = trade.entryPrice;
          const priceDiff = isLong ? (currentPrice - entryPrice) : (entryPrice - currentPrice);
          const pnlUsd = priceDiff * trade.quantity;
          const pnlPct = (priceDiff / entryPrice) * 100 * trade.leverage;
          const isProfitable = pnlUsd >= 0;

          return (
            <div 
              key={trade.id || idx}
              className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 flex flex-col gap-2 relative overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                    isLong ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}>
                    {trade.side === 'BUY' ? 'LONG' : 'SHORT'} {trade.leverage}x
                  </span>
                  <span className="font-bold text-xs text-slate-100 font-mono">{trade.symbol}</span>
                </div>

                <div className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                  isProfitable ? 'text-emerald-400 bg-emerald-950/40' : 'text-rose-400 bg-rose-950/40'
                }`}>
                  {isProfitable ? '+' : ''}${pnlUsd.toFixed(2)} ({isProfitable ? '+' : ''}{pnlPct.toFixed(2)}%)
                </div>
              </div>

              {/* Position Specs */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
                  <span className="text-slate-500 text-[9px] block">Entry</span>
                  <span className="text-slate-200 font-semibold">${entryPrice.toLocaleString()}</span>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
                  <span className="text-slate-500 text-[9px] block">Mark</span>
                  <span className="text-slate-200 font-semibold">${currentPrice ? currentPrice.toLocaleString() : '---'}</span>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
                  <span className="text-slate-500 text-[9px] block flex items-center gap-0.5">
                    <ShieldAlert className="w-2.5 h-2.5 text-rose-400" /> SL
                  </span>
                  <span className="text-rose-400 font-semibold text-[10px]">
                    {trade.stopLoss ? `$${trade.stopLoss.toLocaleString()}` : 'None'}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
                  <span className="text-slate-500 text-[9px] block flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> TP
                  </span>
                  <span className="text-emerald-400 font-semibold text-[10px]">
                    {trade.takeProfit ? `$${trade.takeProfit.toLocaleString()}` : 'None'}
                  </span>
                </div>
              </div>

              {/* Close Button per Trade */}
              <button
                onClick={() => onClosePosition && onClosePosition(trade.id)}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-rose-600/90 text-slate-300 hover:text-white font-bold py-1 px-3 rounded-md text-[11px] transition-all border border-slate-800 hover:border-rose-500 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400 group-hover:text-white" />
                <span>CLOSE THIS POSITION</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
