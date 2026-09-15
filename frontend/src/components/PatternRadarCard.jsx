import React, { useState } from 'react';
import { Radar, ChevronDown, ChevronUp, X } from 'lucide-react';

export function PatternRadarCard({ patternData, onClose }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!patternData || !patternData.patternName || patternData.patternName.includes('Candle')) {
    return null;
  }

  const { patternName, historicalWinRate, sampleSize, avgRiskReward, targetHorizonCandles, confidenceColor } = patternData;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-2 shadow-2xl backdrop-blur-md text-xs font-sans w-56 text-slate-100 select-none transition-all">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-1">
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 font-bold font-mono text-[11px] cursor-pointer flex-1 min-w-0"
        >
          <Radar className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
          <span className="text-slate-200 uppercase truncate text-[10px]">{patternName} RADAR</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border ${confidenceColor}`}>
            {historicalWinRate}% WIN
          </span>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-all cursor-pointer"
              title="Close Pattern Radar Badge"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-1.5 w-full bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-800">
        <div 
          style={{ width: `${Math.min(100, Math.max(10, historicalWinRate))}%` }} 
          className={`h-full transition-all duration-500 ${
            historicalWinRate >= 65 ? 'bg-gradient-to-r from-teal-400 to-emerald-400' : 'bg-gradient-to-r from-amber-400 to-cyan-400'
          }`}
        />
      </div>

      {/* Expanded Details Drawer */}
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1 text-[10px] font-mono text-slate-300 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Sample Size:</span>
            <span className="font-bold text-slate-100">{sampleSize} bars</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Avg Risk-to-Reward:</span>
            <span className="font-bold text-emerald-400">{avgRiskReward}x</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Target Horizon:</span>
            <span className="font-bold text-cyan-400">{targetHorizonCandles} candles</span>
          </div>
        </div>
      )}

    </div>
  );
}

