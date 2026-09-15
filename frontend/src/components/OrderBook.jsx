import React, { useState, useEffect, useMemo } from 'react';
import { Layers, ArrowUpRight, ArrowDownRight, Clock, Zap, Flame, X } from 'lucide-react';

export const OrderBook = React.memo(function OrderBook({ currentPrice, symbol }) {
  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'trades'
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [recentTape, setRecentTape] = useState([]);
  const [whaleAlert, setWhaleAlert] = useState(null); // { type: 'BUY' | 'SELL', price, size, valUsd, timeStr }
  const [isWhaleAlertDismissed, setIsWhaleAlertDismissed] = useState(false);

  const assetSymbol = symbol ? symbol.split('/')[0] : 'BTC';

  // Smooth & stable order book depth updates (1000ms tick, micro nudges)
  useEffect(() => {
    if (!currentPrice || currentPrice <= 0) return;

    const step = symbol.includes('XAU') ? 0.25 : 8.5;
    const baseWhaleSize = symbol.includes('XAU') ? 35.0 : 2.85;

    // Generate initial stable depth layout
    const asks = [];
    const bids = [];
    let totalAskVol = 0;
    let totalBidVol = 0;

    // 5 Ask levels
    for (let i = 5; i >= 1; i--) {
      const price = Number((currentPrice + i * step).toFixed(2));
      const isWhale = i === 4;
      const size = isWhale ? baseWhaleSize : Number((Math.random() * 0.8 + 0.2).toFixed(3));
      totalAskVol += size;
      asks.push({ price, size, total: Number(totalAskVol.toFixed(3)), isWhale });
    }

    // 5 Bid levels
    for (let i = 1; i <= 5; i++) {
      const price = Number((currentPrice - i * step).toFixed(2));
      const isWhale = i === 4;
      const size = isWhale ? baseWhaleSize + 0.4 : Number((Math.random() * 0.8 + 0.2).toFixed(3));
      totalBidVol += size;
      bids.push({ price, size, total: Number(totalBidVol.toFixed(3)), isWhale });
    }

    setOrderBook({ asks, bids });

    const whaleBid = bids.find(b => b.isWhale);
    if (whaleBid) {
      setWhaleAlert({
        type: 'BUY',
        price: whaleBid.price,
        size: whaleBid.size,
        valUsd: Math.round(whaleBid.price * whaleBid.size),
        timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    // Live Tape & smooth Order Book micro update every 1000ms
    const intervalId = setInterval(() => {
      setOrderBook(prev => {
        if (!prev.asks.length || !prev.bids.length) return prev;

        let accumAsk = 0;
        let accumBid = 0;

        const newAsks = prev.asks.map((ask, idx) => {
          const price = Number((currentPrice + (5 - idx) * step).toFixed(2));
          // Micro nudge size slightly (+/- 2%)
          const nudge = (Math.random() - 0.5) * 0.04;
          const size = Math.max(0.1, Number((ask.size + (ask.isWhale ? 0 : nudge)).toFixed(3)));
          accumAsk += size;
          return { ...ask, price, size, total: Number(accumAsk.toFixed(3)) };
        });

        const newBids = prev.bids.map((bid, idx) => {
          const price = Number((currentPrice - (idx + 1) * step).toFixed(2));
          const nudge = (Math.random() - 0.5) * 0.04;
          const size = Math.max(0.1, Number((bid.size + (bid.isWhale ? 0 : nudge)).toFixed(3)));
          accumBid += size;
          return { ...bid, price, size, total: Number(accumBid.toFixed(3)) };
        });

        return { asks: newAsks, bids: newBids };
      });

      // Add 1 Tape item
      const isBuy = Math.random() > 0.48;
      const offset = (Math.random() - 0.5) * (symbol.includes('XAU') ? 0.3 : 10);
      const price = Number((currentPrice + offset).toFixed(2));
      const qty = Number((Math.random() * (symbol.includes('XAU') ? 8 : 0.8) + 0.01).toFixed(3));
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      setRecentTape(prev => [
        { id: Date.now() + Math.random(), timeStr, price, qty, side: isBuy ? 'BUY' : 'SELL' },
        ...prev.slice(0, 11)
      ]);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [currentPrice, symbol]);

  // Smooth Order Book Liquidity Imbalance Ratio
  const imbalance = useMemo(() => {
    const askSum = orderBook.asks.reduce((acc, a) => acc + a.size, 0);
    const bidSum = orderBook.bids.reduce((acc, b) => acc + b.size, 0);
    const total = askSum + bidSum;

    if (total === 0) return { bidPct: 50, askPct: 50, status: 'BALANCED' };

    const bidPct = Math.round((bidSum / total) * 100);
    const askPct = 100 - bidPct;

    let status = 'BALANCED';
    if (bidPct >= 56) status = 'BUYER DOMINANCE';
    else if (askPct >= 56) status = 'SELLER PRESSURE';

    return { bidPct, askPct, status };
  }, [orderBook]);

  const maxTotal = Math.max(
    ...(orderBook.asks.map(a => a.total).concat(orderBook.bids.map(b => b.total))) || [1]
  );

  return (
    <div className="terminal-card rounded-xl p-3 border border-slate-800 flex flex-col gap-2.5 font-mono select-none min-h-[350px]">
      
      {/* Header Bar & Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>ORDER BOOK & TAPE</span>
        </div>

        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
          <button
            onClick={() => setActiveTab('book')}
            className={`px-2 py-0.5 rounded font-bold transition-all ${
              activeTab === 'book'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DOM Depth
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-2 py-0.5 rounded font-bold transition-all ${
              activeTab === 'trades'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Tape
          </button>
        </div>
      </div>

      {/* 1. Order Book Liquidity Imbalance Meter Bar */}
      <div className="bg-slate-950/90 border border-slate-800/90 p-2 rounded-xl flex flex-col gap-1.5 shadow-inner">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <div className="flex items-center gap-1 text-emerald-400 tabular-nums">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>BIDS {imbalance.bidPct}%</span>
          </div>

          <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold border ${
            imbalance.status === 'BUYER DOMINANCE' 
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-sm'
              : imbalance.status === 'SELLER PRESSURE'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-700'
          }`}>
            {imbalance.status === 'BUYER DOMINANCE' && '⚡ '}
            {imbalance.status === 'SELLER PRESSURE' && '🔥 '}
            {imbalance.status}
          </span>

          <div className="flex items-center gap-1 text-rose-400 tabular-nums">
            <span>ASKS {imbalance.askPct}%</span>
            <Flame className="w-3 h-3 text-rose-400" />
          </div>
        </div>

        {/* Imbalance Dual Progress Bar */}
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
          <div 
            style={{ width: `${imbalance.bidPct}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-sm"
          />
          <div 
            style={{ width: `${imbalance.askPct}%` }}
            className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500 shadow-sm"
          />
        </div>
      </div>

      {/* 2. Whale Order Alert Notification Badge (Fixed Layout Reserved) */}
      {whaleAlert && !isWhaleAlertDismissed && (
        <div className="bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 p-1.5 rounded-xl flex items-center justify-between gap-2 text-[10px] shadow-md">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs shrink-0">🐳</span>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold uppercase tracking-wide truncate text-[10px]">
                WHALE {whaleAlert.type} WALL @ ${whaleAlert.price}
              </span>
              <span className="text-[9px] opacity-80 font-mono truncate">
                Size: {whaleAlert.size} {assetSymbol} (~${whaleAlert.valUsd.toLocaleString()})
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsWhaleAlertDismissed(true)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer shrink-0"
            title="Dismiss Whale Alert"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'book' ? (
        <div className="flex flex-col gap-1 text-[11px]">
          {/* Table Headers */}
          <div className="grid grid-cols-[1.25fr_1fr_1fr] text-slate-500 text-[10px] pb-1 border-b border-slate-900 font-mono">
            <span>Price ($)</span>
            <span className="text-right">Size ({assetSymbol})</span>
            <span className="text-right">Total</span>
          </div>

          {/* Asks (Sell Orders - Red) */}
          <div className="flex flex-col gap-0.5">
            {orderBook.asks.map((ask) => {
              const pct = Math.min(100, (ask.total / maxTotal) * 100);
              return (
                <div 
                  key={ask.price} 
                  className={`grid grid-cols-[1.25fr_1fr_1fr] relative py-0.5 font-mono rounded px-0.5 transition-all h-6 items-center ${
                    ask.isWhale 
                      ? 'bg-rose-500/20 border border-rose-500/70 shadow-sm' 
                      : ''
                  }`}
                >
                  <div
                    style={{ width: `${pct}%` }}
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/15 rounded-l pointer-events-none"
                  />
                  <span className="text-rose-400 font-bold z-10 whitespace-nowrap flex items-center gap-1 tabular-nums">
                    ${ask.price}
                    {ask.isWhale && <span className="text-[9px]" title="Whale Sell Wall">🐳</span>}
                  </span>
                  <span className={`text-right z-10 tabular-nums ${ask.isWhale ? 'text-amber-300 font-black' : 'text-slate-300'}`}>
                    {ask.size}
                  </span>
                  <span className="text-slate-500 text-right z-10 tabular-nums">{ask.total}</span>
                </div>
              );
            })}
          </div>

          {/* Current Spread Price Indicator */}
          <div className="bg-slate-950 my-1 py-1 px-2 rounded-lg border border-slate-800 flex items-center justify-between font-bold h-6 items-center">
            <span className="text-slate-400 text-[10px]">MARKET SPREAD</span>
            <span className="text-emerald-400 text-xs font-mono tabular-nums">${currentPrice ? currentPrice.toFixed(2) : '0.00'}</span>
          </div>

          {/* Bids (Buy Orders - Green) */}
          <div className="flex flex-col gap-0.5">
            {orderBook.bids.map((bid) => {
              const pct = Math.min(100, (bid.total / maxTotal) * 100);
              return (
                <div 
                  key={bid.price} 
                  className={`grid grid-cols-[1.25fr_1fr_1fr] relative py-0.5 font-mono rounded px-0.5 transition-all h-6 items-center ${
                    bid.isWhale 
                      ? 'bg-emerald-500/20 border border-emerald-500/70 shadow-sm' 
                      : ''
                  }`}
                >
                  <div
                    style={{ width: `${pct}%` }}
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 rounded-l pointer-events-none"
                  />
                  <span className="text-emerald-400 font-bold z-10 whitespace-nowrap flex items-center gap-1 tabular-nums">
                    ${bid.price}
                    {bid.isWhale && <span className="text-[9px]" title="Whale Buy Wall">🐳</span>}
                  </span>
                  <span className={`text-right z-10 tabular-nums ${bid.isWhale ? 'text-amber-300 font-black' : 'text-slate-300'}`}>
                    {bid.size}
                  </span>
                  <span className="text-slate-500 text-right z-10 tabular-nums">{bid.total}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Live Time & Sales Tape Stream */
        <div className="flex flex-col gap-1 text-[11px] max-h-[300px] overflow-y-auto">
          <div className="grid grid-cols-3 text-slate-500 text-[10px] pb-1 border-b border-slate-900">
            <span>Time</span>
            <span className="text-right">Price ($)</span>
            <span className="text-right">Qty</span>
          </div>

          {recentTape.map((trade) => (
            <div key={trade.id} className="grid grid-cols-3 items-center py-0.5 border-b border-slate-950 text-[10px] h-5">
              <span className="text-slate-500 flex items-center gap-1 tabular-nums">
                <Clock className="w-2.5 h-2.5 text-slate-600" />
                {trade.timeStr}
              </span>
              <span className={`text-right font-bold tabular-nums ${trade.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${trade.price}
              </span>
              <span className="text-slate-300 text-right flex items-center justify-end gap-0.5 tabular-nums">
                {trade.qty}
                {trade.side === 'BUY' ? (
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-rose-400" />
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

