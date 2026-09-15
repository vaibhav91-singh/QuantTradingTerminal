/**
 * Candlestick Pattern Recognition Utility
 * Detects single-bar & multi-bar chart patterns (Hanging Man, Hammer, Engulfing, 3-Candle Swings, Doji, etc.)
 */

export function detectLatestCandlePattern(candles) {
  if (!candles || candles.length < 3) {
    return {
      name: 'No Pattern Data',
      type: 'NEUTRAL',
      signal: '⚪ ANALYZING...',
      icon: '⏳',
      color: 'text-slate-400',
      bgColor: 'bg-slate-800/40',
      borderColor: 'border-slate-700/50'
    };
  }

  const c0 = candles[candles.length - 1]; // Latest candle
  const c1 = candles[candles.length - 2]; // 1 candle ago
  const c2 = candles[candles.length - 3]; // 2 candles ago

  const open = c0.open;
  const close = c0.close;
  const high = c0.high;
  const low = c0.low;

  const range = Math.max(0.0001, high - low);
  const body = Math.abs(close - open);
  const bodyRatio = body / range;

  const upperShadow = high - Math.max(open, close);
  const lowerShadow = Math.min(open, close) - low;

  const isBullish = close >= open;
  const isBearish = close < open;

  const c1IsBullish = c1.close >= c1.open;
  const c1IsBearish = c1.close < c1.open;
  const c1Body = Math.abs(c1.close - c1.open);

  const c2IsBullish = c2.close >= c2.open;
  const c2IsBearish = c2.close < c2.open;

  // 1. 3 Candle Swing Up (3 White Soldiers)
  if (c2IsBullish && c1IsBullish && isBullish && c0.close > c1.close && c1.close > c2.close) {
    return {
      name: '3 Candle Swing Up',
      type: 'BULLISH',
      signal: '🟢 3 CANDLE SWING UP',
      icon: '🚀',
      color: 'text-emerald-300',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/50'
    };
  }

  // 2. 3 Candle Swing Down (3 Black Crows)
  if (c2IsBearish && c1IsBearish && isBearish && c0.close < c1.close && c1.close < c2.close) {
    return {
      name: '3 Candle Swing Down',
      type: 'BEARISH',
      signal: '🔴 3 CANDLE SWING DOWN',
      icon: '🔻',
      color: 'text-rose-300',
      bgColor: 'bg-rose-500/20',
      borderColor: 'border-rose-500/50'
    };
  }

  // 3. Morning Star (Bullish Reversal)
  if (c2IsBearish && (c1Body / Math.max(0.0001, c1.high - c1.low) <= 0.35) && isBullish && close > (c2.open + c2.close) / 2) {
    return {
      name: 'Morning Star',
      type: 'BULLISH',
      signal: '🟢 MORNING STAR REVERSAL',
      icon: '🌅',
      color: 'text-emerald-300',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/50'
    };
  }

  // 4. Evening Star (Bearish Reversal)
  if (c2IsBullish && (c1Body / Math.max(0.0001, c1.high - c1.low) <= 0.35) && isBearish && close < (c2.open + c2.close) / 2) {
    return {
      name: 'Evening Star',
      type: 'BEARISH',
      signal: '🔴 EVENING STAR REVERSAL',
      icon: '🌆',
      color: 'text-rose-300',
      bgColor: 'bg-rose-500/20',
      borderColor: 'border-rose-500/50'
    };
  }

  // 5. Bullish Engulfing
  if (c1IsBearish && isBullish && open <= c1.close && close >= c1.open) {
    return {
      name: 'Bullish Engulfing',
      type: 'BULLISH',
      signal: '🟢 BULLISH ENGULFING',
      icon: '🟩',
      color: 'text-emerald-300',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/50'
    };
  }

  // 6. Bearish Engulfing
  if (c1IsBullish && isBearish && open >= c1.close && close <= c1.open) {
    return {
      name: 'Bearish Engulfing',
      type: 'BEARISH',
      signal: '🔴 BEARISH ENGULFING',
      icon: '🟥',
      color: 'text-rose-300',
      bgColor: 'bg-rose-500/20',
      borderColor: 'border-rose-500/50'
    };
  }

  // 7. Hanging Man vs Hammer (Same shape: small body at top, long lower shadow >= 2x body)
  if (lowerShadow >= 2 * body && upperShadow <= 0.15 * range) {
    if (c1IsBullish) {
      return {
        name: 'Hanging Man',
        type: 'BEARISH',
        signal: '🔴 HANGING MAN (BEARISH)',
        icon: '🪢',
        color: 'text-rose-300',
        bgColor: 'bg-rose-500/20',
        borderColor: 'border-rose-500/50'
      };
    } else {
      return {
        name: 'Hammer',
        type: 'BULLISH',
        signal: '🟢 BULLISH HAMMER',
        icon: '🔨',
        color: 'text-emerald-300',
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500/50'
      };
    }
  }

  // 8. Shooting Star vs Inverted Hammer (Long upper shadow >= 2x body, small lower shadow)
  if (upperShadow >= 2 * body && lowerShadow <= 0.15 * range) {
    if (c1IsBullish) {
      return {
        name: 'Shooting Star',
        type: 'BEARISH',
        signal: '🔴 SHOOTING STAR',
        icon: '🌠',
        color: 'text-rose-300',
        bgColor: 'bg-rose-500/20',
        borderColor: 'border-rose-500/50'
      };
    } else {
      return {
        name: 'Inverted Hammer',
        type: 'BULLISH',
        signal: '🟢 INVERTED HAMMER',
        icon: '⛏️',
        color: 'text-emerald-300',
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500/50'
      };
    }
  }

  // 9. Doji (Indecision)
  if (bodyRatio <= 0.08) {
    return {
      name: 'Doji',
      type: 'NEUTRAL',
      signal: '⚪ DOJI (INDECISION)',
      icon: '⚖️',
      color: 'text-amber-300',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/50'
    };
  }

  // 10. Marubozu (Strong Body)
  if (bodyRatio >= 0.85) {
    if (isBullish) {
      return {
        name: 'Bullish Marubozu',
        type: 'BULLISH',
        signal: '🟢 BULLISH MARUBOZU',
        icon: '⚡',
        color: 'text-emerald-300',
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500/50'
      };
    } else {
      return {
        name: 'Bearish Marubozu',
        type: 'BEARISH',
        signal: '🔴 BEARISH MARUBOZU',
        icon: '⚡',
        color: 'text-rose-300',
        bgColor: 'bg-rose-500/20',
        borderColor: 'border-rose-500/50'
      };
    }
  }

  // 11. Spinning Top
  if (bodyRatio <= 0.25 && upperShadow > body && lowerShadow > body) {
    return {
      name: 'Spinning Top',
      type: 'NEUTRAL',
      signal: '⚪ SPINNING TOP',
      icon: '🌀',
      color: 'text-amber-300',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/50'
    };
  }

  // Standard Bullish or Bearish candle fallback
  if (isBullish) {
    return {
      name: 'Bullish Candle',
      type: 'BULLISH',
      signal: '🟢 BULLISH CANDLE',
      icon: '🟢',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30'
    };
  }

  return {
    name: 'Bearish Candle',
    type: 'BEARISH',
    signal: '🔴 BEARISH CANDLE',
    icon: '🔴',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30'
  };
}
