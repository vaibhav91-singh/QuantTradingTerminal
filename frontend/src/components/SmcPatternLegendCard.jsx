import React, { useState } from 'react';
import { Cpu, Sparkles, Layers, TrendingUp, TrendingDown, Eye, EyeOff, ShieldCheck, Zap, ChevronUp, ChevronDown } from 'lucide-react';

export function SmcPatternLegendCard({
  smcData,
  patterns = [],
  showObs = true,
  showFvgs = true,
  showChoch = true,
  showPatterns = true,
  onToggleObs,
  onToggleFvgs,
  onToggleChoch,
  onTogglePatterns
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  if (!smcData && patterns.length === 0) return null;

  const currentTrend = smcData?.currentTrend || 'NEUTRAL';
  const obCount = smcData?.orderBlocks?.length || 0;
  const fvgCount = smcData?.fvgs?.length || 0;
  const sweepCount = smcData?.sweeps?.length || 0;
  const equilibrium = smcData?.equilibrium;

  return (
    <div className="absolute bottom-12 left-3 z-20 font-sans select-none max-w-xs transition-all">
      <div className="bg-slate-950/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-2 shadow-2xl text-xs font-mono">
        
        {/* Header / Main Trigger Badge */}
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-between gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>SMC & ICT AI OVERLAY</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
              currentTrend === 'BULLISH' 
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400' 
                : currentTrend === 'BEARISH'
                ? 'bg-rose-950/80 border-rose-500/40 text-rose-400'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}>
              {currentTrend}
            </span>

            <button className="text-slate-400 hover:text-slate-200 text-[10px] p-0.5">
              {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expanded Panel */}
        {!isCollapsed && (
          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-800/80 animate-in fade-in duration-150">
            
            {/* ICT Premium vs Discount Zone Pill */}
            {equilibrium && (
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-2 py-1 rounded text-[10px]">
                <span className="text-slate-400">ICT Zone (50% EQ):</span>
                <span className={`font-bold ${equilibrium.isDiscount ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {equilibrium.zone}
                </span>
              </div>
            )}

            {/* Quick SMC Toggles & Live Active Metrics */}
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              <button
                onClick={(e) => { e.stopPropagation(); onToggleObs(); }}
                className={`p-1.5 rounded border text-center transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                  showObs 
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="font-bold">OB ({obCount})</span>
                <span className="text-[8px] opacity-75">Order Blocks</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onToggleFvgs(); }}
                className={`p-1.5 rounded border text-center transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                  showFvgs 
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="font-bold">FVG ({fvgCount})</span>
                <span className="text-[8px] opacity-75">Fair Value Gap</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onToggleChoch(); }}
                className={`p-1.5 rounded border text-center transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                  showChoch 
                    ? 'bg-purple-500/15 border-purple-500/50 text-purple-300' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="font-bold">CHoCH</span>
                <span className="text-[8px] opacity-75">Structure</span>
              </button>
            </div>

            {/* AI Detected Patterns List */}
            {showPatterns && patterns.length > 0 && (
              <div className="mt-1 border-t border-slate-800/80 pt-2 flex flex-col gap-1.5">
                <div className="text-[10px] text-slate-400 font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Sparkles className="w-3 h-3" /> AI PATTERN SCANNER
                  </span>
                  <span className="text-[9px] text-slate-500">{patterns.length} Active</span>
                </div>

                <div className="flex flex-col gap-1 max-h-28 overflow-y-auto pr-1">
                  {patterns.map((pat) => (
                    <div
                      key={pat.id}
                      className="p-1.5 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[10px]"
                    >
                      <div className="flex items-center gap-1.5">
                        {pat.type === 'BULLISH' ? (
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-rose-400" />
                        )}
                        <span className="font-bold text-slate-200">{pat.name}</span>
                      </div>

                      <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-bold text-[9px]">
                        {pat.confidence}% AI
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liquidity Sweeps Alert pill if present */}
            {sweepCount > 0 && (
              <div className="mt-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] px-2 py-1 rounded flex items-center justify-between">
                <span className="flex items-center gap-1 font-bold">
                  <Zap className="w-3 h-3 text-amber-400" /> Liquidity Sweep Detected
                </span>
                <span className="text-[9px] text-amber-400">{sweepCount} Sweeps</span>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
