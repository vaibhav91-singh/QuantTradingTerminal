import React, { useState, useEffect } from 'react';
import { runMonteCarloSimulation } from '../utils/monteCarloEngine';
import { Dices, ShieldAlert, RefreshCw, X, TrendingUp, AlertCircle, Award } from 'lucide-react';

export function MonteCarloModal({ isOpen, onClose, tradeHistory, startingBalance = 10000 }) {
  const [result, setResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const res = runMonteCarloSimulation(tradeHistory, startingBalance, 1000, 30);
      setResult(res);
      setIsSimulating(false);
    }, 300);
  };

  useEffect(() => {
    if (isOpen) {
      runSimulation();
    }
  }, [isOpen, tradeHistory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col font-sans select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
                <span>MONTE CARLO 1,000-RUN SIMULATOR</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/40 font-mono">QUANT SIM</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Sequence Risk, Drawdown Distribution & Risk of Ruin Audit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 text-xs">
          
          {isSimulating || !result ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="font-mono text-xs">Executing 1,000 Monte Carlo Bootstrap Iterations...</p>
            </div>
          ) : (
            <>
              {/* Risk Verdict Banner */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono">SIMULATION ASSESSMENT</div>
                    <div className="font-bold text-slate-200 text-xs">
                      1,000 Runs Completed Across 30 Trade Horizons
                    </div>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-lg border font-mono font-bold text-xs ${result.riskVerdictColor}`}>
                  {result.riskVerdict}
                </div>
              </div>

              {/* Core Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-500 font-mono text-[10px]">RISK OF RUIN %</div>
                  <div className={`text-lg font-black font-mono mt-0.5 ${result.riskOfRuinPct > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {result.riskOfRuinPct}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Probability of &gt;40% Loss</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-500 font-mono text-[10px]">MEDIAN FORECAST</div>
                  <div className="text-lg font-black font-mono text-cyan-400 mt-0.5">
                    ${result.medianBalance.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">50th Percentile Balance</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-500 font-mono text-[10px]">WORST 5% BALANCE</div>
                  <div className="text-lg font-black font-mono text-amber-400 mt-0.5">
                    ${result.worst5PctBalance.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">95% Confidence Floor</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-500 font-mono text-[10px]">WORST MAX DRAWDOWN</div>
                  <div className="text-lg font-black font-mono text-rose-400 mt-0.5">
                    -{result.worstMaxDrawdownPct}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Peak-to-Trough Exposure</div>
                </div>
              </div>

              {/* Sample Equity Fan Curves Visualization */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800/80 pb-1.5">
                  <span className="font-bold text-slate-200">SAMPLE EQUITY CURVE FAN (15 RUNS)</span>
                  <span className="text-slate-500">Starting: ${result.startingBalance.toLocaleString()}</span>
                </div>

                <div className="h-32 flex items-end gap-1.5 pt-2 px-1 relative">
                  {result.sampleCurves.map((curve, idx) => {
                    const finalVal = curve[curve.length - 1];
                    const isWinner = finalVal >= result.startingBalance;
                    const heightPct = Math.min(100, Math.max(15, (finalVal / (result.startingBalance * 1.5)) * 60));

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center group relative cursor-pointer"
                      >
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t transition-all ${
                            isWinner ? 'bg-cyan-500/40 hover:bg-cyan-400' : 'bg-rose-500/40 hover:bg-rose-400'
                          }`}
                        />
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-900 border border-slate-700 text-[10px] font-mono px-2 py-0.5 rounded text-slate-100 shadow-xl whitespace-nowrap z-20">
                          Run #{idx + 1}: ${finalVal.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-mono text-xs cursor-pointer border border-purple-500/30 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>Re-Run 1,000 Iterations</span>
          </button>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold px-4 py-1.5 rounded-xl text-xs transition-all shadow cursor-pointer"
          >
            Close Simulator
          </button>
        </div>

      </div>
    </div>
  );
}
