import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType, 
  CandlestickSeries, 
  HistogramSeries, 
  LineSeries,
  PriceScaleMode
} from 'lightweight-charts';
import { calculateSMA, calculateEMA, calculateSupportResistanceLevels } from '../utils/indicators';
import { detectLatestCandlePattern } from '../utils/candlestickPatterns';
import { computePatternProbability } from '../utils/patternRadarEngine';
import { computeSmcAnalysis } from '../utils/smcEngine';
import { detectChartPatterns } from '../utils/aiPatternDetector';
import { PatternRadarCard } from './PatternRadarCard';
import { SmcPatternLegendCard } from './SmcPatternLegendCard';
import { DrawingToolbar } from './DrawingToolbar';
import { DrawingContextToolbar } from './DrawingContextToolbar';
import { 
  MoveVertical, 
  Maximize2, 
  Minimize2, 
  Globe, 
  Clock, 
  Layers, 
  Ruler, 
  X, 
  Scissors,
  TrendingUp,
  TrendingDown,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Sparkles,
  Cpu,
  Trash2,
  Lock,
  Unlock,
  Square,
  PenTool,
  Type,
  Eraser,
  Minus
} from 'lucide-react';

export const TradingChart = React.memo(function TradingChart({
  candles,
  latestTickBar,
  activeTrade,
  activeIndicators,
  onCrosshairPriceChange,
  symbol,
  interval,
  pendingSl,
  pendingTp,
  isSlEnabled,
  isTpEnabled,
  onUpdateSl,
  onUpdateTp,
  candleCountdown,
  mlMarkers = [],
  isSelectingReplayCut = false,
  onSelectReplayCutIndex,
  isReplayMode = false,
  onToggleReplayMode,
  onToggleSelectReplayCut,
  isPlaying = false,
  onTogglePlay,
  onStepNext,
  onStepPrev,
  replayIndex = 0,
  totalCandles,
  playbackSpeed = 1,
  onChangePlaybackSpeed,
  onExecuteTrade,
  onClosePosition,
  mlData,
  onToggleIndicator,
  onLoadMoreHistory,
  isHistoryLoading = false
}) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const ema9SeriesRef = useRef(null);
  const ema15SeriesRef = useRef(null);
  const sma20SeriesRef = useRef(null);
  const sma50SeriesRef = useRef(null);
  
  const priceLinesRef = useRef([]);
  const srLinesRef = useRef([]);
  const customDrawingsRef = useRef([]);
  const previousSymbolRef = useRef(symbol);
  const previousIntervalRef = useRef(interval);
  const currentScaleMarginsRef = useRef({ top: 0.1, bottom: 0.25 });

  const onLoadMoreHistoryRef = useRef(onLoadMoreHistory);
  useEffect(() => {
    onLoadMoreHistoryRef.current = onLoadMoreHistory;
  }, [onLoadMoreHistory]);

  // Drawing Toolbar & State
  const [activeTool, setActiveTool] = useState(null);
  const [isMagnetMode, setIsMagnetMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [drawingsList, setDrawingsList] = useState([]);

  // 100% Client-Side Web Storage (localStorage) Persistence for Chart Drawings
  // Load drawings from browser memory when symbol changes or component mounts
  useEffect(() => {
    if (!symbol) return;
    try {
      const saved = localStorage.getItem(`quant_drawings_${symbol}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setDrawingsList(parsed);
          setSelectedDrawingId(null);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to load drawings from browser Web Memory (localStorage):', err.message);
    }
    setDrawingsList([]);
    setSelectedDrawingId(null);
  }, [symbol]);

  // Save drawings to browser Web Memory (localStorage) whenever drawingsList changes
  useEffect(() => {
    if (!symbol) return;
    try {
      localStorage.setItem(`quant_drawings_${symbol}`, JSON.stringify(drawingsList));
    } catch (err) {
      console.warn('Failed to save drawings to browser Web Memory (localStorage):', err.message);
    }
  }, [drawingsList, symbol]);

  // SMC & ICT AI Overlay State & Memoized Calculation
  const [showObs, setShowObs] = useState(() => localStorage.getItem('quant_show_obs') !== 'false');
  const [showFvgs, setShowFvgs] = useState(() => localStorage.getItem('quant_show_fvgs') !== 'false');
  const [showChoch, setShowChoch] = useState(() => localStorage.getItem('quant_show_choch') !== 'false');
  const [showPatterns, setShowPatterns] = useState(() => localStorage.getItem('quant_show_patterns') !== 'false');

  useEffect(() => {
    try {
      localStorage.setItem('quant_show_obs', showObs.toString());
      localStorage.setItem('quant_show_fvgs', showFvgs.toString());
      localStorage.setItem('quant_show_choch', showChoch.toString());
      localStorage.setItem('quant_show_patterns', showPatterns.toString());
    } catch (e) {}
  }, [showObs, showFvgs, showChoch, showPatterns]);

  const smcData = React.useMemo(() => {
    if (!activeIndicators?.smcIct || !candles || candles.length < 20) return null;
    return computeSmcAnalysis(candles);
  }, [candles, activeIndicators?.smcIct]);

  const aiDetectedPatterns = React.useMemo(() => {
    if (!activeIndicators?.aiPatterns || !candles || candles.length < 30) return [];
    return detectChartPatterns(candles);
  }, [candles, activeIndicators?.aiPatterns]);

  // Enhanced Drawing Tool Execution States
  const [drawingStartPoint, setDrawingStartPoint] = useState(null);
  const [drawingHoverPoint, setDrawingHoverPoint] = useState(null);
  const [isBrushActive, setIsBrushActive] = useState(false);
  const [activeBrushPoints, setActiveBrushPoints] = useState([]);
  const [activePathPoints, setActivePathPoints] = useState([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState(null);
  const [hoveredDrawingId, setHoveredDrawingId] = useState(null);
  const [textModal, setTextModal] = useState(null); // { x, y, point }
  const [textInputVal, setTextInputVal] = useState('');
  const [scaleTick, setScaleTick] = useState(0);
  const [drawingDragHandle, setDrawingDragHandle] = useState(null); // { id, handleType }

  const lastPathClickRef = useRef({ time: 0, x: 0, y: 0 });

  const handleFinishPath = (ptsToUse) => {
    const finalPts = Array.isArray(ptsToUse) ? ptsToUse : activePathPoints;
    if (finalPts && finalPts.length >= 2) {
      const newPath = {
        id: `draw_${Date.now()}`,
        type: 'path',
        points: finalPts,
        color: '#f97316',
        lineWidth: 2.5,
        dash: 'none'
      };
      setDrawingsList((prev) => [...prev, newPath]);
      setSelectedDrawingId(newPath.id);
    }
    setActivePathPoints([]);
    setActiveTool(null);
  };
  
  // Interactive Measure Tool State
  const [measureStart, setMeasureStart] = useState(null); // { time, price, x, y }
  const [measureHover, setMeasureHover] = useState(null); // { time, price, x, y }
  const [activeMeasureBox, setActiveMeasureBox] = useState(null); // Locked measurement box
  const [replayCutHover, setReplayCutHover] = useState(null); // Interactive TradingView Replay Cut line on hover ({ time, dateStr, x })

  const isSelectingReplayCutRef = useRef(isSelectingReplayCut);
  useEffect(() => {
    isSelectingReplayCutRef.current = isSelectingReplayCut;
    if (!isSelectingReplayCut) {
      setReplayCutHover(null);
    }
  }, [isSelectingReplayCut]);

  // Toolbar & Chart Preferences State
  const [isLogScale, setIsLogScale] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('ALL');
  const [isRadarDismissed, setIsRadarDismissed] = useState(false);

  // Dragging state for SL / TP lines
  const [dragTarget, setDragTarget] = useState(null);
  const [slCoordY, setSlCoordY] = useState(null);
  const [tpCoordY, setTpCoordY] = useState(null);
  const [hoveredLine, setHoveredLine] = useState(null);

  // Initialize chart on mount
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const getCalculatedDimensions = () => {
      if (!chartContainerRef.current) return { width: 800, height: 540 };
      const rect = chartContainerRef.current.getBoundingClientRect();
      const parentRect = chartContainerRef.current.parentElement?.getBoundingClientRect();

      const width = rect.width > 50 ? Math.floor(rect.width) : (chartContainerRef.current.clientWidth || 800);
      let height = rect.height > 100 ? Math.floor(rect.height) : 540;

      if (parentRect && parentRect.height > 200 && height < 300) {
        height = Math.floor(parentRect.height - 40);
      }

      return { width, height: Math.max(320, height) };
    };

    const { width: initialWidth, height: initialHeight } = getCalculatedDimensions();

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
        fontFamily: 'Inter, ui-monospace, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.4)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.4)' },
      },
      crosshair: {
        mode: 0,
      },
      handleScale: {
        axisPressedMouseMove: {
          time: true,
          price: true,
        },
        axisReset: true,
        mouseWheel: true,
        pinch: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      rightPriceScale: {
        visible: true,
        borderColor: '#1e293b',
        borderVisible: true,
        alignLabels: true,
        entireTextOnly: true,
        ticksVisible: true,
        minimumWidth: 80,
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
      },
      width: initialWidth,
      height: initialHeight,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderVisible: false,
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume_scale',
    });

    chart.priceScale('volume_scale').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    const ema9Series = chart.addSeries(LineSeries, {
      color: '#ec4899',
      lineWidth: 1.5,
      title: 'EMA 9',
      crosshairMarkerVisible: false,
    });

    const ema15Series = chart.addSeries(LineSeries, {
      color: '#06b6d4',
      lineWidth: 1.5,
      title: 'EMA 15',
      crosshairMarkerVisible: false,
    });

    const sma20Series = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 1.5,
      title: 'SMA 20',
      crosshairMarkerVisible: false,
    });

    const sma50Series = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 1.5,
      title: 'SMA 50',
      crosshairMarkerVisible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    ema9SeriesRef.current = ema9Series;
    ema15SeriesRef.current = ema15Series;
    sma20SeriesRef.current = sma20Series;
    sma50SeriesRef.current = sma50Series;

    let rafCrosshairId = null;
    chart.subscribeCrosshairMove((param) => {
      if (param.time && param.seriesData && candleSeriesRef.current) {
        const priceData = param.seriesData.get(candleSeriesRef.current);
        if (priceData && onCrosshairPriceChange) {
          if (rafCrosshairId) cancelAnimationFrame(rafCrosshairId);
          rafCrosshairId = requestAnimationFrame(() => {
            onCrosshairPriceChange(priceData);
          });
        }
      }

      if (isSelectingReplayCutRef.current && param.point && param.time) {
        const dateStr = typeof param.time === 'number' 
          ? new Date(param.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : String(param.time);
        setReplayCutHover({ time: param.time, dateStr, x: param.point.x });
      } else if (!isSelectingReplayCutRef.current) {
        setReplayCutHover(null);
      }
    });

    chart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange) => {
      setScaleTick((t) => t + 1);
      if (logicalRange && logicalRange.from < 15) {
        if (onLoadMoreHistoryRef.current) {
          onLoadMoreHistoryRef.current();
        }
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const { width, height } = getCalculatedDimensions();
        chartRef.current.applyOptions({ width, height });
        setScaleTick((t) => t + 1);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);
    if (chartContainerRef.current.parentElement) {
      resizeObserver.observe(chartContainerRef.current.parentElement);
    }
    window.addEventListener('resize', handleResize);

    setTimeout(handleResize, 100);

    // Mouse Wheel Scaling on Price Scale Bar (Rightmost area ~85px) or with Shift/Ctrl key
    const container = chartContainerRef.current;

    const handleWheelScale = (e) => {
      if (!container || !chartRef.current) return;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const isOverRightPriceScale = mouseX >= (rect.width - 85);

      if (isOverRightPriceScale || e.shiftKey || e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();

        const priceScale = chartRef.current.priceScale('right');
        if (!priceScale) return;

        let range = priceScale.getVisibleRange();

        if ((!range || range.from === null || range.to === null) && candleSeriesRef.current) {
          const pTop = candleSeriesRef.current.coordinateToPrice(0);
          const pBottom = candleSeriesRef.current.coordinateToPrice(rect.height);
          if (pTop !== null && pBottom !== null) {
            range = { from: Math.min(pTop, pBottom), to: Math.max(pTop, pBottom) };
          }
        }

        if (!range || range.from === null || range.to === null) return;

        const from = Number(range.from);
        const to = Number(range.to);
        const span = to - from;
        if (span <= 0 || isNaN(span)) return;

        const mouseY = e.clientY - rect.top;
        let anchorPrice = (from + to) / 2;
        if (candleSeriesRef.current) {
          const mousePrice = candleSeriesRef.current.coordinateToPrice(mouseY);
          if (mousePrice !== null && !isNaN(mousePrice)) {
            anchorPrice = mousePrice;
          }
        }

        // Balanced responsive speed control (~4.8% scale change per tick)
        const rawDelta = e.deltaY;
        const clampedDelta = Math.max(-100, Math.min(100, rawDelta));
        const zoomStep = 1 + (Math.abs(clampedDelta) / 100) * 0.048; // ~4.8% scale change per tick
        const zoomFactor = clampedDelta > 0 ? zoomStep : (1 / zoomStep);

        const distAbove = to - anchorPrice;
        const distBelow = anchorPrice - from;

        const newTo = anchorPrice + (distAbove * zoomFactor);
        const newFrom = anchorPrice - (distBelow * zoomFactor);

        const newSpan = newTo - newFrom;
        if (newSpan <= 0.0001 || isNaN(newSpan)) return;

        priceScale.applyOptions({ autoScale: false });
        priceScale.setVisibleRange({ from: newFrom, to: newTo });
        setScaleTick((t) => t + 1);
      }
    };

    const handleDblClickReset = (e) => {
      if (!container || !chartRef.current) return;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const isOverRightPriceScale = mouseX >= (rect.width - 85);

      if (isOverRightPriceScale) {
        e.preventDefault();
        e.stopPropagation();
        const priceScale = chartRef.current.priceScale('right');
        if (priceScale) {
          priceScale.applyOptions({ autoScale: true });
        }
        setScaleTick((t) => t + 1);
      }
    };

    if (container) {
      container.addEventListener('wheel', handleWheelScale, { capture: true, passive: false });
      container.addEventListener('dblclick', handleDblClickReset, { capture: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheelScale, { capture: true });
        container.removeEventListener('dblclick', handleDblClickReset, { capture: true });
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update full candle dataset
  useEffect(() => {
    if (!candleSeriesRef.current || !candles || candles.length === 0) return;

    candleSeriesRef.current.setData(candles);

    const volumeData = candles.map((c) => ({
      time: c.time,
      value: c.volume || 0,
      color: c.close >= c.open ? 'rgba(14, 203, 129, 0.4)' : 'rgba(246, 70, 93, 0.4)',
    }));
    volumeSeriesRef.current.setData(volumeData);

    if (activeIndicators?.ema9) {
      const ema9 = calculateEMA(candles, 9);
      ema9SeriesRef.current.setData(ema9);
    } else {
      ema9SeriesRef.current.setData([]);
    }

    if (activeIndicators?.ema15) {
      const ema15 = calculateEMA(candles, 15);
      ema15SeriesRef.current.setData(ema15);
    } else {
      ema15SeriesRef.current.setData([]);
    }

    if (activeIndicators?.sma20) {
      const sma20 = calculateSMA(candles, 20);
      sma20SeriesRef.current.setData(sma20);
    } else {
      sma20SeriesRef.current.setData([]);
    }

    if (activeIndicators?.sma50) {
      const sma50 = calculateSMA(candles, 50);
      sma50SeriesRef.current.setData(sma50);
    } else {
      sma50SeriesRef.current.setData([]);
    }

    if (chartRef.current && candles && candles.length > 0) {
      if (previousSymbolRef.current !== symbol || previousIntervalRef.current !== interval) {
        previousSymbolRef.current = symbol;
        previousIntervalRef.current = interval;
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [candles, symbol, interval, activeIndicators]);

  // Real-time Single Tick Update Effect
  useEffect(() => {
    if (!candleSeriesRef.current || !latestTickBar || !latestTickBar.time) return;

    try {
      if (candles && candles.length > 0) {
        const lastCandleTime = candles[candles.length - 1].time;
        if (latestTickBar.time < lastCandleTime) return;
      }

      candleSeriesRef.current.update(latestTickBar);

      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.update({
          time: latestTickBar.time,
          value: latestTickBar.volume || 0,
          color: latestTickBar.close >= latestTickBar.open ? 'rgba(14, 203, 129, 0.4)' : 'rgba(246, 70, 93, 0.4)',
        });
      }
    } catch (err) {
      console.warn('Real-time tick update skipped:', err.message);
    }
  }, [latestTickBar, candles]);

  // Handle Log scale toggle
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.priceScale('right').applyOptions({
        mode: isLogScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
      });
    }
  }, [isLogScale]);

  // Render Dynamic Auto Support & Resistance Lines
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    srLinesRef.current.forEach((line) => {
      try {
        candleSeriesRef.current.removePriceLine(line);
      } catch (e) {}
    });
    srLinesRef.current = [];

    if (!activeIndicators?.autoSr || !candles || candles.length < 20) return;

    const { supportLevels, resistanceLevels } = calculateSupportResistanceLevels(candles);

    supportLevels.forEach((lvl) => {
      const line = candleSeriesRef.current.createPriceLine({
        price: lvl.price,
        color: 'rgba(16, 185, 129, 0.75)',
        lineWidth: 1.5,
        lineStyle: 2,
        axisLabelVisible: false,
        title: `Support @ $${lvl.price.toFixed(2)} (${lvl.count}x)`,
      });
      srLinesRef.current.push(line);
    });

    resistanceLevels.forEach((lvl) => {
      const line = candleSeriesRef.current.createPriceLine({
        price: lvl.price,
        color: 'rgba(244, 63, 94, 0.75)',
        lineWidth: 1.5,
        lineStyle: 2,
        axisLabelVisible: false,
        title: `Resistance @ $${lvl.price.toFixed(2)} (${lvl.count}x)`,
      });
      srLinesRef.current.push(line);
    });
  }, [candles, activeIndicators?.autoSr]);

  // Render Machine Learning AI Signal Markers on Chart Candles
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    try {
      if (!activeIndicators?.aiMl || !mlMarkers || !Array.isArray(mlMarkers) || mlMarkers.length === 0) {
        candleSeriesRef.current.setMarkers([]);
        return;
      }

      const validMarkers = mlMarkers
        .filter((m) => m && m.time && (m.type === 'BUY' || m.type === 'SELL'))
        .sort((a, b) => a.time - b.time)
        .map((m) => ({
          time: m.time,
          position: m.type === 'BUY' ? 'belowBar' : 'aboveBar',
          color: m.type === 'BUY' ? '#10b981' : '#f43f5e',
          shape: m.type === 'BUY' ? 'arrowUp' : 'arrowDown',
          text: `🤖 ${m.type} (${m.confidence || 75}%)`,
        }));

      candleSeriesRef.current.setMarkers(validMarkers);
    } catch (err) {
      console.warn('Failed to set AI ML chart markers:', err.message);
    }
  }, [mlMarkers, activeIndicators?.aiMl]);

  // Subscribe to Chart Click for Bar Replay Candle Cut Selection
  useEffect(() => {
    if (!chartRef.current) return;

    const handleChartClick = (param) => {
      if (!isSelectingReplayCut || !param || !param.time || !candles || candles.length === 0) return;

      const clickedTime = param.time;
      let idx = candles.findIndex((c) => c.time === clickedTime);

      if (idx === -1) {
        let closestIdx = 0;
        let minDiff = Infinity;
        candles.forEach((c, index) => {
          const diff = Math.abs(c.time - clickedTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = index;
          }
        });
        idx = closestIdx;
      }

      if (onSelectReplayCutIndex) {
        onSelectReplayCutIndex(idx);
      }
    };

    chartRef.current.subscribeClick(handleChartClick);
    return () => {
      if (chartRef.current) {
        chartRef.current.unsubscribeClick(handleChartClick);
      }
    };
  }, [isSelectingReplayCut, candles, onSelectReplayCutIndex]);

  // Keyboard shortcut listener for deleting drawings, finishing path with Enter, cancelling with Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedDrawingId) {
          setDrawingsList((prev) => prev.filter((d) => d.id !== selectedDrawingId));
          setSelectedDrawingId(null);
        }
      } else if (e.key === 'Enter') {
        if (activePathPoints.length >= 1) {
          handleFinishPath();
        }
      } else if (e.key === 'Escape') {
        setActiveTool(null);
        setDrawingStartPoint(null);
        setDrawingHoverPoint(null);
        setActivePathPoints([]);
        setMeasureStart(null);
        setMeasureHover(null);
        setSelectedDrawingId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDrawingId, activePathPoints]);

  // Range Presets handler (1D, 5D, 1M, 3M, ALL)
  const handleSelectRange = (range) => {
    setSelectedRange(range);
    if (!chartRef.current || !candles || candles.length === 0) return;

    const timeScale = chartRef.current.timeScale();
    const lastTime = candles[candles.length - 1].time;

    let secondsBack = 0;
    switch (range) {
      case '1D': secondsBack = 86400; break;
      case '5D': secondsBack = 5 * 86400; break;
      case '1M': secondsBack = 30 * 86400; break;
      case '3M': secondsBack = 90 * 86400; break;
      case 'ALL': default: timeScale.fitContent(); return;
    }

    const fromTime = lastTime - secondsBack;
    timeScale.setVisibleRange({
      from: fromTime,
      to: lastTime,
    });
  };

  // Determine active SL and TP values
  const currentSl = activeTrade 
    ? activeTrade.stopLoss 
    : (isSlEnabled && pendingSl ? parseFloat(pendingSl) : null);

  const currentTp = activeTrade 
    ? activeTrade.takeProfit 
    : (isTpEnabled && pendingTp ? parseFloat(pendingTp) : null);

  // Render SL and TP price lines
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    priceLinesRef.current.forEach((line) => {
      try {
        candleSeriesRef.current.removePriceLine(line);
      } catch (e) {}
    });
    priceLinesRef.current = [];

    if (activeTrade) {
      const entryLine = candleSeriesRef.current.createPriceLine({
        price: activeTrade.entryPrice,
        color: '#eab308',
        lineWidth: 1.5,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `ENTRY [${activeTrade.side}] @ $${activeTrade.entryPrice.toLocaleString()}`,
      });
      priceLinesRef.current.push(entryLine);
    }

    if (currentSl && !isNaN(currentSl)) {
      const slLine = candleSeriesRef.current.createPriceLine({
        price: currentSl,
        color: '#ef4444',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `SL (Drag) @ $${Number(currentSl).toFixed(2)}`,
      });
      priceLinesRef.current.push(slLine);

      const y = candleSeriesRef.current.priceToCoordinate(currentSl);
      setSlCoordY(y);
    } else {
      setSlCoordY(null);
    }

    if (currentTp && !isNaN(currentTp)) {
      const tpLine = candleSeriesRef.current.createPriceLine({
        price: currentTp,
        color: '#22c55e',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `TP (Drag) @ $${Number(currentTp).toFixed(2)}`,
      });
      priceLinesRef.current.push(tpLine);

      const y = candleSeriesRef.current.priceToCoordinate(currentTp);
      setTpCoordY(y);
    } else {
      setTpCoordY(null);
    }
  }, [activeTrade, currentSl, currentTp]);

  // Coordinate Conversion & Magnet Snapping Helpers
  const getSnappedPoint = (mouseX, mouseY) => {
    if (!candleSeriesRef.current || !chartRef.current) return null;
    const price = candleSeriesRef.current.coordinateToPrice(mouseY);
    const time = chartRef.current.timeScale().coordinateToTime(mouseX);

    if (price === null || isNaN(price)) return null;

    if (!isMagnetMode || !time || !candles || candles.length === 0) {
      return { time, price: Number(price.toFixed(2)) };
    }

    let closestCandle = candles[0];
    let minDiff = Math.abs(candles[0].time - time);
    for (let i = 1; i < candles.length; i++) {
      const diff = Math.abs(candles[i].time - time);
      if (diff < minDiff) {
        minDiff = diff;
        closestCandle = candles[i];
      }
    }

    const ohlc = [closestCandle.open, closestCandle.high, closestCandle.low, closestCandle.close];
    let closestPrice = ohlc[0];
    let minPriceDiff = Math.abs(ohlc[0] - price);
    for (let i = 1; i < ohlc.length; i++) {
      const diff = Math.abs(ohlc[i] - price);
      if (diff < minPriceDiff) {
        minPriceDiff = diff;
        closestPrice = ohlc[i];
      }
    }

    return { time: closestCandle.time, price: Number(closestPrice.toFixed(2)) };
  };

  const getPointXY = (p) => {
    if (!p || !chartRef.current || !candleSeriesRef.current) return null;
    const timeScale = chartRef.current.timeScale();
    const x = p.time !== undefined && p.time !== null ? timeScale.timeToCoordinate(p.time) : null;
    const y = p.price !== undefined && p.price !== null ? candleSeriesRef.current.priceToCoordinate(p.price) : null;
    if (x === null || y === null || isNaN(x) || isNaN(y)) return null;
    return { x, y };
  };

  // Handle Canvas Click & Drag Operations for Drawing Tools & SL/TP Dragging
  const handleMouseDown = (e) => {
    if (!candleSeriesRef.current || !chartContainerRef.current || isLocked) return;

    const rect = chartContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const point = getSnappedPoint(mouseX, mouseY);
    if (!point || !point.price) return;

    // Check proximity for SL / TP line dragging
    if (slCoordY !== null && Math.abs(mouseY - slCoordY) <= 14) {
      setDragTarget('SL');
      e.preventDefault();
      return;
    } else if (tpCoordY !== null && Math.abs(mouseY - tpCoordY) <= 14) {
      setDragTarget('TP');
      e.preventDefault();
      return;
    }

    // Eraser Tool execution
    if (activeTool === 'eraser') {
      if (hoveredDrawingId) {
        setDrawingsList((prev) => prev.filter((d) => d.id !== hoveredDrawingId));
        if (selectedDrawingId === hoveredDrawingId) setSelectedDrawingId(null);
      }
      return;
    }

    // Brush Tool execution
    if (activeTool === 'brush') {
      setIsBrushActive(true);
      setActiveBrushPoints([point]);
      setSelectedDrawingId(null);
      return;
    }

    // Path / Polyline Tool execution (Multi-point zig-zag)
    if (activeTool === 'path') {
      const now = Date.now();
      const lastClick = lastPathClickRef.current;
      const isDouble = (e.detail === 2) || (now - lastClick.time < 350) || (Math.abs(mouseX - lastClick.x) < 14 && Math.abs(mouseY - lastClick.y) < 14);

      lastPathClickRef.current = { time: now, x: mouseX, y: mouseY };

      if (isDouble && activePathPoints.length >= 1) {
        const pointsToSave = activePathPoints.length >= 2 ? activePathPoints : [...activePathPoints, point];
        handleFinishPath(pointsToSave);
        return;
      }

      setActivePathPoints((prev) => [...prev, point]);
      return;
    }

    // Long / Short Position tools execution
    if (activeTool === 'longpos') {
      const entryP = point.price;
      const newDrawing = {
        id: `draw_${Date.now()}`,
        type: 'longpos',
        p1: point,
        targetPrice: Number((entryP * 1.03).toFixed(2)),
        stopPrice: Number((entryP * 0.985).toFixed(2)),
        color: '#10b981',
        lineWidth: 2
      };
      setDrawingsList((prev) => [...prev, newDrawing]);
      setSelectedDrawingId(newDrawing.id);
      setActiveTool(null);
      return;
    }

    if (activeTool === 'shortpos') {
      const entryP = point.price;
      const newDrawing = {
        id: `draw_${Date.now()}`,
        type: 'shortpos',
        p1: point,
        targetPrice: Number((entryP * 0.97).toFixed(2)),
        stopPrice: Number((entryP * 1.015).toFixed(2)),
        color: '#f43f5e',
        lineWidth: 2
      };
      setDrawingsList((prev) => [...prev, newDrawing]);
      setSelectedDrawingId(newDrawing.id);
      setActiveTool(null);
      return;
    }

    // Two-point drawing tools execution
    if (['trendline', 'ray', 'infoline', 'extendedline', 'rectangle', 'circle', 'triangle', 'fib', 'fibext', 'fibfan', 'gannbox', 'channel', 'regression', 'pricerange', 'forecast'].includes(activeTool)) {
      if (!drawingStartPoint) {
        setDrawingStartPoint(point);
        setDrawingHoverPoint(point);
      } else {
        const newDrawing = {
          id: `draw_${Date.now()}`,
          type: activeTool,
          p1: drawingStartPoint,
          p2: point,
          color: '#38bdf8',
          lineWidth: 2,
          dash: 'none'
        };
        setDrawingsList((prev) => [...prev, newDrawing]);
        setSelectedDrawingId(newDrawing.id);
        setDrawingStartPoint(null);
        setDrawingHoverPoint(null);
        setActiveTool(null);
      }
      return;
    }

    // Single-click line & marker execution
    if (['horizline', 'horizray', 'vertline', 'crossline', 'pricenote'].includes(activeTool)) {
      const newDrawing = {
        id: `draw_${Date.now()}`,
        type: activeTool,
        p1: point,
        price: point.price,
        color: '#38bdf8',
        lineWidth: 2,
        dash: 'none'
      };
      setDrawingsList((prev) => [...prev, newDrawing]);
      setSelectedDrawingId(newDrawing.id);
      setActiveTool(null);
      return;
    }

    // Text & Callout Tool execution
    if (['text', 'callout'].includes(activeTool)) {
      setTextModal({ x: mouseX, y: mouseY, point, type: activeTool });
      setTextInputVal('');
      return;
    }

    // Measure Tool execution (Auto-clears on next chart click like TradingView transient ruler)
    const isMeasureMode = activeTool === 'measure' || e.shiftKey;

    if (isMeasureMode) {
      if (activeMeasureBox && !measureStart) {
        setActiveMeasureBox(null);
      }

      if (!measureStart) {
        setMeasureStart({ x: mouseX, y: mouseY, price: point.price, time: point.time });
        setMeasureHover({ x: mouseX, y: mouseY, price: point.price, time: point.time });
        if (e.shiftKey && !activeTool) setActiveTool('measure');
      } else {
        setActiveMeasureBox({
          p1: measureStart,
          p2: { x: mouseX, y: mouseY, price: point.price, time: point.time }
        });
        setMeasureStart(null);
        setMeasureHover(null);
        setActiveTool(null);
      }
      return;
    }

    // Clear active measure box on any regular click anywhere on chart
    if (activeMeasureBox) {
      setActiveMeasureBox(null);
    }

    // Select mode
    if (hoveredDrawingId) {
      setSelectedDrawingId(hoveredDrawingId);
    } else {
      setSelectedDrawingId(null);
    }
  };

  const handleMouseMove = (e) => {
    if (!chartContainerRef.current || !candleSeriesRef.current) return;

    const rect = chartContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const point = getSnappedPoint(mouseX, mouseY);

    if (isBrushActive && point) {
      setActiveBrushPoints((prev) => [...prev, point]);
      return;
    }

    if (drawingStartPoint && point) {
      setDrawingHoverPoint(point);
    }

    if (activeTool === 'measure' && measureStart && point) {
      setMeasureHover({ x: mouseX, y: mouseY, price: point.price, time: point.time });
    }

    if (drawingDragHandle && point) {
      setDrawingsList((prev) => prev.map((d) => {
        if (d.id !== drawingDragHandle.id) return d;
        if (drawingDragHandle.handleType === 'target') {
          return { ...d, targetPrice: point.price };
        }
        if (drawingDragHandle.handleType === 'stop') {
          return { ...d, stopPrice: point.price };
        }
        if (drawingDragHandle.handleType === 'entry') {
          const diffTarget = d.targetPrice - d.p1.price;
          const diffStop = d.stopPrice - d.p1.price;
          return {
            ...d,
            p1: { ...d.p1, price: point.price },
            targetPrice: Number((point.price + diffTarget).toFixed(2)),
            stopPrice: Number((point.price + diffStop).toFixed(2))
          };
        }
        if (drawingDragHandle.handleType === 'width') {
          const c1 = getPointXY(d.p1);
          const startX = c1 ? c1.x : 10;
          const newW = Math.max(60, mouseX - startX);
          return { ...d, width: newW };
        }
        return d;
      }));
      return;
    }

    if (!dragTarget) {
      if (slCoordY !== null && Math.abs(mouseY - slCoordY) <= 14) {
        setHoveredLine('SL');
      } else if (tpCoordY !== null && Math.abs(mouseY - tpCoordY) <= 14) {
        setHoveredLine('TP');
      } else {
        setHoveredLine(null);
      }
      return;
    }

    if (point && point.price > 0) {
      if (dragTarget === 'SL' && onUpdateSl) onUpdateSl(point.price);
      else if (dragTarget === 'TP' && onUpdateTp) onUpdateTp(point.price);
    }
  };

  const handleMouseUp = () => {
    if (drawingDragHandle) {
      setDrawingDragHandle(null);
    }
    if (isBrushActive) {
      setIsBrushActive(false);
      if (activeBrushPoints.length > 1) {
        const newBrush = {
          id: `draw_${Date.now()}`,
          type: 'brush',
          points: activeBrushPoints,
          color: '#38bdf8',
          lineWidth: 2,
          dash: 'none'
        };
        setDrawingsList((prev) => [...prev, newBrush]);
        setSelectedDrawingId(newBrush.id);
      }
      setActiveBrushPoints([]);
      setActiveTool(null);
    }
    setDragTarget(null);
  };

  const handleAddTextDrawing = () => {
    if (!textModal || !textInputVal.trim()) return;
    const newText = {
      id: `draw_${Date.now()}`,
      type: textModal.type || 'text',
      p1: textModal.point,
      text: textInputVal.trim(),
      color: '#38bdf8',
      lineWidth: 2,
      dash: 'none'
    };
    setDrawingsList((prev) => [...prev, newText]);
    setSelectedDrawingId(newText.id);
    setTextModal(null);
    setTextInputVal('');
    setActiveTool(null);
  };

  const chartCardRef = useRef(null);

  const toggleFullscreen = () => {
    const targetEl = chartCardRef.current || chartContainerRef.current?.parentElement;
    if (!targetEl) return;

    if (!document.fullscreenElement) {
      if (targetEl.requestFullscreen) {
        targetEl.requestFullscreen().then(() => setIsFullscreen(true)).catch((err) => {
          console.warn('Native fullscreen request blocked, using CSS fallback:', err.message);
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);

      if (chartContainerRef.current && chartRef.current) {
        setTimeout(() => {
          if (chartContainerRef.current && chartRef.current) {
            chartRef.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
              height: chartContainerRef.current.clientHeight || (isFs ? window.innerHeight - 45 : 520),
            });
            setScaleTick((t) => t + 1);
          }
        }, 80);
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard shortcut listener: Pressing 'F' toggles Fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }
      if (e.key === 'Escape') {
        setActiveMeasureBox(null);
        setMeasureStart(null);
        setMeasureHover(null);
        setActiveTool(null);
        setSelectedDrawingId(null);
      }
      if (e.key === 'f' || e.key === 'F') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          toggleFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Smoothly scroll chart timeScale ONLY during auto-play (isPlaying === true)
  useEffect(() => {
    if (isReplayMode && isPlaying && chartRef.current) {
      try {
        chartRef.current.timeScale().scrollToRealTime();
      } catch (e) {}
    }
  }, [replayIndex, isReplayMode, isPlaying]);

  const currentMeasureTarget = activeMeasureBox 
    ? activeMeasureBox 
    : (measureStart && measureHover ? { p1: measureStart, p2: measureHover } : null);

  let measureBoxStyle = null;
  let measureMetrics = null;

  if (currentMeasureTarget) {
    const { p1, p2 } = currentMeasureTarget;
    const left = Math.min(p1.x, p2.x);
    const top = Math.min(p1.y, p2.y);
    const width = Math.max(10, Math.abs(p2.x - p1.x));
    const height = Math.max(10, Math.abs(p2.y - p1.y));
    
    const priceDiff = p2.price - p1.price;
    const pctDiff = (priceDiff / p1.price) * 100;
    const isPositive = priceDiff >= 0;

    measureBoxStyle = {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };

    measureMetrics = {
      priceDiff,
      pctDiff,
      isPositive,
      p1Price: p1.price,
      p2Price: p2.price
    };
  }

  const [quickSizeUsd, setQuickSizeUsd] = useState(1000);
  const [lotSize, setLotSize] = useState(0.1);
  const lastCandle = candles && candles.length > 0 ? candles[candles.length - 1] : null;
  const currentPrice = latestTickBar ? latestTickBar.close : (lastCandle ? lastCandle.close : 0);

  const sellPrice = currentPrice ? (currentPrice * 0.99995).toFixed(1) : '0.0';
  const buyPrice = currentPrice ? (currentPrice * 1.00005).toFixed(1) : '0.0';

  const activePnl = activeTrade && currentPrice 
    ? (activeTrade.side === 'BUY' 
        ? (currentPrice - activeTrade.entryPrice) * activeTrade.quantity 
        : (activeTrade.entryPrice - currentPrice) * activeTrade.quantity)
    : 0;

  const latestPattern = activeIndicators?.candlePattern && candles && candles.length >= 3
    ? detectLatestCandlePattern(candles)
    : null;

  const patternRadarData = latestPattern ? computePatternProbability(candles, latestPattern.name) : null;
  const selectedDrawing = drawingsList.find((d) => d.id === selectedDrawingId);

  return (
    <div 
      ref={chartCardRef}
      className={`flex w-full ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen rounded-none'
          : 'h-[560px] md:h-[620px] lg:h-[680px] rounded-xl'
      } bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl relative`}
    >
      
      {/* TradingView Authentic Left Vertical Drawing Sidebar */}
      <DrawingToolbar
        activeTool={activeTool}
        onSelectTool={(tool) => {
          setActiveTool(tool);
          setDrawingStartPoint(null);
          setDrawingHoverPoint(null);
          setMeasureStart(null);
          setMeasureHover(null);
        }}
        isMagnetMode={isMagnetMode}
        onToggleMagnet={() => setIsMagnetMode(!isMagnetMode)}
        isLocked={isLocked}
        onToggleLock={() => setIsLocked(!isLocked)}
        isHidden={isHidden}
        onToggleHide={() => setIsHidden(!isHidden)}
        onClearDrawings={() => {
          setDrawingsList([]);
          setSelectedDrawingId(null);
          setActiveMeasureBox(null);
          setMeasureStart(null);
          setMeasureHover(null);
        }}
        drawingsCount={drawingsList.length + (activeMeasureBox ? 1 : 0)}
        selectedDrawingId={selectedDrawingId}
        onDeleteSelectedDrawing={() => {
          if (selectedDrawingId) {
            setDrawingsList((prev) => prev.filter((d) => d.id !== selectedDrawingId));
            setSelectedDrawingId(null);
          }
        }}
      />

      {/* Main Chart Canvas Area */}
      <div
        className={`relative flex-1 flex flex-col select-none ${
          dragTarget ? 'cursor-ns-resize' : activeTool === 'eraser' ? 'cursor-crosshair' : activeTool ? 'cursor-crosshair' : hoveredLine ? 'cursor-grab' : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={(e) => {
          if (activeTool === 'path' && activePathPoints.length >= 1) {
            e.stopPropagation();
            handleFinishPath();
          }
        }}
      >
        {/* Conditionally Render Top Control Bar */}
        {isFullscreen ? (
          <div className="absolute top-2 left-3 right-3 z-30 flex items-center justify-between gap-2 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/90 shadow-2xl text-xs font-mono select-none flex-wrap">
            
            {/* Left: Ticker Symbol, Countdown & AI Signal Toggle */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {symbol} <span className="text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">{interval}</span>
              </span>

              {candleCountdown && (
                <span className="hidden sm:flex items-center gap-1 text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 text-[11px]">
                  <Clock className="w-3 h-3 text-amber-400" /> {candleCountdown}
                </span>
              )}

              {onToggleIndicator && (
                <button
                  onClick={() => onToggleIndicator('aiMl')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                    activeIndicators?.aiMl
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                  title="Toggle AI ML Predictions"
                >
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  <span>AI ML</span>
                  {mlData?.signal && (
                    <span className={`px-1 rounded text-[10px] ${
                      mlData.signal.includes('BUY') ? 'bg-emerald-500/30 text-emerald-300' : mlData.signal.includes('SELL') ? 'bg-rose-500/30 text-rose-300' : 'bg-amber-500/30 text-amber-300'
                    }`}>
                      {mlData.signal} ({mlData.confidence}%)
                    </span>
                  )}
                </button>
              )}

              {latestPattern && (
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1 shadow-sm font-mono ${latestPattern.bgColor} ${latestPattern.color} ${latestPattern.borderColor}`}>
                  <span>{latestPattern.icon}</span>
                  <span>{latestPattern.name}</span>
                </span>
              )}

              {isSelectingReplayCut && (
                <span className="text-[11px] font-mono text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-500/50 animate-pulse flex items-center gap-1 font-bold shadow">
                  <Scissors className="w-3 h-3 text-amber-400" />
                  ✂️ CLICK CANDLE TO START REPLAY
                </span>
              )}
            </div>

            {/* Middle: Bar Replay Compact Controls */}
            {isReplayMode && (
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={onToggleSelectReplayCut}
                  className={`px-2 py-0.5 rounded font-bold border transition-all ${
                    isSelectingReplayCut
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow animate-pulse'
                      : 'bg-slate-900 text-amber-400 border-slate-800 hover:bg-slate-800'
                  }`}
                  title="Click any candle on chart to set Replay start point"
                >
                  ✂️ Cut
                </button>

                <button
                  onClick={onStepPrev}
                  disabled={replayIndex <= 0}
                  className="p-1 text-slate-300 hover:text-cyan-400 disabled:opacity-30"
                  title="Step 1 Candle Back"
                >
                  <SkipBack className="w-3 h-3" />
                </button>

                <button
                  onClick={onTogglePlay}
                  className={`p-1 rounded font-bold ${isPlaying ? 'bg-amber-500 text-slate-950' : 'bg-cyan-500 text-slate-950'}`}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={onStepNext}
                  disabled={totalCandles ? replayIndex >= totalCandles - 1 : false}
                  className="p-1 text-slate-300 hover:text-cyan-400 disabled:opacity-30 cursor-pointer"
                  title="Step 1 Candle Forward (Hotkey ArrowRight or Spacebar)"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>

                <span className="text-[10px] text-cyan-400 font-mono px-1">
                  {replayIndex + 1}/{totalCandles || candles?.length || 0}
                </span>

                {onChangePlaybackSpeed && (
                  <div className="flex items-center gap-0.5 ml-1 pl-1.5 border-l border-slate-800 text-[10px]">
                    <span className="text-slate-500 mr-0.5 hidden xl:inline">Speed:</span>
                    {[0.5, 1, 2, 5, 10].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => onChangePlaybackSpeed(spd)}
                        className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                          playbackSpeed === spd
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title={`Set Replay Speed to ${spd}x`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Right: Compact TradingView Quick Execution Panel & Fullscreen Exit */}
            <div className="flex items-center gap-1.5">
              {/* SELL Box (Red) */}
              <button
                onClick={() => {
                  if (onExecuteTrade && currentPrice) {
                    onExecuteTrade({
                      side: 'SELL',
                      symbol,
                      entryPrice: currentPrice,
                      sizeUsd: Number((lotSize * currentPrice).toFixed(2)),
                      leverage: 10,
                      quantity: lotSize,
                      stopLoss: isSlEnabled && pendingSl ? parseFloat(pendingSl) : null,
                      takeProfit: isTpEnabled && pendingTp ? parseFloat(pendingTp) : null,
                    });
                  }
                }}
                disabled={!currentPrice}
                className="flex flex-col items-center justify-center px-2 py-0.5 rounded-md border border-rose-500/80 hover:border-rose-400 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 font-bold transition-all active:scale-95 disabled:opacity-40 cursor-pointer min-w-[62px]"
                title="Execute Market Sell (Short)"
              >
                <span className="text-[10px] text-rose-300 font-extrabold tracking-tight">
                  {Number(sellPrice).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[8px] font-black text-rose-500 tracking-wider">SELL</span>
              </button>

              {/* Lot Size Input */}
              <div className="flex flex-col items-center justify-center">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={lotSize}
                  onChange={(e) => setLotSize(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                  className="w-10 bg-slate-950 border border-slate-800 rounded px-1 py-0 text-center text-slate-100 font-bold text-[10px] focus:outline-none focus:border-cyan-500 font-mono"
                  title="Lot Size / Position Quantity"
                />
                <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider">LOT</span>
              </div>

              {/* BUY Box (Blue) */}
              <button
                onClick={() => {
                  if (onExecuteTrade && currentPrice) {
                    onExecuteTrade({
                      side: 'BUY',
                      symbol,
                      entryPrice: currentPrice,
                      sizeUsd: Number((lotSize * currentPrice).toFixed(2)),
                      leverage: 10,
                      quantity: lotSize,
                      stopLoss: isSlEnabled && pendingSl ? parseFloat(pendingSl) : null,
                      takeProfit: isTpEnabled && pendingTp ? parseFloat(pendingTp) : null,
                    });
                  }
                }}
                disabled={!currentPrice}
                className="flex flex-col items-center justify-center px-2 py-0.5 rounded-md border border-blue-500/80 hover:border-blue-400 bg-blue-950/40 hover:bg-blue-900/60 text-blue-400 font-bold transition-all active:scale-95 disabled:opacity-40 cursor-pointer min-w-[62px]"
                title="Execute Market Buy (Long)"
              >
                <span className="text-[10px] text-blue-300 font-extrabold tracking-tight">
                  {Number(buyPrice).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[8px] font-black text-blue-400 tracking-wider">BUY</span>
              </button>

              <div className="w-px h-4 bg-slate-800 mx-0.5" />

              {/* CLOSE ALL POSITIONS Button */}
              <button
                onClick={() => {
                  if (onClosePosition) {
                    onClosePosition();
                  }
                }}
                disabled={!activeTrade}
                className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer ${
                  activeTrade
                    ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 border-rose-400 shadow-rose-500/20 animate-pulse font-black'
                    : 'bg-slate-900 text-slate-600 border-slate-800 disabled:opacity-40 cursor-not-allowed'
                }`}
                title={activeTrade ? 'Close Active Position' : 'No Open Position'}
              >
                <X className="w-3 h-3" />
                <span>CLOSE ALL POS {activeTrade ? `(${activePnl >= 0 ? '+' : ''}$${activePnl.toFixed(2)})` : ''}</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-1 text-slate-400 hover:text-slate-100 bg-slate-950 border border-slate-800 rounded hover:bg-slate-800 transition-all ml-0.5 cursor-pointer"
                title="Exit Fullscreen Mode"
              >
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>

          </div>
        ) : (
          <div className="absolute top-3 left-4 right-4 z-20 flex flex-col gap-1.5 pointer-events-none text-xs select-none">
            
            {/* Top Row: Symbol Badge & Fullscreen Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 pointer-events-auto shadow-lg">
                <span className="font-bold text-slate-100 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {symbol} <span className="text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">{interval}</span>
                </span>
                {candleCountdown && (
                  <span className="flex items-center gap-1 font-mono text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                    <Clock className="w-3 h-3 text-amber-400" /> {candleCountdown}
                  </span>
                )}
                {latestPattern && (
                  <span className={`flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded text-[11px] border shadow ${latestPattern.bgColor} ${latestPattern.color} ${latestPattern.borderColor}`}>
                    <span>{latestPattern.icon}</span>
                    <span>{latestPattern.name}</span>
                  </span>
                )}
                {isSelectingReplayCut && (
                  <span className="text-[11px] font-mono text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-500/50 animate-pulse flex items-center gap-1.5 font-bold shadow-lg">
                    <Scissors className="w-3.5 h-3.5 text-amber-400" />
                    ✂️ CLICK ANY CANDLE ON CHART TO SET START REPLAY POINT
                  </span>
                )}
                {activeTool && !isSelectingReplayCut && (
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 animate-pulse flex items-center gap-1">
                    <Ruler className="w-3 h-3 text-cyan-400" />
                    {activeTool === 'eraser' ? 'ERASER: Click any drawing to delete' : activeTool === 'brush' ? 'BRUSH: Click & drag to draw freehand' : activeTool === 'measure' ? (measureStart ? 'Click Point 2 to Lock Measure Box' : 'Click Point 1 on Chart') : `Tool: ${activeTool.toUpperCase()} (Click on chart)`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100 px-3 py-1.5 rounded-xl border border-slate-800 backdrop-blur-md shadow-lg font-mono font-bold text-xs cursor-pointer transition-all active:scale-95"
                  title="Enter Fullscreen Mode ⛶"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Full Screen</span>
                </button>
              </div>
            </div>

            {/* Second Row: Authentic Compact TradingView Top-Left Trading Widget */}
            <div className="flex items-center gap-1 bg-slate-950/95 backdrop-blur-md px-1.5 py-1 rounded-lg border border-slate-800/90 shadow-xl font-mono self-start pointer-events-auto">
              {/* SELL Box (Red) */}
              <button
                onClick={() => {
                  if (onExecuteTrade && currentPrice) {
                    onExecuteTrade({
                      side: 'SELL',
                      symbol,
                      entryPrice: currentPrice,
                      sizeUsd: Number((lotSize * currentPrice).toFixed(2)),
                      leverage: 10,
                      quantity: lotSize,
                      stopLoss: isSlEnabled && pendingSl ? parseFloat(pendingSl) : null,
                      takeProfit: isTpEnabled && pendingTp ? parseFloat(pendingTp) : null,
                    });
                  }
                }}
                disabled={!currentPrice}
                className="flex flex-col items-center justify-center px-2 py-0.5 rounded-md border border-rose-500/80 hover:border-rose-400 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 font-bold transition-all active:scale-95 disabled:opacity-40 cursor-pointer min-w-[64px]"
                title="Execute Market Sell (Short)"
              >
                <span className="text-[10px] text-rose-300 font-extrabold tracking-tight">
                  {Number(sellPrice).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[8px] font-black text-rose-500 tracking-wider">SELL</span>
              </button>

              {/* Lot Size Input */}
              <div className="flex flex-col items-center justify-center px-0.5">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={lotSize}
                  onChange={(e) => setLotSize(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                  className="w-10 bg-slate-900 border border-slate-700/80 rounded px-0.5 py-0 text-center text-slate-100 font-bold text-[10px] focus:outline-none focus:border-cyan-500 font-mono shadow-inner"
                  title="Lot Size / Position Quantity"
                />
                <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">LOT</span>
              </div>

              {/* BUY Box (Blue) */}
              <button
                onClick={() => {
                  if (onExecuteTrade && currentPrice) {
                    onExecuteTrade({
                      side: 'BUY',
                      symbol,
                      entryPrice: currentPrice,
                      sizeUsd: Number((lotSize * currentPrice).toFixed(2)),
                      leverage: 10,
                      quantity: lotSize,
                      stopLoss: isSlEnabled && pendingSl ? parseFloat(pendingSl) : null,
                      takeProfit: isTpEnabled && pendingTp ? parseFloat(pendingTp) : null,
                    });
                  }
                }}
                disabled={!currentPrice}
                className="flex flex-col items-center justify-center px-2 py-0.5 rounded-md border border-blue-500/80 hover:border-blue-400 bg-blue-950/40 hover:bg-blue-900/60 text-blue-400 font-bold transition-all active:scale-95 disabled:opacity-40 cursor-pointer min-w-[64px]"
                title="Execute Market Buy (Long)"
              >
                <span className="text-[10px] text-blue-300 font-extrabold tracking-tight">
                  {Number(buyPrice).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[8px] font-black text-blue-400 tracking-wider">BUY</span>
              </button>

              <div className="w-px h-5 bg-slate-800 mx-0.5" />

              {/* CLOSE ALL POSITIONS Button */}
              <button
                onClick={() => {
                  if (onClosePosition) {
                    onClosePosition();
                  }
                }}
                disabled={!activeTrade}
                className={`px-2 py-1 rounded-md border text-[10px] font-mono font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer ${
                  activeTrade
                    ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 border-rose-400 shadow-rose-500/20 animate-pulse font-black'
                    : 'bg-slate-900 text-slate-600 border-slate-800 disabled:opacity-40 cursor-not-allowed'
                }`}
                title={activeTrade ? 'Close Active Trade Position' : 'No Open Position to Close'}
              >
                <X className="w-3 h-3" />
                <span>CLOSE ALL POS {activeTrade ? `(${activePnl >= 0 ? '+' : ''}$${activePnl.toFixed(2)})` : ''}</span>
              </button>
            </div>

          </div>
        )}



        {/* Floating Active Path Tool Control Banner */}
        {activeTool === 'path' && activePathPoints.length > 0 && (
          <div 
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-amber-500/50 text-amber-300 text-xs font-mono px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 backdrop-blur-md"
          >
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              📍 PATH TOOL ACTIVE ({activePathPoints.length} points)
            </span>
            <span className="text-slate-400 text-[11px]">Click to add segment</span>
            <button
              onClick={handleFinishPath}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-xl text-xs shadow-lg cursor-pointer transition-all flex items-center gap-1"
            >
              Done (Double-Click / Enter) ✓
            </button>
          </div>
        )}

        {/* Pattern Probability Radar Overlay Card */}
        {activeIndicators?.candlePattern && patternRadarData && !isRadarDismissed && (
          <div className="absolute top-26 left-3 z-20 pointer-events-auto shadow-2xl">
            <PatternRadarCard 
              patternData={patternRadarData} 
              onClose={() => setIsRadarDismissed(true)} 
            />
          </div>
        )}

        {/* Floating Quick Customization Context Toolbar for Selected Drawing */}
        {selectedDrawing && (() => {
          const c1 = getPointXY(selectedDrawing.p1);
          const c2 = getPointXY(selectedDrawing.p2);
          const anchorPt = c1 || c2 || { x: 200, y: 100 };
          return (
            <DrawingContextToolbar
              selectedDrawing={selectedDrawing}
              position={anchorPt}
              onUpdateDrawing={(updates) => {
                setDrawingsList((prev) => prev.map((d) => (d.id === selectedDrawingId ? { ...d, ...updates } : d)));
              }}
              onDeleteDrawing={() => {
                setDrawingsList((prev) => prev.filter((d) => d.id !== selectedDrawingId));
                setSelectedDrawingId(null);
              }}
              onClose={() => setSelectedDrawingId(null)}
            />
          );
        })()}

        {/* Replay Scissors Cut Line Overlay */}
        {isSelectingReplayCut && replayCutHover && (
          <div 
            style={{ left: `${replayCutHover.x}px` }} 
            className="absolute top-0 bottom-0 border-r-2 border-dashed border-amber-400 pointer-events-none z-30 flex flex-col justify-between py-10 select-none"
          >
            <div className="bg-amber-500 text-slate-950 text-[11px] font-black px-2.5 py-1 rounded-full shadow-2xl flex items-center gap-1.5 -translate-x-1/2 whitespace-nowrap animate-bounce border border-amber-300">
              <Scissors className="w-3.5 h-3.5" />
              <span>CUT REPLAY HERE ({replayCutHover.dateStr})</span>
            </div>
            <div className="bg-slate-900/95 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border border-amber-500/50 shadow-xl -translate-x-1/2 whitespace-nowrap self-center">
              ✂️ Click candle to start replay from here
            </div>
          </div>
        )}



        {/* Visible Draggable Handle Overlays for SL and TP */}
        {slCoordY !== null && slCoordY > 30 && slCoordY < 550 && (
          <div
            style={{ top: `${slCoordY - 12}px` }}
            className={`absolute left-32 z-20 flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg cursor-ns-resize transition-all ${
              dragTarget === 'SL' ? 'ring-2 ring-rose-300 scale-105' : ''
            }`}
            onMouseDown={() => setDragTarget('SL')}
          >
            <MoveVertical className="w-3 h-3" />
            <span>DRAG SL: ${Number(currentSl).toFixed(2)}</span>
          </div>
        )}

        {tpCoordY !== null && tpCoordY > 30 && tpCoordY < 550 && (
          <div
            style={{ top: `${tpCoordY - 12}px` }}
            className={`absolute left-72 z-20 flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg cursor-ns-resize transition-all ${
              dragTarget === 'TP' ? 'ring-2 ring-emerald-300 scale-105' : ''
            }`}
            onMouseDown={() => setDragTarget('TP')}
          >
            <MoveVertical className="w-3 h-3" />
            <span>DRAG TP: ${Number(currentTp).toFixed(2)}</span>
          </div>
        )}

        {/* Text Annotation Modal Popup */}
        {textModal && (
          <div className="absolute inset-0 z-40 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl w-80 font-sans flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-100 flex items-center gap-1.5 text-xs font-mono">
                  <Type className="w-4 h-4 text-cyan-400" /> ADD TEXT ANNOTATION
                </span>
                <button onClick={() => setTextModal(null)} className="text-slate-400 hover:text-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                autoFocus
                value={textInputVal}
                onChange={(e) => setTextInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && textInputVal.trim()) {
                    handleAddTextDrawing();
                  }
                }}
                placeholder="Type text note (e.g. Resistance Zone)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setTextModal(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTextDrawing}
                  disabled={!textInputVal.trim()}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-40 shadow-lg cursor-pointer"
                >
                  Add Text
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lightweight Charts Canvas Element */}
        <div ref={chartContainerRef} className="w-full flex-1 min-h-0 relative" />

        {/* Authentic SVG Drawing Canvas Overlay */}
        <svg className="absolute inset-0 w-full h-full z-10 overflow-hidden pointer-events-none">
          {!isHidden && drawingsList.map((d) => {
            const isSelected = selectedDrawingId === d.id;
            const isHovered = hoveredDrawingId === d.id;
            const strokeColor = isHovered && !isSelected ? '#f43f5e' : (d.color || '#38bdf8');
            const strokeW = d.lineWidth || 2;
            const dashStyle = d.dash || 'none';

            // 1. Horizontal Line
            if (d.type === 'horizline') {
              const y = candleSeriesRef.current?.priceToCoordinate(d.p1?.price ?? d.price);
              if (y === null || y === undefined || isNaN(y)) return null;
              return (
                <g key={d.id} onMouseDown={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onClick={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onMouseEnter={() => setHoveredDrawingId(d.id)} onMouseLeave={() => setHoveredDrawingId(null)} className="cursor-pointer group pointer-events-auto">
                  <line x1={0} y1={y} x2="100%" y2={y} stroke={strokeColor} strokeWidth={strokeW} strokeDasharray={dashStyle} />
                  <line x1={0} y1={y} x2="100%" y2={y} stroke="transparent" strokeWidth={16} />
                  <text x={12} y={y - 6} fill={strokeColor} fontSize={11} fontFamily="monospace" fontWeight="bold">
                    ${(d.p1?.price ?? d.price).toFixed(2)}
                  </text>
                  {isSelected && <circle cx={30} cy={y} r={6} fill="#ffffff" stroke={strokeColor} strokeWidth={2} className="animate-pulse" />}
                </g>
              );
            }

            // 2. Horizontal Ray
            if (d.type === 'horizray') {
              const c1 = getPointXY(d.p1);
              if (!c1) return null;
              return (
                <g key={d.id} onMouseDown={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onClick={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onMouseEnter={() => setHoveredDrawingId(d.id)} onMouseLeave={() => setHoveredDrawingId(null)} className="cursor-pointer group pointer-events-auto">
                  <line x1={c1.x} y1={c1.y} x2="100%" y2={c1.y} stroke={strokeColor} strokeWidth={strokeW} strokeDasharray={dashStyle} />
                  <line x1={c1.x} y1={c1.y} x2="100%" y2={c1.y} stroke="transparent" strokeWidth={16} />
                  <text x={c1.x + 8} y={c1.y - 6} fill={strokeColor} fontSize={11} fontFamily="monospace" fontWeight="bold">
                    RAY @ ${(d.p1?.price ?? d.price).toFixed(2)}
                  </text>
                  <circle cx={c1.x} cy={c1.y} r={isSelected ? 6 : 4} fill={isSelected ? '#ffffff' : strokeColor} stroke={strokeColor} strokeWidth={isSelected ? 2 : 0} />
                </g>
              );
            }

            // 3. Vertical Line
            if (d.type === 'vertline') {
              const x = chartRef.current?.timeScale().timeToCoordinate(d.p1?.time);
              if (x === null || x === undefined || isNaN(x)) return null;
              return (
                <g key={d.id} onMouseDown={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onClick={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onMouseEnter={() => setHoveredDrawingId(d.id)} onMouseLeave={() => setHoveredDrawingId(null)} className="cursor-pointer group pointer-events-auto">
                  <line x1={x} y1={0} x2={x} y2="100%" stroke={strokeColor} strokeWidth={strokeW} strokeDasharray={dashStyle === 'none' ? '4 4' : dashStyle} />
                  <line x1={x} y1={0} x2={x} y2="100%" stroke="transparent" strokeWidth={16} />
                  {isSelected && <circle cx={x} cy={40} r={6} fill="#ffffff" stroke={strokeColor} strokeWidth={2} className="animate-pulse" />}
                </g>
              );
            }

            // 4. Crossline
            if (d.type === 'crossline') {
              const c1 = getPointXY(d.p1);
              if (!c1) return null;
              return (
                <g key={d.id} onMouseDown={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onClick={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onMouseEnter={() => setHoveredDrawingId(d.id)} onMouseLeave={() => setHoveredDrawingId(null)} className="cursor-pointer group pointer-events-auto">
                  <line x1={0} y1={c1.y} x2="100%" y2={c1.y} stroke={strokeColor} strokeWidth={strokeW} strokeDasharray={dashStyle === 'none' ? '4 4' : dashStyle} />
                  <line x1={c1.x} y1={0} x2={c1.x} y2="100%" stroke={strokeColor} strokeWidth={strokeW} strokeDasharray={dashStyle === 'none' ? '4 4' : dashStyle} />
                  <circle cx={c1.x} cy={c1.y} r={6} fill="#ffffff" stroke={strokeColor} strokeWidth={2} />
                </g>
              );
            }

            // 5. Path / Polyline Zigzag Arrow
            if (d.type === 'path') {
              const pts = (d.points || []).map((p) => getPointXY(p)).filter(Boolean);
              if (pts.length < 2) return null;
              const pathData = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              const lastPt = pts[pts.length - 1];
              const secondLastPt = pts[pts.length - 2];

              const angle = Math.atan2(lastPt.y - secondLastPt.y, lastPt.x - secondLastPt.x);
              const arrowLen = 14;
              const a1X = lastPt.x - arrowLen * Math.cos(angle - Math.PI / 6);
              const a1Y = lastPt.y - arrowLen * Math.sin(angle - Math.PI / 6);
              const a2X = lastPt.x - arrowLen * Math.cos(angle + Math.PI / 6);
              const a2Y = lastPt.y - arrowLen * Math.sin(angle + Math.PI / 6);

              return (
                <g key={d.id} onMouseDown={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onClick={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onMouseEnter={() => setHoveredDrawingId(d.id)} onMouseLeave={() => setHoveredDrawingId(null)} className="cursor-pointer group pointer-events-auto">
                  <path d={pathData} fill="none" stroke={strokeColor} strokeWidth={strokeW} strokeDasharray={dashStyle} strokeLinecap="round" strokeLinejoin="round" />
                  <path d={pathData} fill="none" stroke="transparent" strokeWidth={strokeW + 14} strokeLinecap="round" strokeLinejoin="round" />
                  <polygon points={`${lastPt.x},${lastPt.y} ${a1X},${a1Y} ${a2X},${a2Y}`} fill={strokeColor} />
                  {pts.map((p, idx) => (
                    <circle key={idx} cx={p.x} cy={p.y} r={isSelected ? 6 : 4} fill={isSelected ? '#ffffff' : strokeColor} stroke={strokeColor} strokeWidth={isSelected ? 2 : 0} />
                  ))}
                </g>
              );
            }

            // 6. Trendline, Ray, Info Line, Extended Line
            if (['trendline', 'ray', 'infoline', 'extendedline'].includes(d.type)) {
              const c1 = getPointXY(d.p1);
              const c2 = getPointXY(d.p2);
              if (!c1 || !c2) return null;

              let lineX2 = c2.x;
              let lineY2 = c2.y;
              let lineX1 = c1.x;
              let lineY1 = c1.y;

              if (d.type === 'ray') {
                const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x);
                lineX2 = c1.x + 3000 * Math.cos(angle);
                lineY2 = c1.y + 3000 * Math.sin(angle);
              } else if (d.type === 'extendedline') {
                const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x);
                lineX1 = c1.x - 3000 * Math.cos(angle);
                lineY1 = c1.y - 3000 * Math.sin(angle);
                lineX2 = c1.x + 3000 * Math.cos(angle);
                lineY2 = c1.y + 3000 * Math.sin(angle);
              }

              const pDiff = d.p2.price - d.p1.price;
              const pPct = (pDiff / d.p1.price) * 100;
              const midX = (c1.x + c2.x) / 2;
              const midY = (c1.y + c2.y) / 2;

              return (
                <g key={d.id} onMouseDown={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onClick={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onMouseEnter={() => setHoveredDrawingId(d.id)} onMouseLeave={() => setHoveredDrawingId(null)} className="cursor-pointer group pointer-events-auto">
                  <line x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2} stroke={strokeColor} strokeWidth={strokeW} strokeDasharray={dashStyle} />
                  <line x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2} stroke="transparent" strokeWidth={16} />
                  <circle cx={c1.x} cy={c1.y} r={isSelected ? 6 : 4} fill={isSelected ? '#ffffff' : strokeColor} stroke={strokeColor} strokeWidth={isSelected ? 2 : 0} />
                  <circle cx={c2.x} cy={c2.y} r={isSelected ? 6 : 4} fill={isSelected ? '#ffffff' : strokeColor} stroke={strokeColor} strokeWidth={isSelected ? 2 : 0} />

                  {d.type === 'infoline' && (
                    <g transform={`translate(${midX}, ${midY - 14})`}>
                      <rect x={-45} y={-10} width={90} height={18} fill="#0f172a" stroke={strokeColor} strokeWidth={1} rx={4} />
                      <text x={0} y={3} textAnchor="middle" fill={pDiff >= 0 ? '#10b981' : '#f43f5e'} fontSize={10} fontFamily="monospace" fontWeight="bold">
                        {pDiff >= 0 ? '+' : ''}${pDiff.toFixed(2)} ({pPct >= 0 ? '+' : ''}{pPct.toFixed(2)}%)
                      </text>
                    </g>
                  )}
                </g>
              );
            }

            // 7. Circle / Ellipse
            if (d.type === 'circle') {
              const c1 = getPointXY(d.p1);
              const c2 = getPointXY(d.p2);
              if (!c1 || !c2) return null;
              const cx = (c1.x + c2.x) / 2;
              const cy = (c1.y + c2.y) / 2;
              const rx = Math.max(10, Math.abs(c2.x - c1.x) / 2);
              const ry = Math.max(10, Math.abs(c2.y - c1.y) / 2);
              return (
                <g key={d.id} onMouseDown={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onClick={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onMouseEnter={() => setHoveredDrawingId(d.id)} onMouseLeave={() => setHoveredDrawingId(null)} className="cursor-pointer group pointer-events-auto">
                  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={strokeColor + '25'} stroke={strokeColor} strokeWidth={strokeW} strokeDasharray={dashStyle} />
                  {isSelected && (
                    <>
                      <circle cx={cx - rx} cy={cy} r={5} fill="#ffffff" stroke={strokeColor} strokeWidth={2} />
                      <circle cx={cx + rx} cy={cy} r={5} fill="#ffffff" stroke={strokeColor} strokeWidth={2} />
                    </>
                  )}
                </g>
              );
            }

            // 8. Triangle Zone
            if (d.type === 'triangle') {
              const c1 = getPointXY(d.p1);
              const c2 = getPointXY(d.p2);
              if (!c1 || !c2) return null;
              const topX = (c1.x + c2.x) / 2;
              const topY = c1.y;
              const bLeftX = c1.x;
              const bLeftY = c2.y;
              const bRightX = c2.x;
              const bRightY = c2.y;
              return (
                <g key={d.id} onMouseDown={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onClick={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onMouseEnter={() => setHoveredDrawingId(d.id)} onMouseLeave={() => setHoveredDrawingId(null)} className="cursor-pointer group pointer-events-auto">
                  <polygon points={`${topX},${topY} ${bLeftX},${bLeftY} ${bRightX},${bRightY}`} fill={strokeColor + '25'} stroke={strokeColor} strokeWidth={strokeW} strokeDasharray={dashStyle} />
                  {isSelected && (
                    <>
                      <circle cx={topX} cy={topY} r={5} fill="#ffffff" stroke={strokeColor} strokeWidth={2} />
                      <circle cx={bLeftX} cy={bLeftY} r={5} fill="#ffffff" stroke={strokeColor} strokeWidth={2} />
                      <circle cx={bRightX} cy={bRightY} r={5} fill="#ffffff" stroke={strokeColor} strokeWidth={2} />
                    </>
                  )}
                </g>
              );
            }

            // 9. Parallel Channel & Regression Trend
            if (['channel', 'regression'].includes(d.type)) {
              const c1 = getPointXY(d.p1);
              const c2 = getPointXY(d.p2);
              if (!c1 || !c2) return null;
              const channelOffsetY = 40;
              return (
                <g key={d.id} onMouseDown={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onClick={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onMouseEnter={() => setHoveredDrawingId(d.id)} onMouseLeave={() => setHoveredDrawingId(null)} className="cursor-pointer group pointer-events-auto">
                  <polygon points={`${c1.x},${c1.y - channelOffsetY} ${c2.x},${c2.y - channelOffsetY} ${c2.x},${c2.y + channelOffsetY} ${c1.x},${c1.y + channelOffsetY}`} fill={strokeColor + '20'} />
                  <line x1={c1.x} y1={c1.y - channelOffsetY} x2={c2.x} y2={c2.y - channelOffsetY} stroke={strokeColor} strokeWidth={strokeW} />
                  <line x1={c1.x} y1={c1.y + channelOffsetY} x2={c2.x} y2={c2.y + channelOffsetY} stroke={strokeColor} strokeWidth={strokeW} />
                  <line x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke={strokeColor} strokeWidth={1.5} strokeDasharray="6 4" />
                </g>
              );
            }

            // 10. Gann Box
            if (d.type === 'gannbox') {
              const c1 = getPointXY(d.p1);
              const c2 = getPointXY(d.p2);
              if (!c1 || !c2) return null;
              const left = Math.min(c1.x, c2.x);
              const top = Math.min(c1.y, c2.y);
              const w = Math.abs(c2.x - c1.x);
              const h = Math.abs(c2.y - c1.y);
              return (
                <g key={d.id} onMouseDown={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onClick={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onMouseEnter={() => setHoveredDrawingId(d.id)} onMouseLeave={() => setHoveredDrawingId(null)} className="cursor-pointer group pointer-events-auto">
                  <rect x={left} y={top} width={w} height={h} fill={strokeColor + '15'} stroke={strokeColor} strokeWidth={strokeW} />
                  <line x1={left} y1={top} x2={left + w} y2={top + h} stroke={strokeColor} strokeWidth={1} strokeDasharray="4 4" />
                  <line x1={left + w} y1={top} x2={left} y2={top + h} stroke={strokeColor} strokeWidth={1} strokeDasharray="4 4" />
                  <line x1={left} y1={top + h * 0.5} x2={left + w} y2={top + h * 0.5} stroke={strokeColor} strokeWidth={1} strokeDasharray="2 2" />
                  <line x1={left + w * 0.5} y1={top} x2={left + w * 0.5} y2={top + h} stroke={strokeColor} strokeWidth={1} strokeDasharray="2 2" />
                </g>
              );
            }

            // 11. Rectangle Zone & Price Range
            if (['rectangle', 'pricerange', 'forecast'].includes(d.type)) {
              const c1 = getPointXY(d.p1);
              const c2 = getPointXY(d.p2);
              if (!c1 || !c2) return null;
              const left = Math.min(c1.x, c2.x);
              const top = Math.min(c1.y, c2.y);
              const width = Math.abs(c2.x - c1.x);
              const height = Math.abs(c2.y - c1.y);
              const pDiff = d.p2.price - d.p1.price;
              const pPct = (pDiff / (d.p1.price || 1)) * 100;

              return (
                <g key={d.id} onMouseDown={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onClick={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onMouseEnter={() => setHoveredDrawingId(d.id)} onMouseLeave={() => setHoveredDrawingId(null)} className="cursor-pointer group pointer-events-auto">
                  <rect x={left} y={top} width={width} height={height} fill={strokeColor + '25'} stroke={strokeColor} strokeWidth={strokeW} strokeDasharray={dashStyle} rx={4} />
                  {d.type === 'pricerange' && (
                    <text x={left + width / 2} y={top + height / 2} textAnchor="middle" fill={pDiff >= 0 ? '#10b981' : '#f43f5e'} fontSize={11} fontFamily="monospace" fontWeight="bold">
                      {pDiff >= 0 ? '+' : ''}${pDiff.toFixed(2)} ({pPct >= 0 ? '+' : ''}{pPct.toFixed(2)}%)
                    </text>
                  )}
                  {isSelected && (
                    <>
                      <circle cx={left} cy={top} r={5} fill="#ffffff" stroke={strokeColor} strokeWidth={2} />
                      <circle cx={left + width} cy={top + height} r={5} fill="#ffffff" stroke={strokeColor} strokeWidth={2} />
                    </>
                  )}
                </g>
              );
            }

            // 12. Freehand Brush
            if (d.type === 'brush') {
              const pts = (d.points || []).map((p) => getPointXY(p)).filter(Boolean);
              if (pts.length < 2) return null;
              const pathData = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              return (
                <g key={d.id} onMouseDown={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onClick={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onMouseEnter={() => setHoveredDrawingId(d.id)} onMouseLeave={() => setHoveredDrawingId(null)} className="cursor-pointer group pointer-events-auto">
                  <path d={pathData} fill="none" stroke={strokeColor} strokeWidth={strokeW} strokeDasharray={dashStyle} strokeLinecap="round" strokeLinejoin="round" />
                  <path d={pathData} fill="none" stroke="transparent" strokeWidth={strokeW + 16} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              );
            }

            // 13. Fibonacci Retracement & Extension & Fan
            if (['fib', 'fibext', 'fibfan'].includes(d.type)) {
              const c1 = getPointXY(d.p1);
              const c2 = getPointXY(d.p2);
              if (!c1 || !c2) return null;
              const p1Price = d.p1.price;
              const p2Price = d.p2.price;
              const diff = p2Price - p1Price;
              const minX = Math.min(c1.x, c2.x);
              const maxX = Math.max(c1.x, c2.x);
              const boxW = Math.max(160, maxX - minX);

              const fibLevels = [
                { ratio: 0, label: '0', color: '#787b86', fill: 'rgba(120, 123, 134, 0.15)' },
                { ratio: 0.236, label: '0.236', color: '#f43f5e', fill: 'rgba(244, 63, 94, 0.15)' },
                { ratio: 0.382, label: '0.382', color: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)' },
                { ratio: 0.5, label: '0.5', color: '#10b981', fill: 'rgba(16, 185, 129, 0.15)' },
                { ratio: 0.618, label: '0.618', color: '#06b6d4', fill: 'rgba(6, 182, 212, 0.15)' },
                { ratio: 0.786, label: '0.786', color: '#38bdf8', fill: 'rgba(56, 189, 248, 0.15)' },
                { ratio: 1, label: '1', color: '#787b86', fill: 'rgba(120, 123, 134, 0.15)' },
                { ratio: 1.618, label: '1.618', color: '#3b82f6', fill: 'rgba(59, 130, 246, 0.15)' },
                { ratio: 2.618, label: '2.618', color: '#f43f5e', fill: 'rgba(244, 63, 94, 0.15)' },
                { ratio: 3.618, label: '3.618', color: '#a855f7', fill: 'rgba(168, 85, 247, 0.15)' },
                { ratio: 4.236, label: '4.236', color: '#ec4899', fill: 'rgba(236, 72, 153, 0.15)' },
              ];

              const levelCoords = fibLevels.map((lvl) => {
                const price = p1Price + diff * lvl.ratio;
                const y = candleSeriesRef.current?.priceToCoordinate(price);
                return { ...lvl, price, y };
              }).filter((lvl) => lvl.y !== null && lvl.y !== undefined && !isNaN(lvl.y));

              return (
                <g key={d.id} onMouseDown={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onClick={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onMouseEnter={() => setHoveredDrawingId(d.id)} onMouseLeave={() => setHoveredDrawingId(null)} className="cursor-pointer group pointer-events-auto">
                  {/* Translucent Color Shaded Bands */}
                  {levelCoords.slice(0, -1).map((lvl, idx) => {
                    const nextLvl = levelCoords[idx + 1];
                    const bandTop = Math.min(lvl.y, nextLvl.y);
                    const bandH = Math.abs(nextLvl.y - lvl.y);
                    return (
                      <rect key={`band_${idx}`} x={minX} y={bandTop} width={boxW} height={bandH} fill={lvl.fill} />
                    );
                  })}

                  {/* Anchor Point Dashed Trend Line */}
                  <line x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke={d.color || '#94a3b8'} strokeWidth={strokeW} strokeDasharray={dashStyle === 'none' ? '6 4' : dashStyle} />

                  {/* Level Horizontal Lines & Price Labels */}
                  {levelCoords.map((lvl) => (
                    <g key={`line_${lvl.ratio}`}>
                      <line x1={minX} y1={lvl.y} x2={minX + boxW} y2={lvl.y} stroke={lvl.color} strokeWidth={1.5} />
                      <text x={minX + 8} y={lvl.y - 4} fill={lvl.color} fontSize={11} fontFamily="monospace" fontWeight="bold">
                        {lvl.label} ({lvl.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })})
                      </text>
                    </g>
                  ))}

                  {/* Selection Handles */}
                  {isSelected && (
                    <>
                      <circle cx={c1.x} cy={c1.y} r={6} fill="#ffffff" stroke="#38bdf8" strokeWidth={2} className="animate-pulse" />
                      <circle cx={c2.x} cy={c2.y} r={6} fill="#ffffff" stroke="#38bdf8" strokeWidth={2} className="animate-pulse" />
                    </>
                  )}
                </g>
              );
            }

            // 14. Long / Short Positions (Authentic TradingView Pro Standard & Interactive Handles)
            if (d.type === 'longpos' || d.type === 'shortpos') {
              const c1 = getPointXY(d.p1);
              const isLong = d.type === 'longpos';
              const entryY = c1?.y;
              const targetY = candleSeriesRef.current?.priceToCoordinate(d.targetPrice);
              const stopY = candleSeriesRef.current?.priceToCoordinate(d.stopPrice);

              if (entryY === null || entryY === undefined || isNaN(entryY) ||
                  targetY === null || targetY === undefined || isNaN(targetY) ||
                  stopY === null || stopY === undefined || isNaN(stopY) || !c1) return null;

              const boxWidth = d.width || 200;
              const left = Math.max(10, c1.x);
              const targetTop = Math.min(entryY, targetY);
              const targetHeight = Math.abs(targetY - entryY);

              const stopTop = Math.min(entryY, stopY);
              const stopHeight = Math.abs(stopY - entryY);

              const entryP = d.p1.price;
              const riskPct = Math.abs((d.stopPrice - entryP) / (entryP || 1)) * 100;
              const rewardPct = Math.abs((d.targetPrice - entryP) / (entryP || 1)) * 100;
              const rrRatio = (rewardPct / (riskPct || 0.0001)).toFixed(2);
              const isToolSelected = selectedDrawingId === d.id;

              return (
                <g 
                  key={d.id} 
                  onMouseDown={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} 
                  onClick={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} 
                  onMouseEnter={() => setHoveredDrawingId(d.id)} 
                  onMouseLeave={() => setHoveredDrawingId(null)} 
                  className="cursor-pointer group pointer-events-auto select-none"
                >
                  {/* Target Profit Area (Green Translucent Zone with Subtle Soft Edge) */}
                  <rect 
                    x={left} 
                    y={targetTop} 
                    width={boxWidth} 
                    height={Math.max(4, targetHeight)} 
                    fill="rgba(38, 166, 154, 0.2)" 
                    stroke="rgba(38, 166, 154, 0.5)" 
                    strokeWidth={1} 
                    rx={2} 
                  />

                  {/* Stop Loss Area (Red Translucent Zone with Subtle Soft Edge) */}
                  <rect 
                    x={left} 
                    y={stopTop} 
                    width={boxWidth} 
                    height={Math.max(4, stopHeight)} 
                    fill="rgba(239, 83, 80, 0.2)" 
                    stroke="rgba(239, 83, 80, 0.5)" 
                    strokeWidth={1} 
                    rx={2} 
                  />

                  {/* Sleek Middle Entry Line */}
                  <line 
                    x1={left} 
                    y1={entryY} 
                    x2={left + boxWidth} 
                    y2={entryY} 
                    stroke="#94a3b8" 
                    strokeWidth={1.5} 
                  />

                  {/* Top Center Risk/Reward Ratio Pill Badge (TradingView Style) */}
                  <g transform={`translate(${left + boxWidth / 2}, ${targetTop - 18})`}>
                    <rect 
                      x={-75} 
                      y={-10} 
                      width={150} 
                      height={20} 
                      fill="rgba(15, 23, 42, 0.9)" 
                      stroke="rgba(51, 65, 85, 0.8)" 
                      strokeWidth={1} 
                      rx={4} 
                    />
                    <text 
                      x={0} 
                      y={3} 
                      textAnchor="middle" 
                      fill="#cbd5e1" 
                      fontSize={10} 
                      fontFamily="monospace" 
                      fontWeight="bold"
                    >
                      Risk/Reward Ratio: {rrRatio}
                    </text>
                  </g>

                  {/* Target Area Text Badge Inside Green Box */}
                  {targetHeight >= 16 && (
                    <g transform={`translate(${left + 8}, ${targetTop + (isLong ? 14 : targetHeight - 8)})`}>
                      <text fill="#26a69a" fontSize={10} fontFamily="monospace" fontWeight="bold">
                        Target: ${d.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} (+{rewardPct.toFixed(2)}%)
                      </text>
                    </g>
                  )}

                  {/* Stop Area Text Badge Inside Red Box */}
                  {stopHeight >= 16 && (
                    <g transform={`translate(${left + 8}, ${stopTop + (isLong ? stopHeight - 8 : 14)})`}>
                      <text fill="#ef5350" fontSize={10} fontFamily="monospace" fontWeight="bold">
                        Stop: ${d.stopPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} (-{riskPct.toFixed(2)}%)
                      </text>
                    </g>
                  )}

                  {/* Interactive Selection Anchor Handles */}
                  {isToolSelected && (
                    <>
                      {/* Top Target Handle */}
                      <circle 
                        cx={left + boxWidth / 2} 
                        cy={targetY} 
                        r={5} 
                        fill="#ffffff" 
                        stroke="#26a69a" 
                        strokeWidth={2} 
                        className="cursor-ns-resize pointer-events-auto"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDrawingDragHandle({ id: d.id, handleType: 'target' });
                        }}
                      />

                      {/* Center Entry Handle */}
                      <circle 
                        cx={left + boxWidth / 2} 
                        cy={entryY} 
                        r={5} 
                        fill="#ffffff" 
                        stroke="#94a3b8" 
                        strokeWidth={2} 
                        className="cursor-ns-resize pointer-events-auto"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDrawingDragHandle({ id: d.id, handleType: 'entry' });
                        }}
                      />

                      {/* Bottom Stop Handle */}
                      <circle 
                        cx={left + boxWidth / 2} 
                        cy={stopY} 
                        r={5} 
                        fill="#ffffff" 
                        stroke="#ef5350" 
                        strokeWidth={2} 
                        className="cursor-ns-resize pointer-events-auto"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDrawingDragHandle({ id: d.id, handleType: 'stop' });
                        }}
                      />

                      {/* Side Width Handle */}
                      <circle 
                        cx={left + boxWidth} 
                        cy={entryY} 
                        r={5} 
                        fill="#ffffff" 
                        stroke="#38bdf8" 
                        strokeWidth={2} 
                        className="cursor-ew-resize pointer-events-auto"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDrawingDragHandle({ id: d.id, handleType: 'width' });
                        }}
                      />
                    </>
                  )}
                </g>
              );
            }

            // 15. Text Note & Callout & Price Note
            if (['text', 'callout', 'pricenote'].includes(d.type)) {
              const c = getPointXY(d.p1);
              if (!c) return null;
              const textContent = d.text || (d.type === 'pricenote' ? `$${(d.p1?.price ?? 0).toFixed(2)}` : 'Note');
              return (
                <g key={d.id} transform={`translate(${c.x}, ${c.y})`} onMouseDown={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onClick={(e) => { e.stopPropagation(); setSelectedDrawingId(d.id); }} onMouseEnter={() => setHoveredDrawingId(d.id)} onMouseLeave={() => setHoveredDrawingId(null)} className="cursor-pointer group pointer-events-auto">
                  <rect x={-6} y={-18} width={Math.max(70, textContent.length * 7.5 + 16)} height={26} fill="#0f172a" stroke={strokeColor} strokeWidth={strokeW} rx={6} className="shadow-xl" />
                  {d.type === 'callout' && (
                    <polygon points="0,8 10,18 20,8" fill="#0f172a" stroke={strokeColor} strokeWidth={strokeW} />
                  )}
                  <text x={4} y={0} fill={strokeColor} fontSize={11} fontFamily="sans-serif" fontWeight="bold">
                    {textContent}
                  </text>
                </g>
              );
            }

            return null;
          })}

          {/* TradingView Authentic Interactive Measure / Ruler Tool Overlay */}
          {currentMeasureTarget && (() => {
            const { p1, p2 } = currentMeasureTarget;
            const c1 = getPointXY(p1) || (p1.x !== undefined ? { x: p1.x, y: p1.y } : null);
            const c2 = getPointXY(p2) || (p2.x !== undefined ? { x: p2.x, y: p2.y } : null);
            if (!c1 || !c2) return null;

            const minX = Math.min(c1.x, c2.x);
            const minY = Math.min(c1.y, c2.y);
            const maxX = Math.max(c1.x, c2.x);
            const maxY = Math.max(c1.y, c2.y);
            const width = Math.max(4, maxX - minX);
            const height = Math.max(4, maxY - minY);

            const centerX = minX + width / 2;
            const centerY = minY + height / 2;

            const p1Price = p1.price || 0;
            const p2Price = p2.price || 0;
            const priceDiff = p2Price - p1Price;
            const pctDiff = (priceDiff / (p1Price || 1)) * 100;
            const isPos = priceDiff >= 0;

            // Calculate Ticks & Bars
            const ticksCount = Math.round(priceDiff * 10);
            const formattedTicks = (ticksCount >= 0 ? '' : '') + ticksCount.toLocaleString();

            let barCount = 1;
            if (candles && p1.time && p2.time) {
              const idx1 = candles.findIndex((c) => c.time === p1.time);
              const idx2 = candles.findIndex((c) => c.time === p2.time);
              if (idx1 >= 0 && idx2 >= 0) {
                barCount = Math.abs(idx2 - idx1) + 1;
              }
            }

            const colorPrimary = isPos ? '#10b981' : '#f43f5e';
            const colorFill = isPos ? 'rgba(16, 185, 129, 0.18)' : 'rgba(244, 63, 94, 0.18)';
            const colorStroke = isPos ? 'rgba(16, 185, 129, 0.6)' : 'rgba(244, 63, 94, 0.6)';

            // Arrow Head geometry
            const arrowSize = 5;
            const isVertDown = c2.y > c1.y;

            // Badge position (Below if drop, Above if rise)
            const badgeY = isPos ? minY - 42 : maxY + 8;
            const line1Text = `${priceDiff >= 0 ? '+' : ''}${priceDiff.toFixed(1)} (${pctDiff >= 0 ? '+' : ''}${pctDiff.toFixed(2)}%) ${formattedTicks}`;
            const line2Text = `${barCount} bar${barCount > 1 ? 's' : ''}`;
            const badgeW = Math.max(160, line1Text.length * 7 + 10);

            return (
              <g key="measure_tool_overlay" className="select-none">
                {/* 1. Translucent Shaded Rectangle Area */}
                <rect 
                  x={minX} 
                  y={minY} 
                  width={width} 
                  height={height} 
                  fill={colorFill} 
                  stroke={colorStroke} 
                  strokeWidth={1} 
                  rx={2} 
                  className="pointer-events-none"
                />

                {/* 2. Central Vertical Line with Directional Arrow */}
                <line 
                  x1={centerX} 
                  y1={minY} 
                  x2={centerX} 
                  y2={maxY} 
                  stroke={colorPrimary} 
                  strokeWidth={1.5} 
                  className="pointer-events-none"
                />
                <polygon 
                  points={
                    isVertDown 
                      ? `${centerX},${maxY} ${centerX - arrowSize},${maxY - arrowSize * 1.6} ${centerX + arrowSize},${maxY - arrowSize * 1.6}`
                      : `${centerX},${minY} ${centerX - arrowSize},${minY + arrowSize * 1.6} ${centerX + arrowSize},${minY + arrowSize * 1.6}`
                  } 
                  fill={colorPrimary} 
                  className="pointer-events-none"
                />

                {/* 3. Central Horizontal Line with Right Directional Arrow */}
                <line 
                  x1={minX} 
                  y1={centerY} 
                  x2={maxX} 
                  y2={centerY} 
                  stroke={colorPrimary} 
                  strokeWidth={1.5} 
                  className="pointer-events-none"
                />
                <polygon 
                  points={`${maxX},${centerY} ${maxX - arrowSize * 1.6},${centerY - arrowSize} ${maxX - arrowSize * 1.6},${centerY + arrowSize}`} 
                  fill={colorPrimary} 
                  className="pointer-events-none"
                />

                {/* 4. TradingView Authentic Floating Metric Badge Pill Container */}
                <g 
                  transform={`translate(${centerX}, ${badgeY})`} 
                  className="pointer-events-auto cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeMeasureBox) setActiveMeasureBox(null);
                  }}
                >
                  <rect 
                    x={-badgeW / 2} 
                    y={0} 
                    width={badgeW} 
                    height={34} 
                    fill={colorPrimary} 
                    rx={6} 
                    className="shadow-2xl" 
                  />
                  {/* Line 1: Price Delta, %, Ticks */}
                  <text 
                    x={0} 
                    y={14} 
                    textAnchor="middle" 
                    fill="#ffffff" 
                    fontSize={11} 
                    fontFamily="sans-serif, system-ui" 
                    fontWeight="bold"
                  >
                    {line1Text}
                  </text>
                  {/* Line 2: Bar Count */}
                  <text 
                    x={0} 
                    y={27} 
                    textAnchor="middle" 
                    fill="rgba(255, 255, 255, 0.9)" 
                    fontSize={10} 
                    fontFamily="sans-serif, system-ui" 
                    fontWeight="600"
                  >
                    {line2Text}
                  </text>
                </g>
              </g>
            );
          })()}

          {/* Live Drawing Preview for active 2-point tools */}
          {drawingStartPoint && drawingHoverPoint && (
            <g className="pointer-events-none opacity-80">
              {(() => {
                const c1 = getPointXY(drawingStartPoint);
                const c2 = getPointXY(drawingHoverPoint);
                if (!c1 || !c2) return null;

                if (['trendline', 'ray', 'infoline', 'extendedline'].includes(activeTool)) {
                  return <line x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 4" />;
                }
                if (['rectangle', 'pricerange', 'forecast', 'gannbox'].includes(activeTool)) {
                  const left = Math.min(c1.x, c2.x);
                  const top = Math.min(c1.y, c2.y);
                  const w = Math.abs(c2.x - c1.x);
                  const h = Math.abs(c2.y - c1.y);
                  return <rect x={left} y={top} width={w} height={h} fill="#38bdf830" stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 4" rx={4} />;
                }
                if (activeTool === 'circle') {
                  const cx = (c1.x + c2.x) / 2;
                  const cy = (c1.y + c2.y) / 2;
                  const rx = Math.max(5, Math.abs(c2.x - c1.x) / 2);
                  const ry = Math.max(5, Math.abs(c2.y - c1.y) / 2);
                  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#38bdf830" stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 4" />;
                }
                if (['fib', 'fibext', 'fibfan'].includes(activeTool)) {
                  const p1Price = drawingStartPoint.price;
                  const p2Price = drawingHoverPoint.price;
                  const diff = p2Price - p1Price;
                  const minX = Math.min(c1.x, c2.x);
                  const maxX = Math.max(c1.x, c2.x);
                  const boxW = Math.max(140, maxX - minX);

                  const fibLevels = [
                    { ratio: 0, label: '0', color: '#787b86', fill: 'rgba(120, 123, 134, 0.15)' },
                    { ratio: 0.236, label: '0.236', color: '#f43f5e', fill: 'rgba(244, 63, 94, 0.15)' },
                    { ratio: 0.382, label: '0.382', color: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)' },
                    { ratio: 0.5, label: '0.5', color: '#10b981', fill: 'rgba(16, 185, 129, 0.15)' },
                    { ratio: 0.618, label: '0.618', color: '#06b6d4', fill: 'rgba(6, 182, 212, 0.15)' },
                    { ratio: 0.786, label: '0.786', color: '#38bdf8', fill: 'rgba(56, 189, 248, 0.15)' },
                    { ratio: 1, label: '1', color: '#787b86', fill: 'rgba(120, 123, 134, 0.15)' },
                    { ratio: 1.618, label: '1.618', color: '#3b82f6', fill: 'rgba(59, 130, 246, 0.15)' },
                    { ratio: 2.618, label: '2.618', color: '#f43f5e', fill: 'rgba(244, 63, 94, 0.15)' },
                    { ratio: 3.618, label: '3.618', color: '#a855f7', fill: 'rgba(168, 85, 247, 0.15)' },
                    { ratio: 4.236, label: '4.236', color: '#ec4899', fill: 'rgba(236, 72, 153, 0.15)' },
                  ];

                  const levelCoords = fibLevels.map((lvl) => {
                    const price = p1Price + diff * lvl.ratio;
                    const y = candleSeriesRef.current?.priceToCoordinate(price);
                    return { ...lvl, price, y };
                  }).filter((lvl) => lvl.y !== null && lvl.y !== undefined && !isNaN(lvl.y));

                  return (
                    <g>
                      {levelCoords.slice(0, -1).map((lvl, idx) => {
                        const nextLvl = levelCoords[idx + 1];
                        const bandTop = Math.min(lvl.y, nextLvl.y);
                        const bandH = Math.abs(nextLvl.y - lvl.y);
                        return <rect key={`live_fib_band_${idx}`} x={minX} y={bandTop} width={boxW} height={bandH} fill={lvl.fill} />;
                      })}
                      <line x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="6 4" />
                      {levelCoords.map((lvl) => (
                        <g key={`live_fib_line_${lvl.ratio}`}>
                          <line x1={minX} y1={lvl.y} x2={minX + boxW} y2={lvl.y} stroke={lvl.color} strokeWidth={1.5} />
                          <text x={minX + 8} y={lvl.y - 4} fill={lvl.color} fontSize={11} fontFamily="monospace" fontWeight="bold">
                            {lvl.label} ({lvl.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })})
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                }
                return null;
              })()}
            </g>
          )}

          {/* Live Active Brush Stroke Preview */}
          {isBrushActive && activeBrushPoints.length > 1 && (
            <g className="pointer-events-none">
              {(() => {
                const pts = activeBrushPoints.map((p) => getPointXY(p)).filter(Boolean);
                if (pts.length < 2) return null;
                const pathData = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                return <path d={pathData} fill="none" stroke="#38bdf8" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />;
              })()}
            </g>
          )}

          {/* Live Active Path Polyline Preview */}
          {activeTool === 'path' && activePathPoints.length > 0 && (
            <g className="pointer-events-none z-30">
              {(() => {
                const pts = activePathPoints.map((p) => getPointXY(p)).filter(Boolean);
                const hoverPt = drawingHoverPoint ? getPointXY(drawingHoverPoint) : null;
                if (pts.length === 0) return null;
                const pathData = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                const lastPt = pts[pts.length - 1];

                return (
                  <>
                    <path d={pathData} fill="none" stroke="#f97316" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    {pts.map((p, idx) => (
                      <circle key={idx} cx={p.x} cy={p.y} r={4} fill="#f97316" />
                    ))}
                    {hoverPt && (
                      <line x1={lastPt.x} y1={lastPt.y} x2={hoverPt.x} y2={hoverPt.y} stroke="#f97316" strokeWidth={2} strokeDasharray="4 4" />
                    )}
                  </>
                );
              })()}
            </g>
          )}

          {/* SMC & ICT AI Overlay Graphics (Viewport-Filtered for Instant Lag-Free 60 FPS Panning & Zooming) */}
          {activeIndicators?.smcIct && smcData && (
            <g className="pointer-events-none z-10">
              {/* 1. Viewport-Filtered Order Blocks (OB) */}
              {showObs && smcData.orderBlocks.map((ob) => {
                const startX = ob.startTime && chartRef.current 
                  ? chartRef.current.timeScale().timeToCoordinate(ob.startTime) 
                  : null;

                const endX = ob.mitigatedTime && chartRef.current
                  ? chartRef.current.timeScale().timeToCoordinate(ob.mitigatedTime)
                  : (candles && candles.length > 0 && chartRef.current 
                      ? chartRef.current.timeScale().timeToCoordinate(candles[candles.length - 1].time) 
                      : null);

                const chartW = chartContainerRef.current?.clientWidth || 1000;
                const x1 = (startX !== null && !isNaN(startX)) ? startX : 0;
                const x2 = (endX !== null && !isNaN(endX)) ? endX : chartW;

                // Instant lag-free skip if off-screen
                if (x2 < -50 || x1 > chartW + 50) return null;

                const topY = candleSeriesRef.current?.priceToCoordinate(ob.top);
                const bottomY = candleSeriesRef.current?.priceToCoordinate(ob.bottom);
                if (topY === null || bottomY === null || isNaN(topY) || isNaN(bottomY)) return null;

                const boxW = Math.max(16, x2 - x1);
                const isBull = ob.type === 'BULLISH_OB';
                const fillColor = isBull ? 'rgba(6, 182, 212, 0.22)' : 'rgba(244, 63, 94, 0.22)';
                const strokeColor = isBull ? '#06b6d4' : '#f43f5e';
                const y = Math.min(topY, bottomY);
                const h = Math.max(5, Math.abs(bottomY - topY));

                return (
                  <g key={ob.id}>
                    <rect x={x1} y={y} width={boxW} height={h} fill={fillColor} stroke={strokeColor} strokeWidth={1.5} strokeDasharray={ob.isMitigated ? "3 3" : undefined} rx={2} />
                    <text x={x1 + 6} y={y + 12} fill={strokeColor} fontSize={10} fontFamily="monospace" fontWeight="bold">
                      {isBull ? 'Bullish OB' : 'Bearish OB'} {ob.isMitigated ? '(Tapped)' : ''}
                    </text>
                  </g>
                );
              })}

              {/* 2. Viewport-Filtered Fair Value Gaps (FVG) */}
              {showFvgs && smcData.fvgs.map((fvg) => {
                const startX = fvg.startTime && chartRef.current 
                  ? chartRef.current.timeScale().timeToCoordinate(fvg.startTime) 
                  : null;

                const endX = fvg.filledTime && chartRef.current
                  ? chartRef.current.timeScale().timeToCoordinate(fvg.filledTime)
                  : (candles && candles.length > 0 && chartRef.current 
                      ? chartRef.current.timeScale().timeToCoordinate(candles[candles.length - 1].time) 
                      : null);

                const chartW = chartContainerRef.current?.clientWidth || 1000;
                const x1 = (startX !== null && !isNaN(startX)) ? startX : 0;
                const x2 = (endX !== null && !isNaN(endX)) ? endX : chartW;

                // Instant lag-free skip if off-screen
                if (x2 < -50 || x1 > chartW + 50) return null;

                const topY = candleSeriesRef.current?.priceToCoordinate(fvg.top);
                const bottomY = candleSeriesRef.current?.priceToCoordinate(fvg.bottom);
                if (topY === null || bottomY === null || isNaN(topY) || isNaN(bottomY)) return null;

                const boxW = Math.max(14, x2 - x1);
                const isBull = fvg.type === 'BULLISH_FVG';
                const strokeColor = isBull ? '#38bdf8' : '#f59e0b';
                const fillColor = isBull ? 'rgba(56, 189, 248, 0.16)' : 'rgba(245, 158, 11, 0.16)';
                const y = Math.min(topY, bottomY);
                const h = Math.max(4, Math.abs(bottomY - topY));

                return (
                  <g key={fvg.id}>
                    <rect x={x1} y={y} width={boxW} height={h} fill={fillColor} stroke={strokeColor} strokeWidth={1} strokeDasharray="4 3" rx={2} />
                    <text x={x1 + 6} y={y + 11} fill={strokeColor} fontSize={9} fontFamily="monospace" fontWeight="bold">
                      {isBull ? 'FVG Bull' : 'FVG Bear'} {fvg.isFilled ? '(Filled)' : ''}
                    </text>
                  </g>
                );
              })}

              {/* 3. Viewport-Filtered CHoCH & BOS Lines */}
              {showChoch && smcData.structures.map((st, idx) => {
                const startX = st.pivotTime && chartRef.current 
                  ? chartRef.current.timeScale().timeToCoordinate(st.pivotTime) 
                  : null;

                const endX = st.time && chartRef.current 
                  ? chartRef.current.timeScale().timeToCoordinate(st.time) 
                  : null;

                const chartW = chartContainerRef.current?.clientWidth || 1000;
                const x1 = (startX !== null && !isNaN(startX)) ? startX : 0;
                const x2 = (endX !== null && !isNaN(endX)) ? endX : chartW;

                // Instant lag-free skip if off-screen
                if (x2 < -50 || x1 > chartW + 50) return null;

                const lineY = candleSeriesRef.current?.priceToCoordinate(st.price);
                if (lineY === null || isNaN(lineY)) return null;

                const isBull = st.type.includes('BULLISH');
                const color = isBull ? '#10b981' : '#f43f5e';
                const labelText = st.label;
                const midX = (x1 + x2) / 2;

                return (
                  <g key={`st_${idx}`}>
                    <line x1={x1} y1={lineY} x2={x2} y2={lineY} stroke={color} strokeWidth={1.5} strokeDasharray="5 3" />
                    <text 
                      x={midX} 
                      y={isBull ? lineY - 5 : lineY + 13} 
                      textAnchor="middle" 
                      fill={color} 
                      fontSize={11} 
                      fontFamily="monospace" 
                      fontWeight="bold"
                    >
                      {labelText}
                    </text>
                  </g>
                );
              })}

              {/* 4. ICT 50% Equilibrium (EQ) Line (Premium vs Discount Boundary) */}
              {smcData.equilibrium && (() => {
                const eqY = candleSeriesRef.current?.priceToCoordinate(smcData.equilibrium.eqPrice);
                if (eqY === null || isNaN(eqY)) return null;

                return (
                  <g key="ict_eq_line">
                    <line x1={0} y1={eqY} x2="100%" y2={eqY} stroke="#06b6d4" strokeWidth={1} strokeDasharray="8 4" opacity={0.6} />
                    <text x={340} y={eqY - 4} fill="#06b6d4" fontSize={9} fontFamily="monospace" fontWeight="bold">
                      ICT EQ 50.0% (${smcData.equilibrium.eqPrice.toFixed(2)})
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
        </svg>

        {/* SMC & ICT AI Overlay Legend & Pattern Card */}
        {(activeIndicators?.smcIct || activeIndicators?.aiPatterns) && (
          <SmcPatternLegendCard
            smcData={smcData}
            patterns={aiDetectedPatterns}
            showObs={showObs}
            showFvgs={showFvgs}
            showChoch={showChoch}
            showPatterns={showPatterns}
            onToggleObs={() => setShowObs(!showObs)}
            onToggleFvgs={() => setShowFvgs(!showFvgs)}
            onToggleChoch={() => setShowChoch(!showChoch)}
            onTogglePatterns={() => setShowPatterns(!showPatterns)}
          />
        )}

        {/* TradingView-Style Time Range Toolbar & Bottom Bar */}
        <div className="bg-slate-900/95 border-t border-slate-800 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          
          {/* Left: Time Range Presets */}
          <div className="flex items-center gap-1 text-[11px]">
            {['1D', '5D', '1M', '3M', 'ALL'].map((range) => (
              <button
                key={range}
                onClick={() => handleSelectRange(range)}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  selectedRange === range
                    ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Middle: Timezone & Drawings Counter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>UTC+5:30 (IST Kolkata)</span>
            </div>
            
            {drawingsList.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                <Layers className="w-3 h-3" />
                <span>{drawingsList.length} Drawings</span>
              </div>
            )}
          </div>

          {/* Right: Scale Toggles & Fullscreen */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLogScale(!isLogScale)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all border ${
                isLogScale
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
              title="Toggle Logarithmic Price Scale"
            >
              LOG
            </button>

            <button
              onClick={() => handleSelectRange('ALL')}
              className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
              title="Reset Scale (Auto Fit)"
            >
              AUTO
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1 text-slate-400 hover:text-slate-100 bg-slate-950 border border-slate-800 rounded hover:bg-slate-800 transition-all"
              title="Toggle Fullscreen Chart Mode"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
});
