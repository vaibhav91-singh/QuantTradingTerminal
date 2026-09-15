import React, { useState } from 'react';
import { History, Download, TrendingUp, TrendingDown, ArrowRight, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

export const TradeHistory = React.memo(function TradeHistory({ tradeHistory, onClearHistory }) {
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'WIN', 'LOSS'

  const filteredHistory = tradeHistory.filter((t) => {
    if (filter === 'WIN') return t.pnlUsd > 0;
    if (filter === 'LOSS') return t.pnlUsd <= 0;
    return true;
  });

  const exportToCsv = () => {
    if (tradeHistory.length === 0) return;

    const headers = ['Trade #', 'Date/Time', 'Symbol', 'Side', 'Leverage', 'Entry Price', 'Exit Price', 'PnL ($)', 'PnL (%)', 'Exit Reason'];
    const rows = tradeHistory.map((t, idx) => [
      idx + 1,
      new Date(t.timestamp).toLocaleString(),
      t.symbol,
      t.side,
      `${t.leverage}x`,
      t.entryPrice,
      t.exitPrice,
      t.pnlUsd.toFixed(2),
      `${t.pnlPct.toFixed(2)}%`,
      t.exitReason
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `QuantTerminal_TradeHistory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="terminal-card rounded-xl p-4 border border-slate-800 flex flex-col h-full gap-3 min-h-[350px]">
      {/* Drawer Header & Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-slate-100 tracking-wide">TRADE HISTORY LOG</h3>
          <span className="bg-slate-900 text-slate-400 font-mono text-[11px] px-2 py-0.5 rounded border border-slate-800">
            {tradeHistory.length} Trades
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Win/Loss Filter Pills */}
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            {['ALL', 'WIN', 'LOSS'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded font-mono font-medium transition-all ${
                  filter === f
                    ? 'bg-slate-800 text-slate-100 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={exportToCsv}
            disabled={tradeHistory.length === 0}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 px-2.5 py-1 rounded-lg border border-slate-800 text-xs transition-all"
            title="Export Trade Logs to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Trade Log Table */}
      <div className="flex-1 overflow-y-auto max-h-[350px] pr-1">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs">
            <AlertCircle className="w-6 h-6 mb-1 text-slate-600 stroke-[1.5]" />
            <p>No trade logs found for this filter.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredHistory.slice().reverse().map((t, idx) => {
              const isProfitable = t.pnlUsd >= 0;
              const isLong = t.side === 'BUY';

              return (
                <div
                  key={t.id || idx}
                  className={`p-3 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono ${
                    isProfitable
                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                      : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                  }`}
                >
                  {/* Left: Side, Symbol & Time */}
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg border ${
                      isLong ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    }`}>
                      {isLong ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{t.symbol}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {isLong ? 'LONG' : 'SHORT'} {t.leverage}x
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                          {t.exitReason}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Entry -> Exit Price */}
                  <div className="flex items-center gap-2 text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-900 text-[11px]">
                    <span>${t.entryPrice.toLocaleString()}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className="font-semibold">${t.exitPrice.toLocaleString()}</span>
                  </div>

                  {/* Right: Net PnL Badge */}
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-right">
                      <div className={`font-bold text-sm ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfitable ? '+' : ''}${t.pnlUsd.toFixed(2)}
                      </div>
                      <div className={`text-[10px] font-semibold ${isProfitable ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isProfitable ? '+' : ''}{t.pnlPct.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
