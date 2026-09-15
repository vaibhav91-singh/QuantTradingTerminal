import React, { useState, useEffect, useRef } from 'react';
import { 
  Crosshair, 
  MousePointer, 
  TrendingUp, 
  Minus, 
  MoveVertical,
  Square,
  GitCommit, 
  PenTool, 
  Type, 
  Ruler, 
  Eraser,
  Magnet, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Trash2,
  Circle,
  ArrowUpRight,
  TrendingDown,
  ChevronRight,
  Star,
  Maximize2,
  Activity,
  Layers,
  Sparkles,
  Smile,
  Search,
  Check
} from 'lucide-react';

export function DrawingToolbar({
  activeTool,
  onSelectTool,
  isMagnetMode,
  onToggleMagnet,
  isLocked,
  onToggleLock,
  isHidden,
  onToggleHide,
  onClearDrawings,
  drawingsCount,
  selectedDrawingId,
  onDeleteSelectedDrawing
}) {
  const [openCategory, setOpenCategory] = useState(null);
  const [favorites, setFavorites] = useState(['trendline', 'horizline', 'brush', 'longpos', 'measure']);
  const popoverRef = useRef(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpenCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFavorite = (e, toolId) => {
    e.stopPropagation();
    setFavorites((prev) => 
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const handleSelectToolItem = (toolId) => {
    onSelectTool(activeTool === toolId ? null : toolId);
    setOpenCategory(null);
  };

  // Tool categories definitions (Matching Authentic TradingView layout)
  const categories = [
    {
      id: 'lines',
      name: 'Lines & Channels',
      icon: TrendingUp,
      activeIf: ['trendline', 'ray', 'infoline', 'extendedline', 'path', 'trendangle', 'horizline', 'horizray', 'vertline', 'crossline', 'channel'],
      groups: [
        {
          title: 'LINES',
          items: [
            { id: 'trendline', label: 'Trendline', hotkey: 'Alt + T', icon: TrendingUp },
            { id: 'path', label: 'Path / Polyline (Multi-point)', hotkey: 'Alt + P', icon: TrendingUp },
            { id: 'ray', label: 'Ray Line', hotkey: '', icon: TrendingUp },
            { id: 'infoline', label: 'Info line', hotkey: '', icon: TrendingUp },
            { id: 'extendedline', label: 'Extended line', hotkey: '', icon: TrendingUp },
            { id: 'horizline', label: 'Horizontal line', hotkey: 'Alt + H', icon: Minus },
            { id: 'horizray', label: 'Horizontal ray', hotkey: 'Alt + J', icon: Minus },
            { id: 'vertline', label: 'Vertical line', hotkey: 'Alt + V', icon: MoveVertical },
            { id: 'crossline', label: 'Crossline', hotkey: 'Alt + C', icon: Crosshair },
          ]
        },
        {
          title: 'CHANNELS',
          items: [
            { id: 'channel', label: 'Parallel Channel', hotkey: '', icon: Square },
            { id: 'regression', label: 'Regression Trend', hotkey: '', icon: TrendingUp },
          ]
        }
      ]
    },
    {
      id: 'fib',
      name: 'Gann & Fibonacci',
      icon: GitCommit,
      activeIf: ['fib', 'fibext', 'fibfan', 'gannbox'],
      groups: [
        {
          title: 'FIBONACCI',
          items: [
            { id: 'fib', label: 'Fib Retracement', hotkey: 'Alt + F', icon: GitCommit },
            { id: 'fibext', label: 'Trend-Based Fib Extension', hotkey: '', icon: GitCommit },
            { id: 'fibfan', label: 'Fib Speed Resistance Fan', hotkey: '', icon: GitCommit },
          ]
        },
        {
          title: 'GANN',
          items: [
            { id: 'gannbox', label: 'Gann Box', hotkey: '', icon: Square },
          ]
        }
      ]
    },
    {
      id: 'shapes',
      name: 'Geometric Shapes & Brush',
      icon: PenTool,
      activeIf: ['brush', 'rectangle', 'circle', 'path', 'triangle'],
      groups: [
        {
          title: 'DRAWING & SHAPES',
          items: [
            { id: 'brush', label: 'Freehand Brush', hotkey: 'Alt + B', icon: PenTool },
            { id: 'path', label: 'Path / Polyline Zigzag', hotkey: 'Alt + P', icon: TrendingUp },
            { id: 'rectangle', label: 'Rectangle Zone', hotkey: 'Alt + R', icon: Square },
            { id: 'circle', label: 'Circle / Ellipse', hotkey: '', icon: Circle },
            { id: 'triangle', label: 'Triangle Zone', hotkey: '', icon: Square },
          ]
        }
      ]
    },
    {
      id: 'text',
      name: 'Annotation & Text',
      icon: Type,
      activeIf: ['text', 'callout', 'pricenote'],
      groups: [
        {
          title: 'ANNOTATION',
          items: [
            { id: 'text', label: 'Text Note', hotkey: 'Alt + N', icon: Type },
            { id: 'callout', label: 'Callout Box', hotkey: '', icon: Type },
            { id: 'pricenote', label: 'Price Note Badge', hotkey: '', icon: Minus },
          ]
        }
      ]
    },
    {
      id: 'positions',
      name: 'Patterns & Position Calculators',
      icon: ArrowUpRight,
      activeIf: ['longpos', 'shortpos', 'forecast', 'rrbox'],
      groups: [
        {
          title: 'POSITIONS & RISK MANAGEMENT',
          items: [
            { id: 'longpos', label: 'Long Position Tool', hotkey: '', icon: ArrowUpRight, isLong: true },
            { id: 'shortpos', label: 'Short Position Tool', hotkey: '', icon: TrendingDown, isShort: true },
            { id: 'forecast', label: 'Forecast Projection', hotkey: '', icon: Activity },
          ]
        }
      ]
    },
    {
      id: 'measure',
      name: 'Prediction & Measurement',
      icon: Ruler,
      activeIf: ['measure', 'pricerange', 'daterange'],
      groups: [
        {
          title: 'MEASUREMENT',
          items: [
            { id: 'measure', label: 'Ruler / Measure Tool', hotkey: 'Alt + M', icon: Ruler },
            { id: 'pricerange', label: 'Price Range Delta', hotkey: '', icon: Ruler },
          ]
        }
      ]
    }
  ];

  return (
    <aside ref={popoverRef} className="w-12 bg-slate-950 border-r border-slate-800/90 flex flex-col items-center py-2 gap-1 z-30 shrink-0 select-none shadow-2xl relative font-sans">
      
      {/* 1. Cursor Selection Tool */}
      <div className="relative group">
        <button
          onClick={() => onSelectTool(activeTool === 'crosshair' ? null : 'crosshair')}
          className={`p-2 rounded-xl transition-all relative flex items-center justify-center cursor-pointer ${
            activeTool === 'crosshair' || !activeTool
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
          }`}
          title="Crosshair (Cursor)"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <span className="absolute left-14 top-1.5 bg-slate-900 text-slate-100 text-[11px] font-mono px-2.5 py-1 rounded-lg border border-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
          Crosshair Cursor Mode
        </span>
      </div>

      <div className="w-6 h-px bg-slate-800/80 my-0.5" />

      {/* 2. TradingView Category Expandable Toolbar Items */}
      {categories.map((cat) => {
        const IconComponent = cat.icon;
        const isActive = cat.activeIf.includes(activeTool);
        const isOpen = openCategory === cat.id;

        return (
          <div key={cat.id} className="relative">
            <div className="flex items-center group">
              <button
                onClick={() => handleSelectToolItem(cat.groups[0].items[0].id)}
                className={`p-2 rounded-l-xl transition-all flex items-center justify-center cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 border-l border-y border-cyan-500/40 shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
                title={cat.name}
              >
                <IconComponent className="w-4 h-4" />
              </button>

              {/* Little Arrow > to trigger Popover Menu */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenCategory(isOpen ? null : cat.id);
                }}
                className={`py-2 pr-1 rounded-r-xl transition-all flex items-center justify-center cursor-pointer text-[9px] ${
                  isOpen || isActive
                    ? 'bg-slate-800 text-cyan-400 border-r border-y border-cyan-500/40'
                    : 'text-slate-600 hover:text-slate-300 hover:bg-slate-900'
                }`}
                title="Expand Submenus"
              >
                <ChevronRight className={`w-2.5 h-2.5 transition-transform ${isOpen ? 'rotate-90 text-cyan-400' : ''}`} />
              </button>
            </div>

            {/* TradingView Authentic Popover Flyout Menu */}
            {isOpen && (
              <div className="absolute left-14 top-0 z-50 w-72 bg-slate-900/98 backdrop-blur-xl border border-slate-800 rounded-2xl p-2.5 shadow-2xl flex flex-col gap-3 font-sans animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 px-1">
                  <span className="text-[11px] font-bold text-slate-300 tracking-wider flex items-center gap-1.5 font-mono">
                    <IconComponent className="w-3.5 h-3.5 text-cyan-400" />
                    {cat.name.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">TradingView Suite</span>
                </div>

                <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                  {cat.groups.map((group, gIdx) => (
                    <div key={gIdx} className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 tracking-widest px-2 font-mono">
                        {group.title}
                      </span>
                      
                      <div className="flex flex-col gap-0.5">
                        {group.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isToolActive = activeTool === item.id;
                          const isFav = favorites.includes(item.id);

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelectToolItem(item.id)}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all text-xs font-mono group cursor-pointer ${
                                isToolActive
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                                  : 'text-slate-300 hover:bg-slate-800/90 hover:text-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <ItemIcon className={`w-4 h-4 ${
                                  item.isLong ? 'text-emerald-400' : item.isShort ? 'text-rose-400' : isToolActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                                }`} />
                                <span className="font-medium text-[12px]">{item.label}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {item.hotkey && (
                                  <span className="text-[10px] text-slate-500 group-hover:text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                    {item.hotkey}
                                  </span>
                                )}
                                <button
                                  onClick={(e) => toggleFavorite(e, item.id)}
                                  className="text-slate-600 hover:text-amber-400 p-0.5"
                                >
                                  <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-400 fill-amber-400' : ''}`} />
                                </button>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="w-6 h-px bg-slate-800/80 my-0.5" />

      {/* 3. Eraser Tool */}
      <div className="relative group">
        <button
          onClick={() => onSelectTool(activeTool === 'eraser' ? null : 'eraser')}
          className={`p-2 rounded-xl transition-all relative flex items-center justify-center cursor-pointer ${
            activeTool === 'eraser'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-md animate-pulse'
              : 'text-slate-400 hover:text-rose-300 hover:bg-slate-900'
          }`}
          title="Eraser Tool"
        >
          <Eraser className="w-4 h-4" />
        </button>
        <span className="absolute left-14 top-1.5 bg-slate-900 text-slate-100 text-[11px] font-mono px-2.5 py-1 rounded-lg border border-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
          Eraser (Click drawing to delete)
        </span>
      </div>

      {/* 4. Magnet Mode Toggle */}
      <div className="relative group">
        <button
          onClick={onToggleMagnet}
          className={`p-2 rounded-xl transition-all relative flex items-center justify-center cursor-pointer ${
            isMagnetMode
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-md'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
          }`}
          title="Magnet Mode"
        >
          <Magnet className="w-4 h-4" />
        </button>
        <span className="absolute left-14 top-1.5 bg-slate-900 text-slate-100 text-[11px] font-mono px-2.5 py-1 rounded-lg border border-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
          Magnet Mode ({isMagnetMode ? 'ON - Snap to Candle OHLC' : 'OFF'})
        </span>
      </div>

      {/* 5. Lock All Drawings Toggle */}
      <div className="relative group">
        <button
          onClick={onToggleLock}
          className={`p-2 rounded-xl transition-all relative flex items-center justify-center cursor-pointer ${
            isLocked
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-md'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
          }`}
          title="Lock All Drawings"
        >
          {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
        <span className="absolute left-14 top-1.5 bg-slate-900 text-slate-100 text-[11px] font-mono px-2.5 py-1 rounded-lg border border-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
          {isLocked ? 'Lock Drawings (ON)' : 'Unlock Drawings'}
        </span>
      </div>

      {/* 6. Hide / Show Drawings Toggle */}
      <div className="relative group">
        <button
          onClick={onToggleHide}
          className={`p-2 rounded-xl transition-all relative flex items-center justify-center cursor-pointer ${
            isHidden
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-md'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
          }`}
          title="Hide / Show Drawings"
        >
          {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <span className="absolute left-14 top-1.5 bg-slate-900 text-slate-100 text-[11px] font-mono px-2.5 py-1 rounded-lg border border-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
          {isHidden ? 'Show Drawings' : 'Hide Drawings'}
        </span>
      </div>

      <div className="w-6 h-px bg-slate-800/80 my-0.5" />

      {/* 7. Clear All Drawings */}
      <div className="relative group">
        <button
          onClick={onClearDrawings}
          disabled={drawingsCount === 0}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 transition-all relative flex items-center justify-center cursor-pointer"
          title="Clear All Drawings"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <span className="absolute left-14 top-1.5 bg-slate-900 text-slate-100 text-[11px] font-mono px-2.5 py-1 rounded-lg border border-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
          Clear All Drawings ({drawingsCount})
        </span>
      </div>

    </aside>
  );
}
