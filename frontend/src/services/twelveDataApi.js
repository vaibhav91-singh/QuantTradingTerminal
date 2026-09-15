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
 * Fetches Gold (XAU/USD) OHLCV data via Express Backend Server Proxy (with direct fallback)
 */
export async function fetchTwelveDataGold(apiKey = '', interval = '1h', outputSize = 500) {
  // Try Express Backend Proxy Endpoint First
  try {
    const backendUrl = `/api/gold?interval=${interval}&limit=${outputSize}&apiKey=${encodeURIComponent(apiKey)}`;
    const response = await fetch(backendUrl);

    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.candles) && data.candles.length > 0) {
        return {
          candles: data.candles,
          source: data.source || 'Express Backend Proxy',
          isMock: data.isMock || false,
          notice: data.notice,
          errorNotice: data.errorNotice
        };
      }
    }
  } catch (backendErr) {
    console.warn('Express Backend proxy unreachable for Gold API, trying direct fetch:', backendErr.message);
  }

  // Direct Twelve Data Fetch Fallback
  if (!apiKey || apiKey.trim() === '') {
    return {
      candles: generateMockCandles('XAU/USD', outputSize, intervalToMinutes(interval)),
      source: 'Mock Data Generator (No API Key Configured)',
      isMock: true,
      notice: 'Using realistic simulated Gold data. Enter a Twelve Data API key in the top bar to pull live XAU/USD data.'
    };
  }

  try {
    const url = `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=${interval}&outputsize=${outputSize}&apikey=${apiKey.trim()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Twelve Data HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status === 'error' || !data.values || !Array.isArray(data.values)) {
      throw new Error(data.message || 'Twelve Data returned an error or invalid format');
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

    return {
      candles,
      source: 'Twelve Data REST API (Direct)',
      isMock: false
    };

  } catch (err) {
    console.warn('Twelve Data API direct fetch failed:', err.message);
    return {
      candles: generateMockCandles('XAU/USD', outputSize, intervalToMinutes(interval)),
      source: 'Fallback Mock Data (Twelve Data Error)',
      isMock: true,
      errorNotice: `Twelve Data API Error: ${err.message}. Using synthetic Gold data.`
    };
  }
}
