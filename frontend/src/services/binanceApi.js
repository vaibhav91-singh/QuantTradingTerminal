import { generateMockCandles } from './mockDataGenerator';

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
 * Fetches BTC/USDT OHLCV klines via Express Backend Server Proxy (with parallel multi-chunk fallback up to 50,000 candles)
 */
export async function fetchBinanceKlines(symbol = 'BTCUSDT', interval = '1h', limit = 15000, endTime = null) {
  let formattedSymbol = symbol.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (formattedSymbol === 'XAUUSD' || formattedSymbol === 'XAU' || formattedSymbol === 'GOLD' || formattedSymbol === 'XAUUSDT') {
    formattedSymbol = 'PAXGUSDT';
  }

  const safeInterval = (interval && interval !== 'undefined') ? interval : '1h';

  // Try Express Backend Proxy Endpoint First
  try {
    let backendUrl = `/api/klines?symbol=${formattedSymbol}&interval=${safeInterval}&limit=${limit}`;
    if (endTime) backendUrl += `&endTime=${endTime}`;
    
    const response = await fetch(backendUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.candles) && data.candles.length > 0) {
        return {
          candles: data.candles,
          source: data.source || 'Express Backend Proxy',
          isMock: data.isMock || false,
          errorNotice: data.errorNotice
        };
      }
    }
  } catch (backendErr) {
    console.warn('Express Backend proxy unreachable, trying direct Binance fetch:', backendErr.message);
  }

  // Direct Binance REST API Fallback Pool with Parallel Chunks
  const baseUrls = [
    'https://api.binance.com/api/v3/klines',
    'https://api1.binance.com/api/v3/klines',
    'https://api2.binance.com/api/v3/klines',
    'https://api3.binance.com/api/v3/klines'
  ];

  const intervalMin = intervalToMinutes(safeInterval);
  const intervalMs = intervalMin * 60 * 1000;
  const maxChunks = Math.min(50, Math.ceil(limit / 1000));
  const nowMs = endTime ? Number(endTime) : Date.now();

  const fetchChunk = async (chunkIndex) => {
    const chunkEndTime = nowMs - chunkIndex * (1000 * intervalMs);
    const baseUrl = baseUrls[chunkIndex % baseUrls.length];
    const url = `${baseUrl}?symbol=${formattedSymbol}&interval=${safeInterval}&limit=1000&endTime=${chunkEndTime}`;

    try {
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return [];
    }
  };

  try {
    const chunkPromises = [];
    for (let k = 0; k < maxChunks; k++) {
      chunkPromises.push(fetchChunk(k));
    }

    const chunkResults = await Promise.all(chunkPromises);
    const allRawBars = chunkResults.flat();

    if (allRawBars.length > 0) {
      const sortedCandles = allRawBars
        .map((item) => ({
          time: Math.floor(item[0] / 1000),
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

      return {
        candles,
        source: 'Binance REST API (Direct Parallel)',
        isMock: false
      };
    }
  } catch (err) {
    console.warn('Direct fetch error:', err.message);
  }

  // Fallback mock generator
  return {
    candles: generateMockCandles(formattedSymbol, limit, intervalMin),
    source: 'Fallback Mock Engine (Binance Offline)',
    isMock: true
  };
}

