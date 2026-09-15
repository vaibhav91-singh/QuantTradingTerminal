/**
 * Technical Indicators Utilities for Lightweight Charts
 */

export function calculateSMA(candles, period = 20) {
  const result = [];
  if (!candles || candles.length < period) return result;

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) continue;

    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += candles[j].close;
    }

    result.push({
      time: candles[i].time,
      value: Number((sum / period).toFixed(2)),
    });
  }

  return result;
}

export function calculateEMA(candles, period = 20) {
  const result = [];
  if (!candles || candles.length < period) return result;

  const multiplier = 2 / (period + 1);
  let initialSum = 0;

  for (let i = 0; i < period; i++) {
    initialSum += candles[i].close;
  }
  let prevEma = initialSum / period;

  result.push({
    time: candles[period - 1].time,
    value: Number(prevEma.toFixed(2)),
  });

  for (let i = period; i < candles.length; i++) {
    const currentEma = (candles[i].close - prevEma) * multiplier + prevEma;
    result.push({
      time: candles[i].time,
      value: Number(currentEma.toFixed(2)),
    });
    prevEma = currentEma;
  }

  return result;
}

export function calculateRSI(candles, period = 14) {
  const result = [];
  if (!candles || candles.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);

  result.push({
    time: candles[period].time,
    value: Number(rsi.toFixed(2)),
  });

  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const currentGain = change >= 0 ? change : 0;
    const currentLoss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);

    result.push({
      time: candles[i].time,
      value: Number(rsi.toFixed(2)),
    });
  }

  return result;
}

/**
 * Detects key Support & Resistance price levels where price bounces repeatedly
 */
export function calculateSupportResistanceLevels(candles, thresholdPct = 0.4, minTouches = 2) {
  if (!candles || candles.length < 20) return { supportLevels: [], resistanceLevels: [] };

  const recentCandles = candles.slice(-150);
  const pivotLows = [];
  const pivotHighs = [];

  for (let i = 2; i < recentCandles.length - 2; i++) {
    const current = recentCandles[i];
    const prev1 = recentCandles[i - 1];
    const prev2 = recentCandles[i - 2];
    const next1 = recentCandles[i + 1];
    const next2 = recentCandles[i + 2];

    if (current.low <= prev1.low && current.low <= prev2.low && current.low <= next1.low && current.low <= next2.low) {
      pivotLows.push(current.low);
    }
    if (current.high >= prev1.high && current.high >= prev2.high && current.high >= next1.high && current.high >= next2.high) {
      pivotHighs.push(current.high);
    }
  }

  function clusterPrices(prices) {
    const clusters = [];
    prices.forEach(price => {
      const existing = clusters.find(c => Math.abs((c.price - price) / c.price) * 100 <= thresholdPct);
      if (existing) {
        existing.count += 1;
        existing.price = Number(((existing.price * (existing.count - 1) + price) / existing.count).toFixed(2));
      } else {
        clusters.push({ price: Number(price.toFixed(2)), count: 1 });
      }
    });
    return clusters
      .filter(c => c.count >= minTouches)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }

  const supportLevels = clusterPrices(pivotLows);
  const resistanceLevels = clusterPrices(pivotHighs);

  return { supportLevels, resistanceLevels };
}

/**
 * Calculates Visible Range Volume Profile (VRVP) price bins & Point of Control (POC)
 */
export function calculateVolumeProfile(candles, numBins = 24) {
  if (!candles || candles.length < 10) return { bins: [], pocPrice: null, maxVol: 0 };

  const recentCandles = candles.slice(-200);
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  recentCandles.forEach(c => {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
  });

  if (minPrice === Infinity || maxPrice === -Infinity || minPrice >= maxPrice) {
    return { bins: [], pocPrice: null, maxVol: 0 };
  }

  const binStep = (maxPrice - minPrice) / numBins;
  const bins = Array.from({ length: numBins }, (_, idx) => {
    const priceLow = minPrice + idx * binStep;
    const priceHigh = priceLow + binStep;
    return {
      priceLow,
      priceHigh,
      priceMid: (priceLow + priceHigh) / 2,
      buyVol: 0,
      sellVol: 0,
      totalVol: 0
    };
  });

  recentCandles.forEach(c => {
    const vol = c.volume || 100;
    const isBull = c.close >= c.open;
    const mid = (c.high + c.low) / 2;

    const binIdx = Math.min(numBins - 1, Math.max(0, Math.floor((mid - minPrice) / binStep)));
    if (bins[binIdx]) {
      if (isBull) bins[binIdx].buyVol += vol;
      else bins[binIdx].sellVol += vol;
      bins[binIdx].totalVol += vol;
    }
  });

  let maxVol = 0;
  let pocPrice = null;

  bins.forEach(b => {
    if (b.totalVol > maxVol) {
      maxVol = b.totalVol;
      pocPrice = b.priceMid;
    }
  });

  return { bins, pocPrice, maxVol };
}
