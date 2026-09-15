import React, { useState } from 'react';
import { Search, X, Check, Activity, TrendingUp, Cpu, Layers, Sparkles, BarChart2 } from 'lucide-react';

export function IndicatorsModal({ isOpen, onClose, activeIndicators, onToggleIndicator }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  if (!isOpen) return null;

  const indicatorList = [
    {
      id: 'ema9',
      name: 'EMA 9 (Exponential Moving Average)',
      category: 'MOVING_AVERAGES',
      description: 'Fast 9-period exponential moving average for short-term trend direction and momentum.',
      color: 'border-pink-500/40 text-pink-400',
      badge: 'MA'
    },
    {
      id: 'ema15',
      name: 'EMA 15 (Exponential Moving Average)',
      category: 'MOVING_AVERAGES',
      description: '15-period trend filter for intermediate trend confirmation and dynamic support.',
      color: 'border-cyan-500/40 text-cyan-400',
      badge: 'MA'
    },
    {
      id: 'sma20',
      name: 'SMA 20 (Simple Moving Average)',
      category: 'MOVING_AVERAGES',
      description: 'Standard 20-period simple moving average baseline used for trend identification.',
      color: 'border-amber-500/40 text-amber-400',
      badge: 'MA'
    },
    {
      id: 'sma50',
      name: 'SMA 50 (Simple Moving Average)',
      category: 'MOVING_AVERAGES',
      description: '50-period institutional trend filter for major trend support and Golden/Death cross.',
      color: 'border-blue-500/40 text-blue-400',
      badge: 'MA'
    },
    {
      id: 'rsi',
      name: 'RSI 14 (Relative Strength Index)',
      category: 'OSCILLATORS',
      description: '14-period momentum oscillator measuring overbought (>70) and oversold (<30) conditions.',
      color: 'border-purple-500/40 text-purple-400',
      badge: 'OSC'
    },
    {
      id: 'autoSr',
      name: 'Auto Support & Resistance Levels',
      category: 'SUPPORT_RESISTANCE',
      description: 'Algorithmic pivot cluster detector plotting dynamic green support and red resistance lines.',
      color: 'border-emerald-500/40 text-emerald-400',
      badge: 'S/R'
    },
    {
      id: 'candlePattern',
      name: 'Candlestick Pattern Radar',
      category: 'PATTERNS',
      description: 'Automated 15+ candlestick pattern scanner (Bullish Engulfing, Hammer, Shooting Star, etc.).',
      color: 'border-amber-500/40 text-amber-400',
      badge: 'PATTERN'
    },
    {
      id: 'aiMl',
      name: 'AI Machine Learning Predictions & Signals',
      category: 'AI_ML',
      description: 'Real-time AI neural network model generating high-probability BUY/SELL signal markers on candles.',
      color: 'border-cyan-500/40 text-cyan-400',
      badge: 'AI/ML'
    },
    {
      id: 'smcIct',
      name: 'Smart Money Concepts (SMC) & ICT AI Overlay',
      category: 'AI_ML',
      description: 'Institutional AI engine drawing Order Blocks (OB), Fair Value Gaps (FVG), CHoCH, BOS, & Liquidity Sweeps.',
      color: 'border-purple-500/40 text-purple-400',
      badge: 'SMC/ICT'
    },
    {
      id: 'aiPatterns',
      name: 'AI Advanced Chart Pattern Recognition',
      category: 'PATTERNS',
      description: 'Automated 10+ chart pattern scanner (Head & Shoulders, Double Bottom, Flags, Triangles) with AI % confidence scores.',
      color: 'border-emerald-500/40 text-emerald-400',
      badge: 'AI PATTERN'
    }
  ];

  const filteredIndicators = indicatorList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans select-none animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 font-mono">
                INDICATORS & STRATEGIES
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  TradingView Library
                </span>
              </h2>
              <p className="text-xs text-slate-400">Search and toggle technical indicators, oscillators, and AI models</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search indicators (e.g. EMA, RSI, AI ML, Pattern)..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 focus:outline-none font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono py-1">
            {[
              { id: 'ALL', label: 'All Indicators' },
              { id: 'MOVING_AVERAGES', label: 'Moving Averages' },
              { id: 'OSCILLATORS', label: 'Oscillators' },
              { id: 'SUPPORT_RESISTANCE', label: 'Support / Resistance' },
              { id: 'PATTERNS', label: 'Patterns' },
              { id: 'AI_ML', label: 'AI & ML Signals' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer text-[11px] ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Indicators List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {filteredIndicators.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono flex flex-col items-center gap-2">
              <Search className="w-8 h-8 text-slate-600" />
              <span>No indicators found matching "{searchQuery}"</span>
            </div>
          ) : (
            filteredIndicators.map((ind) => {
              const isActive = !!activeIndicators[ind.id];
              return (
                <div
                  key={ind.id}
                  onClick={() => onToggleIndicator(ind.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                    isActive
                      ? 'bg-cyan-950/20 border-cyan-500/40 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono border shrink-0 ${ind.color}`}>
                      {ind.badge}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-100 text-xs font-mono flex items-center gap-2">
                        <span>{ind.name}</span>
                        {isActive && (
                          <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {ind.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleIndicator(ind.id);
                    }}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow'
                        : 'border-slate-700 hover:border-slate-500 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>{Object.values(activeIndicators).filter(Boolean).length} Active Indicators</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
