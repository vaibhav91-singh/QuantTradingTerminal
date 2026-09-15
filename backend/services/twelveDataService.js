import { generateMockCandles } from './mockDataService.js';

// In-Memory Cache (15-Second TTL)
const cache = new Map();
const CACHE_TTL_MS = 15000;

function intervalToMinutes(interval) {
  switch (interval) {
    case '1m': return 1;
    case '5m': return 5;
    case '15m': return 15;
    case '1h': return 60;
    case '4h': return 240;
    case '1d': return 1440;
    default: return 60;
  }
}

/**
 * Server-Side Twelve Data Gold Proxy
 */
export async function getTwelveDataGold(apiKey = '', interval = '1h', outputSize = 500) {
  const cacheKey = `GOLD_${interval}_${outputSize}_${apiKey ? 'KEY' : 'NOKEY'}`;

  // Check TTL Cache
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  if (!apiKey || apiKey.trim() === '') {
    const mockRes = {
      candles: generateMockCandles('XAU/USD', outputSize, intervalToMinutes(interval)),
      symbol: 'XAU/USD',
      interval,
      source: 'Mock Data Generator (No Twelve Data Key)',
      isMock: true,
      notice: 'Using realistic simulated Gold data. Enter a Twelve Data API key in the top bar to pull live XAU/USD data.',
      timestamp: Date.now()
    };
    return mockRes;
  }

  try {
    const url = `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=${interval}&outputsize=${outputSize}&apikey=${apiKey.trim()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Twelve Data HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === 'error' || !data.values || !Array.isArray(data.values)) {
      throw new Error(data.message || 'Twelve Data returned error or invalid format');
    }

    const seenTimes = new Set();
    const candles = data.values
      .slice()
      .reverse()
      .map(item => {
        const timestamp = Math.floor(new Date(item.datetime + ' UTC').getTime() / 1000);
        return {
          time: isNaN(timestamp) ? Math.floor(Date.now() / 1000) : timestamp,
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
          volume: item.volume ? parseFloat(item.volume) : 0
        };
      })
      .filter(bar => {
        if (isNaN(bar.time) || isNaN(bar.close) || seenTimes.has(bar.time)) return false;
        seenTimes.add(bar.time);
        return true;
      })
      .sort((a, b) => a.time - b.time);

    const result = {
      candles,
      symbol: 'XAU/USD',
      interval,
      source: 'Twelve Data REST API (Server Proxy)',
      isMock: false,
      timestamp: Date.now()
    };

    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;

  } catch (err) {
    console.warn('Twelve Data API Server Proxy Error:', err.message);
    return {
      candles: generateMockCandles('XAU/USD', outputSize, intervalToMinutes(interval)),
      symbol: 'XAU/USD',
      interval,
      source: 'Fallback Mock Data (Twelve Data Error)',
      isMock: true,
      errorNotice: `Twelve Data API Error: ${err.message}. Using synthetic Gold data.`,
      timestamp: Date.now()
    };
  }
}
