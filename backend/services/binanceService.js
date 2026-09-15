import { generateMockCandles } from './mockDataService.js';

// In-Memory Cache (15-Second TTL with Automatic Garbage Collection)
const cache = new Map();
const CACHE_TTL_MS = 15000;

// Automatic Cache Eviction Interval (Runs every 60s to prevent RAM growth)
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of cache.entries()) {
    if (now - val.timestamp > CACHE_TTL_MS * 2) {
      cache.delete(key);
    }
  }
}, 60000);

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
 * Ultra-Fast Parallel Multi-Chunk Deep History Engine for 2-Year Candles across 1m, 5m, 15m, 1h, 4h, 1d
 */
export async function getBinanceKlines(symbol = 'BTCUSDT', interval = '1h', limit = 15000, endTime = null) {
  let formattedSymbol = symbol.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (formattedSymbol === 'XAUUSD' || formattedSymbol === 'XAU' || formattedSymbol === 'GOLD' || formattedSymbol === 'XAUUSDT') {
    formattedSymbol = 'PAXGUSDT';
  }
  const cacheKey = `${formattedSymbol}_${interval}_${limit}_${endTime || 'latest'}`;

  // Check TTL Cache
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const baseUrls = [
    'https://api.binance.com/api/v3/klines',
    'https://api1.binance.com/api/v3/klines',
    'https://api2.binance.com/api/v3/klines',
    'https://api3.binance.com/api/v3/klines'
  ];

  const intervalMin = intervalToMinutes(interval);
  const intervalMs = intervalMin * 60 * 1000;
  
  // Calculate target number of chunks (1000 candles per chunk) up to requested limit
  const maxChunks = Math.min(50, Math.ceil(limit / 1000)); 
  const nowMs = endTime ? Number(endTime) : Date.now();

  const fetchChunk = async (chunkIndex) => {
    const chunkEndTime = nowMs - chunkIndex * (1000 * intervalMs);
    const baseUrl = baseUrls[chunkIndex % baseUrls.length];
    const url = `${baseUrl}?symbol=${formattedSymbol}&interval=${interval}&limit=1000&endTime=${chunkEndTime}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn(`Chunk ${chunkIndex} fetch error (${baseUrl}):`, err.message);
      return [];
    }
  };

  try {
    // Fire all chunk requests concurrently in parallel batches!
    const chunkPromises = [];
    for (let k = 0; k < maxChunks; k++) {
      chunkPromises.push(fetchChunk(k));
    }

    const chunkResults = await Promise.all(chunkPromises);
    const allRawBars = chunkResults.flat();

    if (allRawBars.length > 0) {
      const sortedCandles = allRawBars
        .map((item) => ({
          time: Math.floor(item[0] / 1000), // Open time in seconds
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5])
        }))
        .filter((bar) => !isNaN(bar.time) && !isNaN(bar.close))
        .sort((a, b) => a.time - b.time);

      const candles = [];
      let prevTime = -1;
      for (const bar of sortedCandles) {
        if (bar.time > prevTime) {
          candles.push(bar);
          prevTime = bar.time;
        }
      }

      const result = {
        candles,
        symbol: formattedSymbol,
        interval,
        source: 'Binance REST API (Parallel Multi-Chunk Proxy)',
        isMock: false,
        timestamp: Date.now()
      };

      cache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    }
  } catch (err) {
    console.warn('Parallel chunk fetch failed:', err.message);
  }

  // Fallback to Synthetic Deep History Mock Data if network/geo-blocked
  console.warn('Serving synthetic 2-year deep history candles fallback');
  const fallbackMock = {
    candles: generateMockCandles(formattedSymbol, limit, intervalMin),
    symbol: formattedSymbol,
    interval,
    source: 'Server Fallback Deep Generator',
    isMock: true,
    timestamp: Date.now()
  };

  return fallbackMock;
}


