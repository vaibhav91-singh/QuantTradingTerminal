import React, { useState, useRef, useEffect } from 'react';
import { 
  Trash2, 
  Lock, 
  Unlock, 
  Sliders, 
  X, 
  Check, 
  Minus, 
  MoreHorizontal,
  ChevronDown,
  Palette
} from 'lucide-react';

export function DrawingContextToolbar({
  selectedDrawing,
  position,
  onUpdateDrawing,
  onDeleteDrawing,
  onClose
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showThicknessMenu, setShowThicknessMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  const containerRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowColorPicker(false);
        setShowThicknessMenu(false);
        setShowStyleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!selectedDrawing) return null;

  const colorPalette = [
    { label: 'Cyan', value: '#38bdf8' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Purple', value: '#a855f7' },
    { label: 'Pink', value: '#ec4899' },
    { label: 'White', value: '#ffffff' },
    { label: 'Slate', value: '#94a3b8' }
  ];

  const thicknessOptions = [1, 2, 3, 4];

  const styleOptions = [
    { label: 'Solid', value: 'none', iconLine: 'w-6 h-0.5 bg-current' },
    { label: 'Dashed', value: '6 4', iconLine: 'w-6 border-b-2 border-dashed border-current' },
    { label: 'Dotted', value: '2 2', iconLine: 'w-6 border-b-2 border-dotted border-current' }
  ];

  const currentColor = selectedDrawing.color || '#38bdf8';
  const currentWidth = selectedDrawing.lineWidth || 2;
  const currentDash = selectedDrawing.dash || 'none';
  const isLocked = !!selectedDrawing.isLocked;

  // Format label name for drawing type
  const formatTypeLabel = (type) => {
    switch (type) {
      case 'trendline': return 'Trendline';
      case 'horizline': return 'Horiz Line';
      case 'horizray': return 'Horiz Ray';
      case 'vertline': return 'Vert Line';
      case 'crossline': return 'Crossline';
      case 'ray': return 'Ray Line';
      case 'infoline': return 'Info Line';
      case 'extendedline': return 'Extended Line';
      case 'channel': return 'Parallel Channel';
      case 'rectangle': return 'Rectangle';
      case 'circle': return 'Circle';
      case 'triangle': return 'Triangle';
      case 'fib': return 'Fib Retracement';
      case 'fibext': return 'Fib Extension';
      case 'fibfan': return 'Fib Fan';
      case 'gannbox': return 'Gann Box';
      case 'longpos': return 'Long Position';
      case 'shortpos': return 'Short Position';
      case 'brush': return 'Brush';
      case 'path': return 'Path Polyline';
      case 'text': return 'Text Note';
      case 'callout': return 'Callout';
      case 'pricenote': return 'Price Note';
      case 'pricerange': return 'Price Range';
      default: return 'Drawing';
    }
  };

  // Compute safe clamped top/left coordinates
  const clampLeft = Math.max(60, Math.min(position?.x || 200, (window.innerWidth || 1200) - 340));
  const clampTop = Math.max(50, (position?.y || 100) - 48);

  return (
    <div
      ref={containerRef}
      style={{ left: `${clampLeft}px`, top: `${clampTop}px` }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-40 bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-xl px-2 py-1.5 shadow-2xl flex items-center gap-1.5 text-xs font-mono select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {/* 1. Drawing Type Label Tag */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 font-bold shrink-0">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentColor }} />
        <span>{formatTypeLabel(selectedDrawing.type)}</span>
      </div>

      <div className="h-4 w-px bg-slate-800 mx-0.5" />

      {/* 2. Color Palette Picker Button */}
      <div className="relative">
        <button
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowThicknessMenu(false);
            setShowStyleMenu(false);
          }}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center gap-1 transition-all cursor-pointer"
          title="Change Color"
        >
          <div className="w-4 h-4 rounded-full border border-slate-600 shadow-sm" style={{ backgroundColor: currentColor }} />
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* Color Popover Menu */}
        {showColorPicker && (
          <div className="absolute top-9 left-0 z-50 bg-slate-950 border border-slate-800 rounded-xl p-2 shadow-2xl flex flex-col gap-2 w-44 animate-in fade-in duration-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">
              Select Color
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {colorPalette.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    onUpdateDrawing({ color: c.value });
                    setShowColorPicker(false);
                  }}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    currentColor === c.value ? 'border-white scale-110 shadow-lg' : 'border-slate-800 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                >
                  {currentColor === c.value && <Check className="w-3 h-3 text-slate-950 font-extrabold stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Line Thickness Button */}
      <div className="relative">
        <button
          onClick={() => {
            setShowThicknessMenu(!showThicknessMenu);
            setShowColorPicker(false);
            setShowStyleMenu(false);
          }}
          className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 font-bold flex items-center gap-1 transition-all cursor-pointer text-[11px]"
          title="Line Thickness"
        >
          <div className="flex items-center gap-0.5">
            <div className="w-3 rounded-full bg-slate-300" style={{ height: `${currentWidth * 1.5}px` }} />
            <span>{currentWidth}px</span>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* Thickness Popover Menu */}
        {showThicknessMenu && (
          <div className="absolute top-9 left-0 z-50 bg-slate-950 border border-slate-800 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 w-28 animate-in fade-in duration-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1 mb-0.5">
              Thickness
            </span>
            {thicknessOptions.map((w) => (
              <button
                key={w}
                onClick={() => {
                  onUpdateDrawing({ lineWidth: w });
                  setShowThicknessMenu(false);
                }}
                className={`flex items-center justify-between px-2 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  currentWidth === w ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 rounded-full bg-current" style={{ height: `${w * 1.5}px` }} />
                  <span>{w}px</span>
                </div>
                {currentWidth === w && <Check className="w-3 h-3 text-cyan-400" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Line Style Button */}
      <div className="relative">
        <button
          onClick={() => {
            setShowStyleMenu(!showStyleMenu);
            setShowColorPicker(false);
            setShowThicknessMenu(false);
          }}
          className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 font-bold flex items-center gap-1 transition-all cursor-pointer text-[11px]"
          title="Line Style"
        >
          <span className="text-slate-300">
            {currentDash === 'none' ? 'Solid' : currentDash === '6 4' ? 'Dashed' : 'Dotted'}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* Style Popover Menu */}
        {showStyleMenu && (
          <div className="absolute top-9 left-0 z-50 bg-slate-950 border border-slate-800 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 w-32 animate-in fade-in duration-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1 mb-0.5">
              Line Style
            </span>
            {styleOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onUpdateDrawing({ dash: opt.value });
                  setShowStyleMenu(false);
                }}
                className={`flex items-center justify-between px-2 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  currentDash === opt.value ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <span className="text-[11px]">{opt.label}</span>
                {currentDash === opt.value && <Check className="w-3 h-3 text-cyan-400" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-slate-800 mx-0.5" />

      {/* 5. Lock / Unlock Toggle Button */}
      <button
        onClick={() => onUpdateDrawing({ isLocked: !isLocked })}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          isLocked ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`}
        title={isLocked ? 'Unlock Drawing' : 'Lock Drawing'}
      >
        {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
      </button>

      {/* 6. Delete (Trash Can) Button */}
      <button
        onClick={onDeleteDrawing}
        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
        title="Delete Drawing"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* 7. Close Toolbar Button */}
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all cursor-pointer ml-0.5"
        title="Deselect"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
