/**
 * High-fidelity synthetic OHLCV Candle Generator for Server-Side Fallback
 */

export function generateMockCandles(symbol = 'XAU/USD', count = 1500, intervalMinutes = 60) {
  const candles = [];
  
  let basePrice = symbol.includes('XAU') ? 2350.0 : 65000.0;
  let volatility = symbol.includes('XAU') 
    ? (intervalMinutes <= 5 ? 0.0008 : 0.003) 
    : (intervalMinutes <= 5 ? 0.002 : 0.008);
  
  const now = Math.floor(Date.now() / 1000);
  const secondsPerInterval = intervalMinutes * 60;
  let startTime = now - count * secondsPerInterval;
  
  let currentPrice = basePrice;
  let trend = 0.00005;
  
  for (let i = 0; i < count; i++) {
    const time = startTime + i * secondsPerInterval;
    
    if (i % 35 === 0) {
      trend = (Math.random() - 0.48) * (intervalMinutes <= 5 ? 0.0005 : 0.002);
    }
    
    const open = currentPrice;
    const randomReturn = (Math.random() - 0.495) * volatility + trend;
    const close = Math.max(10, open * (1 + randomReturn));
    
    const maxOC = Math.max(open, close);
    const minOC = Math.min(open, close);
    const highWick = Math.random() * volatility * open * 0.8;
    const lowWick = Math.random() * volatility * open * 0.8;
    
    const high = Number((maxOC + highWick).toFixed(2));
    const low = Number((Math.max(10, minOC - lowWick)).toFixed(2));
    const formattedOpen = Number(open.toFixed(2));
    const formattedClose = Number(close.toFixed(2));
    
    const bodySizePct = Math.abs(close - open) / open;
    const baseVol = symbol.includes('XAU') ? 1200 : 450;
    const volume = Math.round((baseVol + Math.random() * baseVol * 2) * (1 + bodySizePct * 50));

    candles.push({
      time,
      open: formattedOpen,
      high: Math.max(high, formattedOpen, formattedClose),
      low: Math.min(low, formattedOpen, formattedClose),
      close: formattedClose,
      volume,
    });
    
    currentPrice = formattedClose;
  }
  
  return candles;
}
