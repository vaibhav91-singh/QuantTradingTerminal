/**
 * Smart Money Concepts (SMC) & ICT Algorithmic Engine
 * 
 * High-performance automated detection for:
 * 1. Swing Highs & Swing Lows (Pivots)
 * 2. Break of Structure (BOS) & Change of Character (CHoCH)
 * 3. Bullish & Bearish Order Blocks (OB) with tap/mitigation index tracking
 * 4. Fair Value Gaps (FVG - Bullish & Bearish imbalance zones)
 * 5. Buy-Side & Sell-Side Liquidity Sweeps (BSL / SSL)
 * 6. Premium vs Discount Equilibrium (EQ) 50% Fib ICT Zone
 */

export function detectPivots(candles, leftBars = 3, rightBars = 3) {
  if (!candles || candles.length < leftBars + rightBars + 1) return [];

  const pivots = [];

  for (let i = leftBars; i < candles.length - rightBars; i++) {
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;

    let isHigh = true;
    let isLow = true;

    for (let j = i - leftBars; j <= i + rightBars; j++) {
      if (j === i) continue;
      if (candles[j].high >= currentHigh) isHigh = false;
      if (candles[j].low <= currentLow) isLow = false;
    }

    if (isHigh) {
      pivots.push({ index: i, type: 'HIGH', price: currentHigh, candle: candles[i], time: candles[i].time });
    }
    if (isLow) {
      pivots.push({ index: i, type: 'LOW', price: currentLow, candle: candles[i], time: candles[i].time });
    }
  }

  return pivots;
}

export function detectBOSandCHoCH(candles, pivots) {
  if (!candles || candles.length < 10 || !pivots || pivots.length < 2) {
    return { structures: [], currentTrend: 'NEUTRAL' };
  }

  const structures = [];
  let currentTrend = 'NEUTRAL';
  let lastPivotHigh = null;
  let lastPivotLow = null;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];

    const activePivots = pivots.filter(p => p.index < i);
    if (activePivots.length === 0) continue;

    const highs = activePivots.filter(p => p.type === 'HIGH');
    const lows = activePivots.filter(p => p.type === 'LOW');

    const recentHigh = highs.length > 0 ? highs[highs.length - 1] : null;
    const recentLow = lows.length > 0 ? lows[lows.length - 1] : null;

    // Bullish Breakout
    if (recentHigh && candle.close > recentHigh.price && lastPivotHigh !== recentHigh.index) {
      const type = currentTrend === 'BEARISH' ? 'CHoCH' : 'BOS';
      structures.push({
        type: `${type}_BULLISH`,
        label: type,
        fullName: `${type} (Bullish)`,
        index: i,
        time: candle.time,
        pivotIndex: recentHigh.index,
        pivotTime: recentHigh.time,
        price: recentHigh.price
      });
      currentTrend = 'BULLISH';
      lastPivotHigh = recentHigh.index;
    }

    // Bearish Breakout
    if (recentLow && candle.close < recentLow.price && lastPivotLow !== recentLow.index) {
      const type = currentTrend === 'BULLISH' ? 'CHoCH' : 'BOS';
      structures.push({
        type: `${type}_BEARISH`,
        label: type,
        fullName: `${type} (Bearish)`,
        index: i,
        time: candle.time,
        pivotIndex: recentLow.index,
        pivotTime: recentLow.time,
        price: recentLow.price
      });
      currentTrend = 'BEARISH';
      lastPivotLow = recentLow.index;
    }
  }

  return { structures, currentTrend };
}

export function detectOrderBlocks(candles, pivots, structures) {
  if (!candles || candles.length < 15 || !structures || structures.length === 0) return [];

  const orderBlocks = [];
  const avgVolume = candles.reduce((acc, c) => acc + (c.volume || 1), 0) / candles.length;

  structures.forEach((st) => {
    const isBullish = st.type.includes('BULLISH');
    const breakIndex = st.index;

    if (isBullish) {
      for (let i = breakIndex - 1; i >= Math.max(0, breakIndex - 10); i--) {
        const c = candles[i];
        if (c.close < c.open) {
          const top = Math.max(c.open, c.high);
          const bottom = c.low;

          let isMitigated = false;
          let mitigatedIndex = null;
          let mitigatedTime = null;

          for (let k = i + 1; k < candles.length; k++) {
            if (candles[k].low <= top) {
              isMitigated = true;
              mitigatedIndex = k;
              mitigatedTime = candles[k].time;
              break;
            }
          }

          orderBlocks.push({
            id: `ob_bull_${i}`,
            type: 'BULLISH_OB',
            startIndex: i,
            startTime: c.time,
            top,
            bottom,
            price: (top + bottom) / 2,
            isMitigated,
            mitigatedIndex,
            mitigatedTime,
            volume: c.volume || 0,
            strength: (c.volume || 1) > avgVolume ? 'HIGH' : 'MEDIUM'
          });
          break;
        }
      }
    } else {
      for (let i = breakIndex - 1; i >= Math.max(0, breakIndex - 10); i--) {
        const c = candles[i];
        if (c.close > c.open) {
          const top = c.high;
          const bottom = Math.min(c.open, c.low);

          let isMitigated = false;
          let mitigatedIndex = null;
          let mitigatedTime = null;

          for (let k = i + 1; k < candles.length; k++) {
            if (candles[k].high >= bottom) {
              isMitigated = true;
              mitigatedIndex = k;
              mitigatedTime = candles[k].time;
              break;
            }
          }

          orderBlocks.push({
            id: `ob_bear_${i}`,
            type: 'BEARISH_OB',
            startIndex: i,
            startTime: c.time,
            top,
            bottom,
            price: (top + bottom) / 2,
            isMitigated,
            mitigatedIndex,
            mitigatedTime,
            volume: c.volume || 0,
            strength: (c.volume || 1) > avgVolume ? 'HIGH' : 'MEDIUM'
          });
          break;
        }
      }
    }
  });

  const uniqueObs = Array.from(new Map(orderBlocks.map(ob => [ob.id, ob])).values());
  return uniqueObs;
}

export function detectFairValueGaps(candles) {
  if (!candles || candles.length < 4) return [];

  const fvgs = [];

  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2];
    const c2 = candles[i - 1];
    const c3 = candles[i];

    // Bullish FVG
    if (c3.low > c1.high) {
      const gapTop = c3.low;
      const gapBottom = c1.high;
      const gapSize = gapTop - gapBottom;
      const threshold = c2.close * 0.0004;

      if (gapSize >= threshold) {
        let isFilled = false;
        let filledIndex = null;
        let filledTime = null;

        for (let k = i + 1; k < candles.length; k++) {
          if (candles[k].low <= gapBottom || candles[k].low <= gapTop) {
            isFilled = true;
            filledIndex = k;
            filledTime = candles[k].time;
            break;
          }
        }

        fvgs.push({
          id: `fvg_bull_${i}`,
          type: 'BULLISH_FVG',
          startIndex: i - 1,
          startTime: c2.time,
          top: gapTop,
          bottom: gapBottom,
          isFilled,
          filledIndex,
          filledTime,
          mid: (gapTop + gapBottom) / 2
        });
      }
    }

    // Bearish FVG
    if (c1.low > c3.high) {
      const gapTop = c1.low;
      const gapBottom = c3.high;
      const gapSize = gapTop - gapBottom;
      const threshold = c2.close * 0.0004;

      if (gapSize >= threshold) {
        let isFilled = false;
        let filledIndex = null;
        let filledTime = null;

        for (let k = i + 1; k < candles.length; k++) {
          if (candles[k].high >= gapTop || candles[k].high >= gapBottom) {
            isFilled = true;
            filledIndex = k;
            filledTime = candles[k].time;
            break;
          }
        }

        fvgs.push({
          id: `fvg_bear_${i}`,
          type: 'BEARISH_FVG',
          startIndex: i - 1,
          startTime: c2.time,
          top: gapTop,
          bottom: gapBottom,
          isFilled,
          filledIndex,
          filledTime,
          mid: (gapTop + gapBottom) / 2
        });
      }
    }
  }

  return fvgs;
}

export function detectLiquiditySweeps(candles, pivots) {
  if (!candles || !pivots || pivots.length === 0) return [];

  const sweeps = [];

  pivots.forEach((pivot) => {
    const pivotPrice = pivot.price;
    const isHigh = pivot.type === 'HIGH';

    for (let i = pivot.index + 1; i < candles.length; i++) {
      const c = candles[i];

      if (isHigh) {
        if (c.high > pivotPrice && c.close < pivotPrice) {
          sweeps.push({
            id: `swp_bsl_${i}`,
            type: 'BUY_SIDE_SWEEP',
            label: '🎯 BSL Liquidity Sweep',
            index: i,
            time: c.time,
            price: c.high,
            pivotPrice
          });
          break;
        }
      } else {
        if (c.low < pivotPrice && c.close > pivotPrice) {
          sweeps.push({
            id: `swp_ssl_${i}`,
            type: 'SELL_SIDE_SWEEP',
            label: '💧 SSL Liquidity Sweep',
            index: i,
            time: c.time,
            price: c.low,
            pivotPrice
          });
          break;
        }
      }
    }
  });

  return sweeps;
}

/**
 * Calculates ICT 50% Equilibrium (EQ) Premium vs Discount Zones
 */
export function calculateIctEquilibrium(candles) {
  if (!candles || candles.length < 15) return null;

  const recentCandles = candles.slice(-50);
  let maxHigh = -Infinity;
  let minLow = Infinity;

  recentCandles.forEach((c) => {
    if (c.high > maxHigh) maxHigh = c.high;
    if (c.low < minLow) minLow = c.low;
  });

  const eqPrice = (maxHigh + minLow) / 2;
  const currentPrice = candles[candles.length - 1].close;
  const zone = currentPrice >= eqPrice ? 'PREMIUM (Sell Zone)' : 'DISCOUNT (Buy Zone)';

  return {
    maxHigh,
    minLow,
    eqPrice,
    zone,
    isDiscount: currentPrice < eqPrice
  };
}

export function computeSmcAnalysis(candles) {
  if (!candles || candles.length < 20) {
    return { pivots: [], structures: [], orderBlocks: [], fvgs: [], sweeps: [], equilibrium: null, currentTrend: 'NEUTRAL' };
  }

  const pivots = detectPivots(candles, 3, 3);
  const { structures, currentTrend } = detectBOSandCHoCH(candles, pivots);
  const orderBlocks = detectOrderBlocks(candles, pivots, structures);
  const fvgs = detectFairValueGaps(candles);
  const sweeps = detectLiquiditySweeps(candles, pivots);
  const equilibrium = calculateIctEquilibrium(candles);

  // Active unmitigated OBs & unfilled FVGs for maximum clarity & zero clutter
  const activeObs = orderBlocks.filter(ob => !ob.isMitigated).slice(-15);
  const activeFvgs = fvgs.filter(fvg => !fvg.isFilled).slice(-15);
  const activeStructures = structures.slice(-12);
  const activeSweeps = sweeps.slice(-6);

  return {
    pivots,
    structures: activeStructures,
    orderBlocks: activeObs,
    fvgs: activeFvgs,
    sweeps: activeSweeps,
    equilibrium,
    currentTrend
  };
}
