import React, { useState } from 'react';
import { Cpu, Zap, ShieldAlert, Target, CheckCircle2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export function MLSignalCard({ mlData, onApplyAiTrade, isLoading }) {
  const [showDetails, setShowDetails] = useState(false);

  if (isLoading || !mlData || !mlData.signal) {
    return (
      <div className="terminal-card rounded-xl p-3 border border-slate-800 flex items-center justify-center gap-2 text-slate-400 text-xs animate-pulse font-mono">
        <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
        <span>Analyzing Market Patterns with AI Model...</span>
      </div>
    );
  }

  const signal = mlData.signal || 'NEUTRAL';
  const confidence = mlData.confidence || 50;
  const targetPrice = mlData.targetPrice;
  const stopLossPrice = mlData.stopLossPrice;
  const winRate = mlData.winRate || 75;
  const features = mlData.features;

  const isBuy = String(signal).includes('BUY');
  const isSell = String(signal).includes('SELL');

  const signalColorClass = isBuy
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
    : isSell
    ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
    : 'bg-amber-500/20 text-amber-300 border-amber-500/50';

  const progressColorClass = isBuy
    ? 'bg-emerald-500'
    : isSell
    ? 'bg-rose-500'
    : 'bg-amber-500';

  return (
    <div className="terminal-card rounded-xl p-4 border border-slate-800/90 flex flex-col gap-3 font-mono bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl relative overflow-hidden">
      
      {/* Background Accent Glow */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${
        isBuy ? 'bg-emerald-500' : isSell ? 'bg-rose-500' : 'bg-amber-500'
      }`} />

      {/* Title & Model Win Rate */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="font-bold text-xs tracking-wider text-slate-100 flex items-center gap-1.5">
            QUANT AI SIGNAL
            <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1 font-normal">
              <Sparkles className="w-3 h-3 text-cyan-400" /> ML v2.4
            </span>
          </span>
        </div>

        {winRate && (
          <div className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
            {winRate}% Win Rate
          </div>
        )}
      </div>

      {/* Main Signal Display */}
      <div className="flex items-center justify-between gap-3 z-10">
        <div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
            Predicted Model Direction
          </div>
          <div className={`inline-flex items-center gap-1.5 font-extrabold text-sm px-3 py-1 rounded-lg border shadow-lg ${signalColorClass}`}>
            <Zap className="w-4 h-4" />
            <span>{signal}</span>
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="flex flex-col items-end w-32">
          <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
            <span>Confidence:</span>
            <span className="text-slate-100 font-bold">{confidence}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              style={{ width: `${confidence}%` }}
              className={`h-full rounded-full transition-all duration-700 ${progressColorClass}`}
            />
          </div>
        </div>
      </div>

      {/* AI Target Price & Stop Loss Forecast */}
      <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs z-10">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Target className="w-3 h-3 text-emerald-400" /> AI Target (TP)
          </span>
          <span className="font-bold text-emerald-400 text-sm">
            ${targetPrice ? targetPrice.toLocaleString() : 'N/A'}
          </span>
        </div>

        <div className="flex flex-col gap-0.5 border-l border-slate-800 pl-2.5">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-400" /> AI Risk (SL)
          </span>
          <span className="font-bold text-rose-400 text-sm">
            ${stopLossPrice ? stopLossPrice.toLocaleString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* 1-Click Apply AI Trade Button */}
      <button
        onClick={() => onApplyAiTrade && onApplyAiTrade({ side: isSell ? 'SELL' : 'BUY', stopLossPrice, targetPrice })}
        className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer z-10"
      >
        <Zap className="w-3.5 h-3.5" />
        <span>Apply AI Targets to Order Panel</span>
      </button>

      {/* Feature Engineering Details Drawer Toggle */}
      {features && (
        <div className="border-t border-slate-800/80 pt-2 text-[11px] text-slate-400 z-10">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-[10px] text-slate-400 hover:text-slate-200"
          >
            <span>FEATURE EXTRACTION METRICS</span>
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showDetails && (
            <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-950 p-2 rounded border border-slate-800 text-[10px]">
              <div><span className="text-slate-500">RSI (14):</span> <span className="text-slate-200 font-bold">{features.rsi}</span></div>
              <div><span className="text-slate-500">EMA Ratio:</span> <span className="text-slate-200 font-bold">{features.emaRatio}</span></div>
              <div><span className="text-slate-500">Volume Surge:</span> <span className="text-slate-200 font-bold">{features.volumeSurge}</span></div>
              <div><span className="text-slate-500">Momentum:</span> <span className="text-slate-200 font-bold">{features.momentum}</span></div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
