import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ShieldAlert, Percent, DollarSign, Zap, MoveVertical, Coins, Sliders, CheckSquare, Square } from 'lucide-react';
import { AiConfluenceMatrix } from './AiConfluenceMatrix';

export const OrderPanel = React.memo(function OrderPanel({
  currentPrice,
  symbol,
  wallet,
  activeTrade,
  onExecuteTrade,
  stopLossPrice,
  onStopLossChange,
  isSlEnabled,
  onToggleSlEnabled,
  takeProfitPrice,
  onTakeProfitChange,
  isTpEnabled,
  onToggleTpEnabled,
  candles,
  smcData,
  mlData,
  onApplyAiTrade
}) {
  const [sizeMode, setSizeMode] = useState('USD');
  const [orderSizeUsd, setOrderSizeUsd] = useState(1000);
  const [assetQtyInput, setAssetQtyInput] = useState(0.015);
  const [leverage, setLeverage] = useState(10);

  const assetSymbol = symbol.split('/')[0];

  // Auto initialize default SL/TP values when enabled
  useEffect(() => {
    if (currentPrice) {
      if (isSlEnabled && (!stopLossPrice || stopLossPrice === '')) {
        onStopLossChange((currentPrice * 0.985).toFixed(2));
      }
      if (isTpEnabled && (!takeProfitPrice || takeProfitPrice === '')) {
        onTakeProfitChange((currentPrice * 1.03).toFixed(2));
      }
    }
  }, [currentPrice, isSlEnabled, isTpEnabled]);

  // Calculations based on Sizing Mode
  let calculatedQuantity = 0;
  let totalPositionValueUsd = 0;
  let requiredMarginUsd = 0;

  if (currentPrice && currentPrice > 0) {
    if (sizeMode === 'USD') {
      totalPositionValueUsd = orderSizeUsd * leverage;
      calculatedQuantity = (totalPositionValueUsd / currentPrice);
      requiredMarginUsd = orderSizeUsd;
    } else {
      calculatedQuantity = assetQtyInput;
      totalPositionValueUsd = assetQtyInput * currentPrice;
      requiredMarginUsd = totalPositionValueUsd / leverage;
    }
  }

  const handlePercentageClick = (pct) => {
    const marginAmount = Math.max(10, Math.floor((wallet.balance * (pct / 100))));
    if (sizeMode === 'USD') {
      setOrderSizeUsd(marginAmount);
    } else if (currentPrice) {
      const totalExposure = marginAmount * leverage;
      setAssetQtyInput(Number((totalExposure / currentPrice).toFixed(4)));
    }
  };

  const handleSlPreset = (pctOffset) => {
    if (!currentPrice) return;
    const price = currentPrice * (1 + pctOffset / 100);
    onStopLossChange(price.toFixed(2));
  };

  const handleTpPreset = (pctOffset) => {
    if (!currentPrice) return;
    const price = currentPrice * (1 + pctOffset / 100);
    onTakeProfitChange(price.toFixed(2));
  };

  // Risk / Reward Ratio Calculation
  const slNum = isSlEnabled ? parseFloat(stopLossPrice) : NaN;
  const tpNum = isTpEnabled ? parseFloat(takeProfitPrice) : NaN;
  let rrRatio = 'N/A';

  if (currentPrice && !isNaN(slNum) && !isNaN(tpNum)) {
    const risk = Math.abs(currentPrice - slNum);
    const reward = Math.abs(tpNum - currentPrice);
    if (risk > 0) {
      rrRatio = `1 : ${(reward / risk).toFixed(2)}`;
    }
  }

  const handleOrder = (side) => {
    if (!currentPrice) return;
    
    onExecuteTrade({
      side,
      symbol,
      entryPrice: currentPrice,
      sizeUsd: parseFloat(totalPositionValueUsd.toFixed(2)),
      leverage: parseInt(leverage, 10),
      quantity: parseFloat(calculatedQuantity.toFixed(4)),
      stopLoss: isSlEnabled && !isNaN(slNum) ? slNum : null,
      takeProfit: isTpEnabled && !isNaN(tpNum) ? tpNum : null,
    });
  };

  return (
    <div className="terminal-card rounded-xl p-4 border border-slate-800 flex flex-col gap-4">
      {/* Integrated AI Confluence Matrix */}
      <AiConfluenceMatrix
        candles={candles}
        smcData={smcData}
        mlData={mlData}
        symbol={symbol}
        onApplyAiTrade={onApplyAiTrade}
        isEmbedded={true}
      />

      {/* Header Title & Unit Mode Switcher */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-slate-100 tracking-wide">ORDER EXECUTION</h3>
        </div>

        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
          <button
            type="button"
            onClick={() => setSizeMode('USD')}
            className={`px-2.5 py-0.5 rounded font-mono font-bold transition-all ${
              sizeMode === 'USD'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            $ USD
          </button>
          <button
            type="button"
            onClick={() => setSizeMode('ASSET')}
            className={`px-2.5 py-0.5 rounded font-mono font-bold transition-all ${
              sizeMode === 'ASSET'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ₿ {assetSymbol}
          </button>
        </div>
      </div>

      {/* Position Sizing Input */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">
            {sizeMode === 'USD' ? 'Margin Amount ($)' : `Amount in ${assetSymbol}`}
          </span>
          <span className="text-slate-500 font-mono">Wallet: ${wallet.balance.toLocaleString()}</span>
        </div>
        
        <div className="relative">
          {sizeMode === 'USD' ? (
            <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          ) : (
            <Coins className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          )}

          {sizeMode === 'USD' ? (
            <input
              type="number"
              value={orderSizeUsd}
              onChange={(e) => setOrderSizeUsd(Math.max(1, parseFloat(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-slate-100 focus:outline-none"
              placeholder="1000"
            />
          ) : (
            <input
              type="number"
              step="0.001"
              value={assetQtyInput}
              onChange={(e) => setAssetQtyInput(Math.max(0.0001, parseFloat(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-slate-100 focus:outline-none"
              placeholder={`Amount of ${assetSymbol}`}
            />
          )}
        </div>

        {/* Quick Percentage Presets */}
        <div className="grid grid-cols-4 gap-1.5 mt-1">
          {[10, 25, 50, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => handlePercentageClick(pct)}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded py-1 text-[11px] font-mono font-medium text-slate-300 hover:text-emerald-400 transition-all"
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {/* Leverage Selector (Up to 200x) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Sliders className="w-3 h-3 text-emerald-400" /> Leverage (Max 200x)
          </span>
          <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-xs ${
            leverage > 50 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-emerald-400'
          }`}>
            {leverage}x
          </span>
        </div>

        <input
          type="range"
          min={1}
          max={200}
          value={leverage}
          onChange={(e) => setLeverage(parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
        />

        <div className="grid grid-cols-6 gap-1 mt-1">
          {[1, 5, 20, 50, 100, 200].map((lev) => (
            <button
              key={lev}
              type="button"
              onClick={() => setLeverage(lev)}
              className={`py-1 rounded text-[11px] font-mono font-bold transition-all ${
                leverage === lev
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {lev}x
            </button>
          ))}
        </div>
      </div>

      {/* Calculated Quantity & Margin Breakdown */}
      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex flex-col gap-1 text-xs font-mono">
        <div className="flex justify-between text-slate-400">
          <span>Est. Quantity:</span>
          <span className="text-emerald-400 font-bold">{calculatedQuantity.toFixed(4)} {assetSymbol}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Total Exposure:</span>
          <span className="text-slate-200">${totalPositionValueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Required Margin:</span>
          <span className="text-slate-200">${requiredMarginUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-slate-400 border-t border-slate-900 pt-1 mt-1">
          <span>Risk / Reward:</span>
          <span className="text-emerald-400 font-bold">{rrRatio}</span>
        </div>
      </div>

      {/* Optional Risk Management Controls (Real-life Scenario: SL & TP Toggles) */}
      <div className="flex flex-col gap-2.5 border-t border-slate-800 pt-3">
        <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
          <span>RISK MANAGEMENT (SL / TP)</span>
          {(isSlEnabled || isTpEnabled) && (
            <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
              <MoveVertical className="w-3 h-3 text-cyan-400" /> Chart Drag Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Stop Loss Toggle & Input */}
          <div className="flex flex-col gap-1 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={onToggleSlEnabled}
              className="flex items-center gap-1.5 text-xs text-rose-400 font-bold text-left cursor-pointer select-none"
            >
              {isSlEnabled ? (
                <CheckSquare className="w-4 h-4 text-rose-500 fill-rose-500/20" />
              ) : (
                <Square className="w-4 h-4 text-slate-600" />
              )}
              <span>Stop Loss</span>
            </button>

            {isSlEnabled ? (
              <>
                <input
                  type="number"
                  value={stopLossPrice}
                  onChange={(e) => onStopLossChange(e.target.value)}
                  className="w-full bg-slate-900 border border-rose-500/40 focus:border-rose-500 rounded-lg px-2.5 py-1 text-xs font-mono text-rose-300 focus:outline-none mt-1"
                  placeholder="SL Price"
                />
                <div className="flex gap-1 mt-1">
                  {[-1, -2, -3].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleSlPreset(pct)}
                      className="flex-1 bg-slate-900 hover:bg-rose-500/20 text-rose-400 border border-slate-800 hover:border-rose-500/40 rounded text-[10px] font-mono py-0.5 transition-all"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <span className="text-[10px] text-slate-600 font-mono mt-1">SL Line Off</span>
            )}
          </div>

          {/* Take Profit Toggle & Input */}
          <div className="flex flex-col gap-1 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={onToggleTpEnabled}
              className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold text-left cursor-pointer select-none"
            >
              {isTpEnabled ? (
                <CheckSquare className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
              ) : (
                <Square className="w-4 h-4 text-slate-600" />
              )}
              <span>Take Profit</span>
            </button>

            {isTpEnabled ? (
              <>
                <input
                  type="number"
                  value={takeProfitPrice}
                  onChange={(e) => onTakeProfitChange(e.target.value)}
                  className="w-full bg-slate-900 border border-emerald-500/40 focus:border-emerald-500 rounded-lg px-2.5 py-1 text-xs font-mono text-emerald-300 focus:outline-none mt-1"
                  placeholder="TP Price"
                />
                <div className="flex gap-1 mt-1">
                  {[1, 2, 4].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleTpPreset(pct)}
                      className="flex-1 bg-slate-900 hover:bg-emerald-500/20 text-emerald-400 border border-slate-800 hover:border-emerald-500/40 rounded text-[10px] font-mono py-0.5 transition-all"
                    >
                      +{pct}%
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <span className="text-[10px] text-slate-600 font-mono mt-1">TP Line Off</span>
            )}
          </div>
        </div>
      </div>

      {/* Execution Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-1">
        <button
          onClick={() => handleOrder('BUY')}
          disabled={!!activeTrade || !currentPrice || requiredMarginUsd > wallet.balance}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          <TrendingUp className="w-4 h-4" />
          <span>BUY (LONG)</span>
        </button>

        <button
          onClick={() => handleOrder('SELL')}
          disabled={!!activeTrade || !currentPrice || requiredMarginUsd > wallet.balance}
          className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-400 disabled:opacity-40 disabled:hover:bg-rose-500 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          <TrendingDown className="w-4 h-4" />
          <span>SELL (SHORT)</span>
        </button>
      </div>

      {requiredMarginUsd > wallet.balance && (
        <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2 text-center">
          Insufficient Balance! Required Margin (${requiredMarginUsd.toFixed(2)}) exceeds balance.
        </div>
      )}

      {activeTrade && (
        <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-center animate-pulse-subtle">
          Position active! Drag SL/TP lines on chart to adjust active targets.
        </div>
      )}
    </div>
  );
});
