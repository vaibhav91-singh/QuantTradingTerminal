import React from 'react';
import { Settings, X, Palette, Grid, Sliders, Check } from 'lucide-react';

export function ChartSettingsModal({ 
  isOpen, 
  onClose, 
  bgColor, 
  onChangeBgColor,
  gridStyle,
  onChangeGridStyle,
  chartType,
  onChangeChartType
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden font-sans select-none animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5 font-mono">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              CHART PROPERTIES & STYLES
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-5 text-xs font-sans">
          
          {/* Chart Type Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-slate-300 font-bold font-mono flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" /> CHART SERIES TYPE
            </label>
            <div className="grid grid-cols-3 gap-2 font-mono">
              {[
                { id: 'candlestick', label: '🕯️ Candles' },
                { id: 'line', label: '📈 Line' },
                { id: 'area', label: '🌊 Area' },
                { id: 'bars', label: '📊 Bars' },
                { id: 'heikinAshi', label: '🎌 Heikin Ashi' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onChangeChartType(t.id)}
                  className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    chartType === t.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas Background Color */}
          <div className="flex flex-col gap-2">
            <label className="text-slate-300 font-bold font-mono flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-emerald-400" /> CANVAS BACKGROUND THEME
            </label>
            <div className="grid grid-cols-4 gap-2 font-mono">
              {[
                { id: '#090d16', label: 'Dark Navy', color: '#090d16' },
                { id: '#020617', label: 'Midnight', color: '#020617' },
                { id: '#0f172a', label: 'Slate Gray', color: '#0f172a' },
                { id: '#000000', label: 'Pure Black', color: '#000000' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onChangeBgColor(theme.color)}
                  className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    bgColor === theme.color
                      ? 'border-emerald-400 ring-2 ring-emerald-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                  style={{ backgroundColor: theme.color }}
                >
                  <span className="w-3 h-3 rounded-full border border-slate-600" style={{ backgroundColor: theme.color }} />
                  <span className="text-slate-300 text-[10px]">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid Lines Style */}
          <div className="flex flex-col gap-2">
            <label className="text-slate-300 font-bold font-mono flex items-center gap-1.5">
              <Grid className="w-4 h-4 text-amber-400" /> GRID LINES PATTERN
            </label>
            <div className="grid grid-cols-3 gap-2 font-mono">
              {[
                { id: 'dashed', label: 'Dashed Lines' },
                { id: 'solid', label: 'Solid Lines' },
                { id: 'none', label: 'No Grid' },
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => onChangeGridStyle(g.id)}
                  className={`p-2 rounded-xl border font-bold transition-all cursor-pointer ${
                    gridStyle === g.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-end font-mono">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-md"
          >
            Apply Settings
          </button>
        </div>

      </div>
    </div>
  );
}
