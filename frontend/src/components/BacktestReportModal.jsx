import React from 'react';
import { generateBacktestReport } from '../utils/reportGenerator';
import { FileText, Download, Printer, Award, TrendingUp, TrendingDown, X, CheckCircle2 } from 'lucide-react';

export function BacktestReportModal({ isOpen, onClose, tradeHistory, wallet, symbol, interval }) {
  if (!isOpen) return null;

  const report = generateBacktestReport(tradeHistory, wallet, symbol, interval);

  const handleDownloadMarkdown = () => {
    const blob = new Blob([report.reportMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backtest_Report_${symbol.replace('/', '_')}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col font-sans select-none max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
                <span>INSTITUTIONAL BACKTEST REPORT</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 font-mono">AUDIT VERIFIED</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">{symbol} ({interval}) Performance Summary & KPI Ratios</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-5 space-y-5 overflow-y-auto text-xs">
          
          {/* Executive Overview Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
            <div>
              <div className="text-slate-500 font-mono text-[10px] uppercase">NET EQUITY PROFIT</div>
              <div className={`text-2xl font-black font-mono mt-0.5 ${report.netProfitUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${report.netProfitUsd.toLocaleString()} ({report.netProfitPct >= 0 ? '+' : ''}{report.netProfitPct}%)
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Starting: ${wallet.startingBalance.toLocaleString()} → Ending: ${wallet.balance.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center font-mono">
                <div className="text-[10px] text-slate-500">PROFIT FACTOR</div>
                <div className="text-sm font-bold text-cyan-400">{report.profitFactor}x</div>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center font-mono">
                <div className="text-[10px] text-slate-500">WIN RATE</div>
                <div className="text-sm font-bold text-emerald-400">{report.winRate}%</div>
              </div>
            </div>
          </div>

          {/* Institutional Risk Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[10px]">SHARPE RATIO</div>
              <div className="text-lg font-bold text-slate-100 mt-0.5">{report.sharpeRatio}</div>
              <div className="text-[10px] text-slate-500">Risk-Adjusted Return</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[10px]">SORTINO RATIO</div>
              <div className="text-lg font-bold text-cyan-400 mt-0.5">{report.sortinoRatio}</div>
              <div className="text-[10px] text-slate-500">Downside Risk Ratio</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[10px]">MAX DRAWDOWN</div>
              <div className="text-lg font-bold text-rose-400 mt-0.5">-{report.maxDrawdownPct}%</div>
              <div className="text-[10px] text-slate-500">-$${report.maxDrawdownUsd.toLocaleString()}</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[10px]">TOTAL TRADES</div>
              <div className="text-lg font-bold text-slate-100 mt-0.5">{report.totalTrades}</div>
              <div className="text-[10px] text-slate-500">{report.wins} W / {report.losses} L</div>
            </div>
          </div>

          {/* Trade Log Table */}
          <div>
            <div className="font-bold text-slate-200 mb-2 font-mono text-xs uppercase">Executed Trade Log</div>
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Side</th>
                    <th className="p-2.5">Entry</th>
                    <th className="p-2.5">Exit</th>
                    <th className="p-2.5">PnL ($)</th>
                    <th className="p-2.5">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tradeHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-500">No trades executed yet. Run backtest or bar replay trades to populate report.</td>
                    </tr>
                  ) : (
                    tradeHistory.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="p-2.5 text-slate-500">{idx + 1}</td>
                        <td className={`p-2.5 font-bold ${t.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.side}</td>
                        <td className="p-2.5 text-slate-200">${t.entryPrice?.toFixed(2)}</td>
                        <td className="p-2.5 text-slate-200">${t.exitPrice?.toFixed(2) || '—'}</td>
                        <td className={`p-2.5 font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.pnl >= 0 ? '+' : ''}${t.pnl?.toFixed(2) || '0.00'}
                        </td>
                        <td className="p-2.5 text-slate-400">{t.exitReason || 'Manual'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Markdown Report</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold px-4 py-1.5 rounded-xl text-xs transition-all shadow cursor-pointer"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}
