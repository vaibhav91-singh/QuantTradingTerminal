import React from 'react';
import { PieChart, Award, DollarSign, Activity, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const AnalyticsSummary = React.memo(function AnalyticsSummary({ wallet, tradeHistory }) {
  const totalTrades = tradeHistory.length;
  
  let wins = 0;
  let losses = 0;
  let grossProfit = 0;
  let grossLoss = 0;

  tradeHistory.forEach((t) => {
    if (t.pnlUsd > 0) {
      wins++;
      grossProfit += t.pnlUsd;
    } else {
      losses++;
      grossLoss += Math.abs(t.pnlUsd);
    }
  });

  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0';
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? 'INF' : '0.00');

  // Simple peak-to-trough max drawdown calculation
  let peak = wallet.startingBalance;
  let maxDrawdownUsd = 0;
  let currentEquity = wallet.startingBalance;

  tradeHistory.forEach((t) => {
    currentEquity += t.pnlUsd;
    if (currentEquity > peak) {
      peak = currentEquity;
    }
    const drawdown = peak - currentEquity;
    if (drawdown > maxDrawdownUsd) {
      maxDrawdownUsd = drawdown;
    }
  });

  const maxDrawdownPct = peak > 0 ? ((maxDrawdownUsd / peak) * 100).toFixed(1) : '0.0';
  const netPnlUsd = wallet.balance - wallet.startingBalance;
  const netPnlPct = ((netPnlUsd / wallet.startingBalance) * 100).toFixed(2);
  const isNetPositive = netPnlUsd >= 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
      
      {/* Account Equity Card */}
      <div className="terminal-card p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
        <div className="flex justify-between items-center text-slate-400 text-xs">
          <span>Net Realized P&L</span>
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="mt-2">
          <div className={`text-lg font-bold font-mono ${isNetPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isNetPositive ? '+' : ''}${netPnlUsd.toFixed(2)}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 mt-0.5">
            {isNetPositive ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : <ArrowDownRight className="w-3 h-3 text-rose-400" />}
            <span className={isNetPositive ? 'text-emerald-400' : 'text-rose-400'}>{netPnlPct}% Return</span>
          </div>
        </div>
      </div>

      {/* Win Rate % Card */}
      <div className="terminal-card p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
        <div className="flex justify-between items-center text-slate-400 text-xs">
          <span>Win Rate</span>
          <Award className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="mt-2">
          <div className="text-lg font-bold font-mono text-amber-300">
            {winRate}%
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            {wins} W / {losses} L ({totalTrades} Total)
          </div>
        </div>
      </div>

      {/* Profit Factor Card */}
      <div className="terminal-card p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
        <div className="flex justify-between items-center text-slate-400 text-xs">
          <span>Profit Factor</span>
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-2">
          <div className="text-lg font-bold font-mono text-cyan-300">
            {profitFactor}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
            Prof: ${grossProfit.toFixed(0)} | Loss: ${grossLoss.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Max Drawdown Card */}
      <div className="terminal-card p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
        <div className="flex justify-between items-center text-slate-400 text-xs">
          <span>Max Drawdown</span>
          <Percent className="w-3.5 h-3.5 text-rose-400" />
        </div>
        <div className="mt-2">
          <div className="text-lg font-bold font-mono text-rose-400">
            -{maxDrawdownPct}%
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
            Max Drop: ${maxDrawdownUsd.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Account Starting Balance Info Card */}
      <div className="terminal-card p-3 rounded-xl border border-slate-800 flex-col justify-between hidden lg:flex">
        <div className="flex justify-between items-center text-slate-400 text-xs">
          <span>Initial Wallet</span>
          <PieChart className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="mt-2">
          <div className="text-lg font-bold font-mono text-slate-200">
            ${wallet.startingBalance.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
            Current: ${wallet.balance.toFixed(2)}
          </div>
        </div>
      </div>

    </div>
  );
});
