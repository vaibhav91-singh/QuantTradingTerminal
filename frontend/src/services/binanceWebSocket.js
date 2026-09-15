/**
 * Live WebSocket Manager for Binance Real-Time Kline/Candle Stream
 */

export class BinanceWebSocketManager {
  constructor(symbol = 'BTCUSDT', interval = '1m', onTickCallback) {
    this.symbol = symbol.replace(/[^A-Z0-9]/gi, '').toLowerCase();
    this.interval = interval;
    this.onTick = onTickCallback;
    this.ws = null;
    this.isClosed = false;
  }

  connect() {
    this.isClosed = false;
    const streamName = `${this.symbol}@kline_${this.interval}`;
    const url = `wss://stream.binance.com:9443/ws/${streamName}`;

    try {
      this.ws = new WebSocket(url);

      this.pendingBar = null;
      this.rafId = null;

      this.ws.onmessage = (event) => {
        if (this.isClosed) return;
        try {
          const data = JSON.parse(event.data);
          if (data && data.k) {
            const k = data.k;
            this.pendingBar = {
              time: Math.floor(k.t / 1000), // Open time in seconds
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
              volume: parseFloat(k.v)
            };

            if (!this.rafId) {
              this.rafId = requestAnimationFrame(() => {
                if (this.onTick && this.pendingBar && !this.isClosed) {
                  this.onTick(this.pendingBar);
                }
                this.rafId = null;
              });
            }
          }
        } catch (err) {
          console.warn('Binance WebSocket parse error:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Binance WebSocket error:', err);
      };

      this.ws.onclose = () => {
        if (!this.isClosed) {
          // Reconnect after 3 seconds if disconnected unexpectedly
          setTimeout(() => this.connect(), 3000);
        }
      };
    } catch (e) {
      console.warn('Binance WebSocket connection error:', e);
    }
  }

  close() {
    this.isClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
