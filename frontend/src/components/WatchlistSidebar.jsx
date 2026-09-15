import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Bookmark, Bell, TrendingUp, TrendingDown, Check, X, Sparkles } from 'lucide-react';

export function WatchlistSidebar({
  currentSymbol,
  onSelectSymbol,
  currentPrice,
  priceChange24h
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const dropdownRef = useRef(null);

  const watchlistItems = [
    { symbol: 'BTC/USDT', name: 'Bitcoin / Tether', price: currentSymbol === 'BTC/USDT' ? currentPrice : 65850.00, change: currentSymbol === 'BTC/USDT' ? priceChange24h : 1.45, category: 'CRYPTO' },
    { symbol: 'ETH/USDT', name: 'Ethereum / Tether', price: 3450.20, change: 2.15, category: 'CRYPTO' },
    { symbol: 'SOL/USDT', name: 'Solana / Tether', price: 148.50, change: -0.85, category: 'CRYPTO' },
    { symbol: 'XAU/USD', name: 'Gold Spot / US Dollar', price: currentSymbol === 'XAU/USD' ? currentPrice : 2415.80, change: currentSymbol === 'XAU/USD' ? priceChange24h : 0.62, category: 'COMMODITY' },
    { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0892, change: 0.12, category: 'FOREX' },
    { symbol: 'GBP/USD', name: 'British Pound / US Dollar', price: 1.2945, change: -0.24, category: 'FOREX' },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 224.30, change: 1.18, category: 'STOCKS' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 119.50, change: 3.42, category: 'STOCKS' },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 210.80, change: -1.75, category: 'STOCKS' },
    { symbol: 'SPY', name: 'S&P 500 ETF Trust', price: 552.10, change: 0.45, category: 'INDEX' }
  ];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = ['ALL', 'CRYPTO', 'COMMODITY', 'FOREX', 'STOCKS', 'INDEX'];

  const filteredItems = watchlistItems.filter((item) => {
    const matchesSearch =
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (symbol) => {
    onSelectSymbol(symbol);
    setIsOpen(false);
    setSearchQuery('');
  };

  const activeItem = watchlistItems.find(i => i.symbol === currentSymbol) || watchlistItems[0];

  return (
    <div className="relative w-full font-sans select-none" ref={dropdownRef}>
      
      {/* Sleek Compact Search Box Trigger Bar */}
      <div className="bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-2.5 shadow-xl transition-all">
        <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Search className="w-3 h-3 text-cyan-400" /> SYMBOL SEARCH & WATCHLIST
          </span>
          <span className="text-[9px] bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 px-1.5 py-0.5 rounded font-mono">
            {activeItem.category}
          </span>
        </div>

        {/* Input Bar */}
        <div 
          onClick={() => setIsOpen(true)}
          className="relative flex items-center bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-lg px-3 py-2 cursor-pointer transition-all group"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors mr-2 shrink-0" />
          
          <input
            type="text"
            readOnly={!isOpen}
            value={isOpen ? searchQuery : ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={`Search markets... (e.g. BTC/USDT, XAU/USD, ETH/USDT, AAPL)`}
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none cursor-pointer"
          />

          {!isOpen && (
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="font-mono font-bold text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                {currentSymbol}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </div>
          )}

          {isOpen && searchQuery && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery('');
              }}
              className="p-1 text-slate-500 hover:text-slate-200 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Popular Quick Symbol Pills */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px] font-mono">
          <span className="text-slate-500 text-[9px] uppercase tracking-wider">Quick:</span>
          {['BTC/USDT', 'XAU/USD', 'ETH/USDT', 'NVDA'].map((s) => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                currentSymbol === s
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Popover Dropdown Overlay (Opens on Click) */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-slate-950/95 backdrop-blur-md border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col max-h-[380px] animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header & Categories */}
          <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> SELECT MARKET INSTRUMENT
              </span>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[9px]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Instrument List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
            {filteredItems.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No matching instruments found
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.symbol === currentSymbol;
                const isPos = item.change >= 0;

                return (
                  <div
                    key={item.symbol}
                    onClick={() => handleSelect(item.symbol)}
                    className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition-all hover:bg-cyan-500/10 ${
                      isSelected ? 'bg-cyan-500/15 border-l-2 border-cyan-400' : 'hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-100 text-xs">{item.symbol}</span>
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                          {item.name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-100 text-xs">
                        ${item.price < 10 ? item.price.toFixed(4) : item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPos ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {isPos ? '+' : ''}{item.change.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Status */}
          <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Showing {filteredItems.length} markets</span>
            <span className="text-cyan-400">Click to switch chart</span>
          </div>

        </div>
      )}

    </div>
  );
}

