import React from 'react';
import { 
  TrendingUp, 
  Key, 
  RotateCcw, 
  RefreshCw, 
  DollarSign, 
  BarChart2, 
  Clock,
  LayoutGrid,
  Cpu,
  Mic,
  Dices,
  FileText,
  Activity,
  Settings,
  Undo2,
  Redo2,
  Camera,
  Search,
  Sliders
} from 'lucide-react';

export const Header = React.memo(function Header({
  symbol,
  onSymbolChange,
  interval,
  onIntervalChange,
  onLoadChart,
  isLoading,
  twelveDataKey,
  onOpenApiKeyModal,
  dataSourceInfo,
  currentPrice,
  priceChange24h,
  high24h,
  low24h,
  volume24h,
  candleCountdown,
  wallet,
  onResetAccount,
  activeIndicators,
  onToggleIndicator,
  isSplitScreen,
  onToggleSplitScreen,
  onOpenStrategyTester,
  onOpenMonteCarlo,
  onOpenReport,
  isVoiceListening,
  onToggleVoice,
  onOpenIndicatorsModal,
  onOpenChartSettings,
  chartType = 'candlestick',
  onChangeChartType,
  onUndo,
  onRedo,
  onTakeSnapshot
}) {
  const isPositive = priceChange24h >= 0;

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 px-3 py-2 backdrop-blur-md sticky top-0 z-30 shadow-xl font-sans select-none">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        
        {/* Left Section: Logo & Asset Selector & TradingView Controls */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* Logo */}
          <div className="flex items-center gap-1.5 font-bold text-base tracking-wider text-emerald-400">
            <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-mono text-sm font-black">
              QUANT<span className="text-slate-100 font-light">TERMINAL</span>
            </span>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Symbol Dropdown Selector */}
          <div className="relative">
            <select
              value={symbol}
              onChange={(e) => onSymbolChange(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 hover:border-emerald-500/50 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer font-mono shadow-sm transition-all"
            >
              <option value="BTC/USDT">BTC/USDT — Bitcoin (Binance API)</option>
              <option value="XAU/USD">XAU/USD — Gold (Twelve Data / Mock)</option>
              <option value="ETH/USDT">ETH/USDT — Ethereum (Binance API)</option>
              <option value="SOL/USDT">SOL/USDT — Solana (Binance API)</option>
              <option value="AAPL">AAPL — Apple Inc (Stocks)</option>
              <option value="NVDA">NVDA — NVIDIA Corp (Stocks)</option>
              <option value="EUR/USD">EUR/USD — Forex Euro</option>
            </select>
          </div>

          {/* Timeframe Selector Pills */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
            {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
              <button
                key={tf}
                onClick={() => onIntervalChange(tf)}
                className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                  interval === tf
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Series Type Dropdown */}
          <div className="relative">
            <select
              value={chartType}
              onChange={(e) => onChangeChartType && onChangeChartType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer font-mono"
            >
              <option value="candlestick">🕯️ Candles</option>
              <option value="line">📈 Line</option>
              <option value="area">🌊 Area</option>
              <option value="bars">📊 Bars</option>
            </select>
          </div>

          {/* fx Indicators Library Modal Button */}
          <button
            onClick={onOpenIndicatorsModal}
            className="flex items-center gap-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-bold px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer shadow-sm font-mono active:scale-95"
            title="Open TradingView fx Indicators & Strategies Library"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>fx Indicators</span>
          </button>

          {/* Load Chart Refresh Button */}
          <button
            onClick={onLoadChart}
            disabled={isLoading}
            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2.5 py-1 rounded-lg text-xs tracking-wide transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden xl:inline">{isLoading ? 'Loading...' : 'Refresh'}</span>
          </button>

          {/* Undo / Redo */}
          {onUndo && (
            <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button onClick={onUndo} className="p-1 text-slate-400 hover:text-slate-100 cursor-pointer" title="Undo (Ctrl+Z)">
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={onRedo} className="p-1 text-slate-400 hover:text-slate-100 cursor-pointer" title="Redo (Ctrl+Y)">
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Split Screen Multi-Chart Toggle */}
          <button
            onClick={onToggleSplitScreen}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer font-mono ${
              isSplitScreen
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
            title="Toggle Split-Screen Multi-Chart Layout"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">{isSplitScreen ? '2 Charts' : '1 Chart'}</span>
          </button>

          {/* Strategy Tester */}
          <button
            onClick={onOpenStrategyTester}
            className="hidden xl:flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300 font-bold px-2 py-1 rounded-lg text-xs transition-all cursor-pointer active:scale-95"
            title="Open Auto Strategy Rule Tester"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tester</span>
          </button>

          {/* JARVIS Voice Trader */}
          <button
            onClick={onToggleVoice}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer active:scale-95 font-mono ${
              isVoiceListening
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow animate-pulse'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
            title="Toggle Voice AI Assistant"
          >
            <Mic className={`w-3.5 h-3.5 ${isVoiceListening ? 'text-rose-400' : 'text-slate-400'}`} />
            <span className="hidden lg:inline">{isVoiceListening ? 'Listening...' : 'JARVIS'}</span>
          </button>

          {/* Monte Carlo Risk Simulator */}
          <button
            onClick={onOpenMonteCarlo}
            className="hidden xl:flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-purple-400 hover:text-purple-300 font-bold px-2 py-1 rounded-lg text-xs transition-all cursor-pointer active:scale-95"
            title="Run 1,000 Monte Carlo Risk Simulation"
          >
            <Dices className="w-3.5 h-3.5 text-purple-400" />
            <span>Monte Carlo</span>
          </button>

          {/* Report */}
          <button
            onClick={onOpenReport}
            className="hidden xl:flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-emerald-400 hover:text-emerald-300 font-bold px-2 py-1 rounded-lg text-xs transition-all cursor-pointer active:scale-95"
            title="Generate Backtest Performance Report"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Report</span>
          </button>

          {/* Chart Settings Gear */}
          <button
            onClick={onOpenChartSettings}
            className="p-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-all cursor-pointer"
            title="Chart Properties & Styles"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Middle Section: Ticker Info & Market Stats */}
        {currentPrice && (
          <div className="flex items-center gap-3 text-xs bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 overflow-x-auto font-mono">
            <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
              <span className="text-slate-400 font-bold uppercase">{symbol}</span>
              <span className="font-bold text-sm text-slate-100">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {isPositive ? '+' : ''}{priceChange24h.toFixed(2)}%
              </span>
            </div>

            {candleCountdown && (
              <div className="flex items-center gap-1 text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 text-[11px]">
                <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Close: {candleCountdown}</span>
              </div>
            )}

            <div className="hidden xl:flex items-center gap-3 text-slate-300 text-[11px] whitespace-nowrap">
              <div>
                <span className="text-slate-500">24h H: </span>
                <span className="text-emerald-400 font-medium">${high24h.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500">24h L: </span>
                <span className="text-rose-400 font-medium">${low24h.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Right Section: Virtual Wallet */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-emerald-500/30">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <div>
              <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider leading-none">
                Virtual Balance
              </div>
              <div className="text-xs font-bold font-mono text-emerald-400 leading-tight">
                ${wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <button
              onClick={onResetAccount}
              className="ml-1 text-slate-400 hover:text-slate-100 p-0.5 rounded hover:bg-slate-800 transition-all cursor-pointer"
              title="Reset Virtual Wallet Balance to $10,000.00"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
});
