import React, { useState } from 'react';
import { Key, X, Check, ExternalLink, ShieldCheck } from 'lucide-react';

export function ApiKeyModal({ isOpen, onClose, apiKey, onSaveApiKey }) {
  const [keyInput, setKeyInput] = useState(apiKey || '');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveApiKey(keyInput.trim());
    onClose();
  };

  const handleClear = () => {
    setKeyInput('');
    onSaveApiKey('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="terminal-card w-full max-w-md rounded-2xl border border-slate-800 p-5 shadow-2xl relative">
        
        {/* Close Icon Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <Key className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">Twelve Data API Key</h3>
            <p className="text-xs text-slate-400">Configure key for live Gold (XAU/USD) candle data</p>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">API Key String</label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="e.g. 8a9b7c6d5e4f3a2b1c0d..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Saved locally in your browser storage.</span>
              <a
                href="https://twelvedata.com/"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-0.5 font-medium"
              >
                Get Free Key <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>If left empty or if Twelve Data API limits are reached, QuantTerminal will automatically generate realistic synthetic Gold OHLCV candles so backtesting never stops.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 mt-2 border-t border-slate-800 pt-3">
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all mr-auto"
              >
                Clear Key
              </button>
            )}
            
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Save Key</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
