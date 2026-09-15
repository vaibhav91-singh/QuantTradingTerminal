import React, { useMemo, useState } from 'react';
import { Sparkles, Cpu, TrendingUp, TrendingDown, ShieldCheck, Activity, Zap, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { calculateEMA } from '../utils/indicators';

export function AiConfluenceMatrix({ 
  candles = [], 
  smcData = null, 
  mlData = null, 
  symbol = 'BTC/USDT',
  onApplyAiTrade,
  isEmbedded = false
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const confluenceData = useMemo(() => {
    const defaultData = {
      score: 50,
      direction: 'NEUTRAL',
      statusText: 'NEUTRAL',
      color: 'text-amber-400',
      badgeBg: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
      ringGradient: 'from-amber-500 to-yellow-400',
      factors: [],
      currentPrice: 0
    };

    try {
      if (!candles || !Array.isArray(candles) || candles.length < 20) {
        return defaultData;
      }

      const lastCandle = candles[candles.length - 1];
      if (!lastCandle || typeof lastCandle.close !== 'number') {
        return defaultData;
      }

      const currentPrice = Number(lastCandle.close);

      // 1. Calculate EMA 9 & EMA 15
      const ema9Array = calculateEMA(candles, 9);
      const ema15Array = calculateEMA(candles, 15);
      const rawEma9 = ema9Array && ema9Array.length > 0 ? ema9Array[ema9Array.length - 1]?.value : currentPrice;
      const rawEma15 = ema15Array && ema15Array.length > 0 ? ema15Array[ema15Array.length - 1]?.value : currentPrice;
      
      const lastEma9 = typeof rawEma9 === 'number' && !isNaN(rawEma9) ? rawEma9 : currentPrice;
      const lastEma15 = typeof rawEma15 === 'number' && !isNaN(rawEma15) ? rawEma15 : currentPrice;
      const isEmaBullish = lastEma9 > lastEma15;

      // 2. Calculate RSI (14)
      let gains = 0;
      let losses = 0;
      const period = 14;
      const startIdx = Math.max(1, candles.length - period);
      for (let i = startIdx; i < candles.length; i++) {
        const c1 = Number(candles[i]?.close || 0);
        const c0 = Number(candles[i - 1]?.close || 0);
        const diff = c1 - c0;
        if (diff >= 0) gains += diff;
        else losses += Math.abs(diff);
      }
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rsi = avgLoss === 0 ? 100 : Number((100 - (100 / (1 + (avgGain / avgLoss)))).toFixed(1));

      // 3. SMC Analysis Trend & Zone
      const smcTrend = smcData?.currentTrend || 'NEUTRAL';
      const isDiscountZone = smcData?.equilibrium?.isDiscount || false;

      // 4. ML AI Signal
      const mlDirection = mlData?.prediction || 'HOLD';
      const mlProb = Number(mlData?.confidence) || 50;

      // Scoring Engine
      let totalScore = 50;
      const factors = [];

      // Factor A: SMC Alignment
      if (smcTrend === 'BULLISH') {
        totalScore += 18;
        factors.push({ name: 'SMC Structure', label: 'Bullish CHoCH & OBs', status: 'BULLISH', pts: '+18%', pass: true });
      } else if (smcTrend === 'BEARISH') {
        totalScore -= 18;
        factors.push({ name: 'SMC Structure', label: 'Bearish CHoCH & OBs', status: 'BEARISH', pts: '-18%', pass: false });
      } else {
        factors.push({ name: 'SMC Structure', label: 'Consolidation Zone', status: 'NEUTRAL', pts: '0%', pass: null });
      }

      // Factor B: EMA Trend Alignment
      if (isEmaBullish) {
        totalScore += 16;
        factors.push({ name: 'EMA Trend', label: `EMA 9 (${lastEma9.toFixed(1)}) > EMA 15`, status: 'BULLISH', pts: '+16%', pass: true });
      } else {
        totalScore -= 16;
        factors.push({ name: 'EMA Trend', label: `EMA 9 (${lastEma9.toFixed(1)}) < EMA 15`, status: 'BEARISH', pts: '-16%', pass: false });
      }

      // Factor C: RSI Momentum Zone
      if (rsi >= 52 && rsi <= 72) {
        totalScore += 14;
        factors.push({ name: 'RSI Momentum', label: `RSI Bullish (${rsi})`, status: 'BULLISH', pts: '+14%', pass: true });
      } else if (rsi <= 48 && rsi >= 28) {
        totalScore -= 14;
        factors.push({ name: 'RSI Momentum', label: `RSI Bearish (${rsi})`, status: 'BEARISH', pts: '-14%', pass: false });
      } else {
        factors.push({ name: 'RSI Momentum', label: `RSI Neutral (${rsi})`, status: 'NEUTRAL', pts: '0%', pass: null });
      }

      // Factor D: ML Neural Engine
      if (mlDirection === 'BUY') {
        const pts = Math.round(mlProb * 0.22);
        totalScore += pts;
        factors.push({ name: 'ML AI Signal', label: `High Winrate Buy (${mlProb}%)`, status: 'BULLISH', pts: `+${pts}%`, pass: true });
      } else if (mlDirection === 'SELL') {
        const pts = Math.round(mlProb * 0.22);
        totalScore -= pts;
        factors.push({ name: 'ML AI Signal', label: `High Winrate Sell (${mlProb}%)`, status: 'BEARISH', pts: `-${pts}%`, pass: false });
      } else {
        factors.push({ name: 'ML AI Signal', label: 'Standby / Neutral', status: 'NEUTRAL', pts: '0%', pass: null });
      }

      // Clamp score strictly to [12%, 98%]
      const finalScore = Math.min(98, Math.max(12, totalScore));

      let direction = 'NEUTRAL';
      let statusText = 'NEUTRAL';
      let color = 'text-amber-400';
      let badgeBg = 'bg-amber-950/80 border-amber-500/50 text-amber-300';
      let ringGradient = 'from-amber-500 to-yellow-400';

      if (finalScore >= 72) {
        direction = 'BUY';
        statusText = 'STRONG BUY';
        color = 'text-emerald-400';
        badgeBg = 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300 shadow-emerald-950/50';
        ringGradient = 'from-emerald-400 to-teal-400';
      } else if (finalScore >= 58) {
        direction = 'BUY';
        statusText = 'BULLISH';
        color = 'text-cyan-400';
        badgeBg = 'bg-cyan-950/90 border-cyan-500/60 text-cyan-300';
        ringGradient = 'from-cyan-400 to-emerald-400';
      } else if (finalScore <= 28) {
        direction = 'SELL';
        statusText = 'STRONG SELL';
        color = 'text-rose-400';
        badgeBg = 'bg-rose-950/90 border-rose-500/60 text-rose-300 shadow-rose-950/50';
        ringGradient = 'from-rose-500 to-amber-500';
      } else if (finalScore <= 42) {
        direction = 'SELL';
        statusText = 'BEARISH';
        color = 'text-amber-400';
        badgeBg = 'bg-amber-950/90 border-amber-500/60 text-amber-300';
        ringGradient = 'from-amber-500 to-rose-400';
      }

      return {
        score: finalScore,
        direction,
        statusText,
        color,
        badgeBg,
        ringGradient,
        factors,
        currentPrice
      };
    } catch (err) {
      console.error('AiConfluenceMatrix calculation error:', err);
      return defaultData;
    }
  }, [candles, smcData, mlData]);

  const handleApplyTrade = () => {
    if (!onApplyAiTrade) return;
    const isBuy = confluenceData.direction === 'BUY';
    const price = confluenceData.currentPrice || 78500;
    const slOffset = price * 0.008; // 0.8% SL
    const tpOffset = price * 0.024; // 2.4% TP (3:1 R:R)

    onApplyAiTrade({
      direction: isBuy ? 'BUY' : 'SELL',
      entryPrice: price,
      stopLoss: isBuy ? price - slOffset : price + slOffset,
      takeProfit: isBuy ? price + tpOffset : price - tpOffset,
      confidence: confluenceData.score
    });
  };

  return (
    <div className={
      isEmbedded
        ? "bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex flex-col gap-2 font-mono select-none shadow-inner"
        : "terminal-card rounded-xl p-3 border border-slate-800 flex flex-col gap-2.5 font-mono select-none shadow-xl bg-slate-950/95"
    }>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
          <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>AI CONFLUENCE MATRIX</span>
        </div>

        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${confluenceData.badgeBg} shadow-sm`}>
          {confluenceData.statusText}
        </span>
      </div>

      {/* Main Score Radial Gauge & Action */}
      <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-3 shadow-inner">
        
        {/* Score Ring */}
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="3.5"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeDasharray={113}
                strokeDashoffset={113 - (113 * confluenceData.score) / 100}
                strokeLinecap="round"
                className={`transition-all duration-700 ${confluenceData.color}`}
                fill="transparent"
              />
            </svg>
            <span className={`absolute text-xs font-extrabold tabular-nums ${confluenceData.color}`}>
              {confluenceData.score}%
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Confluence Score</span>
            <span className={`text-xs font-extrabold ${confluenceData.color}`}>
              {confluenceData.direction === 'BUY' && '▲ '}
              {confluenceData.direction === 'SELL' && '▼ '}
              {confluenceData.statusText}
            </span>
          </div>
        </div>

        {/* 1-Click Execute Trade Button */}
        <button
          onClick={handleApplyTrade}
          className={`px-3 py-1.5 rounded-lg font-extrabold text-[11px] flex items-center gap-1.5 transition-all shadow-lg cursor-pointer shrink-0 ${
            confluenceData.direction === 'BUY'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 shadow-emerald-950/50'
              : confluenceData.direction === 'SELL'
              ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 hover:brightness-110 shadow-rose-950/50'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span>Auto-Fill Setup</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Accordion Toggle for Factor Breakdown */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between text-[10px] font-bold text-slate-400 hover:text-slate-200 cursor-pointer pt-0.5"
      >
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span>4-FACTOR SIGNAL BREAKDOWN ({confluenceData.factors.length})</span>
        </span>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </div>

      {/* Expanded Signal Breakdown Drawer */}
      {isExpanded && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/80 animate-in fade-in duration-150">
          {confluenceData.factors.map((factor, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between bg-slate-900/90 border border-slate-800/80 px-2 py-1 rounded text-[10px]"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  factor.pass === true ? 'bg-emerald-400 shadow-sm shadow-emerald-400' :
                  factor.pass === false ? 'bg-rose-400 shadow-sm shadow-rose-400' : 'bg-slate-500'
                }`} />
                <span className="text-slate-300 font-bold truncate">{factor.name}:</span>
                <span className="text-slate-400 text-[9.5px] truncate">{factor.label}</span>
              </div>

              <span className={`font-mono font-bold shrink-0 ml-1 ${
                factor.status === 'BULLISH' ? 'text-emerald-400' :
                factor.status === 'BEARISH' ? 'text-rose-400' : 'text-slate-500'
              }`}>
                {factor.pts}
              </span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
