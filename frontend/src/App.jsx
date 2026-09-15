import React, { useState, useEffect, useRef } from 'react';
import { Zap, Layers, Cpu } from 'lucide-react';
import { Header } from './components/Header';
import { TradingChart } from './components/TradingChart';
import { OrderPanel } from './components/OrderPanel';
import { ActivePositionCard } from './components/ActivePositionCard';
import { ReplayControls } from './components/ReplayControls';
import { TradeHistory } from './components/TradeHistory';
import { AnalyticsSummary } from './components/AnalyticsSummary';
import { ApiKeyModal } from './components/ApiKeyModal';

import { fetchBinanceKlines } from './services/binanceApi';
import { fetchTwelveDataGold } from './services/twelveDataApi';
import { generateMockCandles } from './services/mockDataGenerator';
import { BinanceWebSocketManager } from './services/binanceWebSocket';

import { soundEngine } from './utils/soundEngine';
import { ToastContainer } from './components/ToastContainer';
import { OrderBook } from './components/OrderBook';
import { StrategyTester } from './components/StrategyTester';
import { MLSignalCard } from './components/MLSignalCard';
import { fetchMLPrediction } from './utils/mlEngineClient';
import { useHotkeys } from './hooks/useHotkeys';
import { auditTradeSetup } from './utils/tradeCoach';
import { AICoachModal } from './components/AICoachModal';
import { MonteCarloModal } from './components/MonteCarloModal';
import { BacktestReportModal } from './components/BacktestReportModal';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { IndicatorsModal } from './components/IndicatorsModal';
import { ChartSettingsModal } from './components/ChartSettingsModal';
import { WatchlistSidebar } from './components/WatchlistSidebar';
import { AiConfluenceMatrix } from './components/AiConfluenceMatrix';
import { computeSmcAnalysis } from './utils/smcEngine';

/**
 * Returns exact timeframe period in seconds
 */
function getIntervalSeconds(tf) {
  switch (tf) {
    case '1m': return 60;
    case '5m': return 300;
    case '15m': return 900;
    case '1h': return 3600;
    case '4h': return 14400;
    case '1d': return 86400;
    default: return 3600;
  }
}

/**
 * Calculates exact remaining seconds until current candle closes based on real clock UTC boundaries
 */
function calculateCandleRemainingSeconds(interval) {
  const nowSecs = Math.floor(Date.now() / 1000);
  const period = getIntervalSeconds(interval);
  const elapsed = nowSecs % period;
  const remaining = period - elapsed;
  return remaining === period ? 0 : remaining;
}

/**
 * Formats seconds into MM:SS or HH:MM:SS
 */
function formatCountdown(totalSecs) {
  if (totalSecs < 0) totalSecs = 0;
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const pad = (n) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function App() {
  // Market & Asset State
  const [symbol, setSymbol] = useState(() => localStorage.getItem('quant_symbol') || 'BTC/USDT');
  const [interval, setInterval] = useState(() => localStorage.getItem('quant_interval') || '1h');
  const [allCandles, setAllCandles] = useState([]);
  const [latestTickBar, setLatestTickBar] = useState(null);
  const [candleCountdown, setCandleCountdown] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataSourceInfo, setDataSourceInfo] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');

  // TradingView Modals & Chart Properties State
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);
  const [isChartSettingsOpen, setIsChartSettingsOpen] = useState(false);
  const [chartType, setChartType] = useState(() => localStorage.getItem('quant_chart_type') || 'candlestick');
  const [chartBgColor, setChartBgColor] = useState(() => localStorage.getItem('quant_chart_bg') || '#090d16');
  const [chartGridStyle, setChartGridStyle] = useState(() => localStorage.getItem('quant_chart_grid') || 'dashed');

  // Twelve Data Key
  const [twelveDataKey, setTwelveDataKey] = useState(() => localStorage.getItem('quant_twelve_key') || '');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Bar Replay Engine State
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [isSelectingReplayCut, setIsSelectingReplayCut] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const handleSelectReplayCutIndex = (idx) => {
    setReplayIndex(idx);
    setIsSelectingReplayCut(false);
    setIsPlaying(false);
    const bar = allCandles[idx];
    if (bar) {
      addToast(`✂️ Bar Replay cut set to Candle #${idx + 1} ($${bar.close})`, 'info');
    }
  };

  // Trading & Wallet Engine State
  const [wallet, setWallet] = useState({ startingBalance: 10000.00, balance: 10000.00 });
  const [activeTrade, setActiveTrade] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);

  // Pending SL and TP inputs & enable toggles (synced with chart drag & drop and Order Panel)
  const [isSlEnabled, setIsSlEnabled] = useState(false);
  const [isTpEnabled, setIsTpEnabled] = useState(false);
  const [pendingSl, setPendingSl] = useState('');
  const [pendingTp, setPendingTp] = useState('');

  // Right Sidebar Active Tab State ('orders' | 'book' | 'ai')
  const [rightSidebarTab, setRightSidebarTab] = useState(() => localStorage.getItem('quant_right_sidebar_tab') || 'orders');

  // Indicators & Crosshair State (EMA 9, EMA 15, SMA 20, SMA 50, Auto S/R, AI ML)
  const defaultIndicators = { 
    ema9: true, 
    ema15: true, 
    sma20: true, 
    sma50: true, 
    rsi: false,
    autoSr: true,
    aiMl: true,
    candlePattern: true,
    smcIct: true,
    aiPatterns: true
  };

  const [activeIndicators, setActiveIndicators] = useState(() => {
    try {
      const saved = localStorage.getItem('quant_active_indicators');
      if (saved) return { ...defaultIndicators, ...JSON.parse(saved) };
    } catch (e) {}
    return defaultIndicators;
  });

  // 100% Client-Side Web Memory Persistence for All User Settings & Indicator Toggles
  useEffect(() => {
    try {
      localStorage.setItem('quant_symbol', symbol);
      localStorage.setItem('quant_interval', interval);
      localStorage.setItem('quant_chart_type', chartType);
      localStorage.setItem('quant_chart_bg', chartBgColor);
      localStorage.setItem('quant_chart_grid', chartGridStyle);
      localStorage.setItem('quant_right_sidebar_tab', rightSidebarTab);
      localStorage.setItem('quant_active_indicators', JSON.stringify(activeIndicators));
    } catch (e) {
      console.warn('Failed to save user settings to localStorage:', e);
    }
  }, [symbol, interval, chartType, chartBgColor, chartGridStyle, rightSidebarTab, activeIndicators]);
  const [hoveredPriceData, setHoveredPriceData] = useState(null);

  // Machine Learning AI Signal State
  const [mlData, setMlData] = useState(null);
  const [isMlLoading, setIsMlLoading] = useState(false);

  // Memoized SMC & ICT Analysis for AI Confluence Matrix
  const smcData = React.useMemo(() => {
    try {
      if (!allCandles || !Array.isArray(allCandles) || allCandles.length < 20) return null;
      return computeSmcAnalysis(allCandles);
    } catch (err) {
      console.error('SMC Calculation error:', err);
      return null;
    }
  }, [allCandles]);

  // Institutional Features State (Toasts, Split Screen, Strategy Tester, Coach, Monte Carlo, Report)
  const [toasts, setToasts] = useState([]);
  const [isSplitScreen, setIsSplitScreen] = useState(false);
  const [isStrategyTesterOpen, setIsStrategyTesterOpen] = useState(false);
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [isMonteCarloOpen, setIsMonteCarloOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [recentLossTimestamp, setRecentLossTimestamp] = useState(null);

  const addToast = (message, type = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const activeTradeRef = useRef(activeTrade);
  useEffect(() => {
    activeTradeRef.current = activeTrade;
  }, [activeTrade]);

  const allCandlesRef = useRef(allCandles);
  useEffect(() => {
    allCandlesRef.current = allCandles;
  }, [allCandles]);

  // Sync state with Express Backend DB on mount
  useEffect(() => {
    async function initBackendState() {
      try {
        const walletRes = await fetch('/api/wallet');
        if (walletRes.ok) {
          const data = await walletRes.json();
          if (data.wallet) setWallet(data.wallet);
          if (data.activeTrade) setActiveTrade(data.activeTrade);
        }

        const tradesRes = await fetch('/api/trades');
        if (tradesRes.ok) {
          const data = await tradesRes.json();
          if (Array.isArray(data.tradeHistory)) setTradeHistory(data.tradeHistory);
        }
      } catch (err) {
        console.warn('Backend sync on mount unavailable, operating in offline mode:', err.message);
      }
    }
    initBackendState();
  }, []);

  // Save API key changes
  const handleSaveApiKey = (newKey) => {
    setTwelveDataKey(newKey);
    localStorage.setItem('quant_twelve_key', newKey);
  };

  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const isLoadingHistoryRef = useRef(false);

  // Helper to determine exact candles count needed to cover ~2 years per timeframe
  const getLimitFor2Years = (tf) => {
    switch (tf) {
      case '1d': return 1000;   // ~2.74 Years
      case '4h': return 5000;   // ~2.28 Years
      case '1h': return 18000;  // ~2.05 Years
      case '15m': return 35000; // ~1.00 - 2.00 Years
      case '5m': return 35000;  // Deep intraday
      case '1m': return 35000;  // Deep scalping
      default: return 5000;
    }
  };

  // Load chart market data
  const loadChartData = async () => {
    setIsLoading(true);
    setNoticeMsg('');
    isLoadingHistoryRef.current = false;

    try {
      const initialLimit = getLimitFor2Years(interval);

      if (symbol === 'BTC/USDT' || symbol === 'ETH/USDT' || symbol === 'SOL/USDT') {
        const binanceSymbol = symbol.replace('/', '');
        const res = await fetchBinanceKlines(binanceSymbol, interval, initialLimit);
        setAllCandles(res.candles);
        setDataSourceInfo(res.source);
        if (res.errorNotice) setNoticeMsg(res.errorNotice);
      } else if (symbol === 'XAU/USD') {
        const res = await fetchTwelveDataGold(twelveDataKey, interval, initialLimit);
        setAllCandles(res.candles);
        setDataSourceInfo(res.source);
        if (res.notice || res.errorNotice) {
          setNoticeMsg(res.notice || res.errorNotice);
        }
      } else {
        const mock = generateMockCandles(symbol, initialLimit);
        setAllCandles(mock);
        setDataSourceInfo('Synthetic Generator');
      }
    } catch (err) {
      console.error('Failed to load chart data:', err);
      const fallback = generateMockCandles(symbol, 5000);
      setAllCandles(fallback);
      setDataSourceInfo('Fallback Mock Engine');
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic Infinite Scroll Back-Fetch
  const handleLoadMoreHistory = async () => {
    if (isLoadingHistoryRef.current || allCandles.length === 0) return;

    const oldestCandle = allCandles[0];
    if (!oldestCandle || !oldestCandle.time) return;

    isLoadingHistoryRef.current = true;
    setIsHistoryLoading(true);

    try {
      const endTimeMs = (oldestCandle.time * 1000) - 1;
      let newCandles = [];

      if (symbol === 'BTC/USDT' || symbol === 'ETH/USDT' || symbol === 'SOL/USDT') {
        const binanceSymbol = symbol.replace('/', '');
        const res = await fetchBinanceKlines(binanceSymbol, interval, 10000, endTimeMs);
        newCandles = res.candles || [];
      } else {
        newCandles = generateMockCandles(symbol, 5000);
      }

      if (newCandles.length > 0) {
        setAllCandles((prev) => {
          const map = new Map();
          [...newCandles, ...prev].forEach((c) => map.set(c.time, c));
          return Array.from(map.values()).sort((a, b) => a.time - b.time);
        });
        addToast(`📜 Deep History: Loaded +${newCandles.length} candles (${interval})`, 'info');
      }
    } catch (err) {
      console.warn('Failed to load deeper historical candles:', err.message);
    } finally {
      setIsHistoryLoading(false);
      setTimeout(() => {
        isLoadingHistoryRef.current = false;
      }, 1200);
    }
  };

  // Load data on symbol or interval change
  useEffect(() => {
    loadChartData();
  }, [symbol, interval]);

  // When candles update, sync replay index and run Machine Learning prediction
  useEffect(() => {
    if (allCandles.length > 0) {
      setReplayIndex(allCandles.length - 1);

      async function runMl() {
        setIsMlLoading(true);
        const res = await fetchMLPrediction(allCandles, symbol, interval);
        if (res && res.success) {
          setMlData(res);
        }
        setIsMlLoading(false);
      }
      runMl();
    }
  }, [allCandles, symbol, interval]);

  const handleApplyAiTrade = ({ stopLossPrice, targetPrice }) => {
    if (stopLossPrice) {
      setIsSlEnabled(true);
      setPendingSl(stopLossPrice.toString());
    }
    if (targetPrice) {
      setIsTpEnabled(true);
      setPendingTp(targetPrice.toString());
    }
    addToast(`🤖 AI Targets applied: SL @ $${stopLossPrice}, TP @ $${targetPrice}`, 'success');
    soundEngine.playOrderPlaced();
  };

  // Real-Clock Aligned Candle Close Countdown Timer
  useEffect(() => {
    const updateCountdown = () => {
      const remainingSecs = calculateCandleRemainingSeconds(interval);
      setCandleCountdown(formatCountdown(remainingSecs));
    };

    updateCountdown();
    const countdownTimer = setInterval(updateCountdown, 1000);

    return () => clearInterval(countdownTimer);
  }, [interval]);

  // Continuous High-Speed Live Ticker Stream (200ms ticker animation loop)
  useEffect(() => {
    if (isReplayMode || isSelectingReplayCut || isLoading) return;

    let wsManager = null;
    let tickTimer = null;

    if (symbol === 'BTC/USDT' || symbol === 'ETH/USDT' || symbol === 'SOL/USDT') {
      const binanceSymbol = symbol.replace('/', '');
      wsManager = new BinanceWebSocketManager(binanceSymbol, interval, (liveBar) => {
        setLatestTickBar(liveBar);
        checkRiskTriggers(liveBar, activeTradeRef.current);
      });
      wsManager.connect();
    }

    tickTimer = setInterval(() => {
      const currentArr = allCandlesRef.current;
      if (!currentArr || currentArr.length === 0) return;

      const lastBar = currentArr[currentArr.length - 1];
      const volatilityFactor = symbol === 'XAU/USD' ? 0.0004 : 0.0007;
      const pctChange = (Math.random() - 0.498) * volatilityFactor;
      const newClose = Number((lastBar.close * (1 + pctChange)).toFixed(2));
      const newHigh = Number(Math.max(lastBar.high, newClose).toFixed(2));
      const newLow = Number(Math.min(lastBar.low, newClose).toFixed(2));
      const newVol = (lastBar.volume || 100) + Math.floor(Math.random() * 2);

      const updatedTickBar = {
        ...lastBar,
        high: newHigh,
        low: newLow,
        close: newClose,
        volume: newVol
      };

      setLatestTickBar(updatedTickBar);
      currentArr[currentArr.length - 1] = updatedTickBar;
      checkRiskTriggers(updatedTickBar, activeTradeRef.current);
    }, 200);

    return () => {
      if (wsManager) wsManager.close();
      if (tickTimer) clearInterval(tickTimer);
    };
  }, [symbol, interval, isReplayMode, isLoading]);

  const chart2ReplayIndex = Math.min(allCandles.length - 1, Math.max(0, (replayIndex + 1) * 4 - 1));

  const visibleCandles = isReplayMode 
    ? allCandles.slice(0, Math.max(1, replayIndex + 1))
    : allCandles;

  const visibleCandlesChart2 = isReplayMode
    ? allCandles.slice(0, Math.max(1, chart2ReplayIndex + 1))
    : allCandles;

  const currentCandle = latestTickBar || (visibleCandles.length > 0 ? visibleCandles[visibleCandles.length - 1] : null);
  const currentPrice = currentCandle ? currentCandle.close : 0;

  useEffect(() => {
    if (currentPrice) {
      if (isSlEnabled && (!pendingSl || pendingSl === '')) {
        setPendingSl((currentPrice * 0.985).toFixed(2));
      }
      if (isTpEnabled && (!pendingTp || pendingTp === '')) {
        setPendingTp((currentPrice * 1.03).toFixed(2));
      }
    }
  }, [currentPrice, isSlEnabled, isTpEnabled]);

  const handleToggleSlEnabled = () => {
    setIsSlEnabled((prev) => {
      const next = !prev;
      if (next && currentPrice && (!pendingSl || pendingSl === '')) {
        setPendingSl((currentPrice * 0.985).toFixed(2));
      }
      return next;
    });
  };

  const handleToggleTpEnabled = () => {
    setIsTpEnabled((prev) => {
      const next = !prev;
      if (next && currentPrice && (!pendingTp || pendingTp === '')) {
        setPendingTp((currentPrice * 1.03).toFixed(2));
      }
      return next;
    });
  };

  let priceChange24h = 0;
  let high24h = 0;
  let low24h = 0;
  let volume24h = 0;

  if (visibleCandles.length > 0) {
    const periodBars = visibleCandles.slice(-24);
    const firstClose = periodBars[0].open;
    const lastClose = periodBars[periodBars.length - 1].close;
    priceChange24h = ((lastClose - firstClose) / firstClose) * 100;
    
    high24h = Math.max(...periodBars.map(b => b.high));
    low24h = Math.min(...periodBars.map(b => b.low));
    volume24h = periodBars.reduce((acc, b) => acc + (b.volume || 0), 0);
  }

  const checkRiskTriggers = (bar, trade) => {
    if (!trade || !bar) return;

    const isLong = trade.side === 'BUY';

    if (isLong) {
      if (trade.stopLoss && bar.low <= trade.stopLoss) {
        soundEngine.playSlLoss();
        addToast(`Stop Loss Hit @ $${trade.stopLoss}`, 'warning');
        handleClosePosition(trade.stopLoss, 'Stop Loss Hit');
        return;
      }
      if (trade.takeProfit && bar.high >= trade.takeProfit) {
        soundEngine.playTpWin();
        addToast(`Take Profit Hit @ $${trade.takeProfit}! Target Reached 🎉`, 'success');
        handleClosePosition(trade.takeProfit, 'Take Profit Hit');
        return;
      }
    } else {
      if (trade.stopLoss && bar.high >= trade.stopLoss) {
        soundEngine.playSlLoss();
        addToast(`Stop Loss Hit @ $${trade.stopLoss}`, 'warning');
        handleClosePosition(trade.stopLoss, 'Stop Loss Hit');
        return;
      }
      if (trade.takeProfit && bar.low <= trade.takeProfit) {
        soundEngine.playTpWin();
        addToast(`Take Profit Hit @ $${trade.takeProfit}! Target Reached 🎉`, 'success');
        handleClosePosition(trade.takeProfit, 'Take Profit Hit');
        return;
      }
    }
  };

  useEffect(() => {
    let timer = null;
    if (isPlaying && isReplayMode && !isSelectingReplayCut) {
      timer = setInterval(() => {
        setReplayIndex((prev) => {
          if (prev >= allCandles.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          const nextIdx = prev + 1;
          const nextBar = allCandles[nextIdx];
          checkRiskTriggers(nextBar, activeTradeRef.current);
          return nextIdx;
        });
      }, 1000 / playbackSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, isReplayMode, playbackSpeed, allCandles]);

  const handleExecuteTrade = (orderData) => {
    const newTrade = {
      id: `trade_${Date.now()}`,
      ...orderData,
      timestamp: Date.now(),
    };
    setActiveTrade(newTrade);
    soundEngine.playOrderPlaced();
    addToast(`${orderData.side} Order Executed @ $${orderData.entryPrice.toFixed(2)}`, 'success');

    const audit = auditTradeSetup({
      orderData: newTrade,
      candles: visibleCandles,
      recentLossTimestamp,
      mlData
    });
    setAuditResult(audit);
    if (audit.flags.length > 0) {
      setIsCoachModalOpen(true);
    }

    fetch('/api/wallet/position', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeTrade: newTrade })
    }).catch(e => console.warn('Failed to sync position with backend:', e.message));
  };

  useHotkeys({
    onBuy: () => {
      if (!activeTrade && currentPrice) {
        handleExecuteTrade({
          side: 'BUY',
          symbol,
          entryPrice: currentPrice,
          sizeUsd: 1000,
          leverage: 10,
          quantity: Number((10000 / currentPrice).toFixed(4)),
          stopLoss: isSlEnabled && pendingSl ? parseFloat(pendingSl) : null,
          takeProfit: isTpEnabled && pendingTp ? parseFloat(pendingTp) : null,
        });
      }
    },
    onSell: () => {
      if (!activeTrade && currentPrice) {
        handleExecuteTrade({
          side: 'SELL',
          symbol,
          entryPrice: currentPrice,
          sizeUsd: 1000,
          leverage: 10,
          quantity: Number((10000 / currentPrice).toFixed(4)),
          stopLoss: isSlEnabled && pendingSl ? parseFloat(pendingSl) : null,
          takeProfit: isTpEnabled && pendingTp ? parseFloat(pendingTp) : null,
        });
      }
    },
    onReplayStep: () => {
      if (isReplayMode && replayIndex < allCandles.length - 1) {
        const nextIdx = replayIndex + 1;
        setReplayIndex(nextIdx);
        checkRiskTriggers(allCandles[nextIdx], activeTradeRef.current);
      }
    },
    onReplayStepBack: () => {
      if (isReplayMode && replayIndex > 0) {
        setReplayIndex(replayIndex - 1);
      }
    }
  });

  const voiceAssistant = useVoiceAssistant({
    onBuy: () => {
      if (!activeTradeRef.current && currentPrice) {
        handleExecuteTrade({
          side: 'BUY',
          symbol,
          entryPrice: currentPrice,
          sizeUsd: 1000,
          leverage: 10,
          quantity: Number((10000 / currentPrice).toFixed(4)),
          stopLoss: isSlEnabled && pendingSl ? parseFloat(pendingSl) : null,
          takeProfit: isTpEnabled && pendingTp ? parseFloat(pendingTp) : null,
        });
      }
    },
    onSell: () => {
      if (!activeTradeRef.current && currentPrice) {
        handleExecuteTrade({
          side: 'SELL',
          symbol,
          entryPrice: currentPrice,
          sizeUsd: 1000,
          leverage: 10,
          quantity: Number((10000 / currentPrice).toFixed(4)),
          stopLoss: isSlEnabled && pendingSl ? parseFloat(pendingSl) : null,
          takeProfit: isTpEnabled && pendingTp ? parseFloat(pendingTp) : null,
        });
      }
    },
    onStepNext: () => {
      if (replayIndex < allCandles.length - 1) {
        setReplayIndex(prev => prev + 1);
      }
    },
    onStepPrev: () => {
      if (replayIndex > 0) setReplayIndex(prev => prev - 1);
    },
    onTogglePlay: () => setIsPlaying(prev => !prev),
    onOpenMonteCarlo: () => setIsMonteCarloOpen(true),
    onOpenReport: () => setIsReportOpen(true),
    onToggleAi: () => handleToggleIndicator('aiMl'),
    onToggleFullscreen: () => {
      const chartCard = document.querySelector('.bg-slate-950.overflow-hidden');
      if (chartCard) {
        if (!document.fullscreenElement) {
          chartCard.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
      }
    },
    addToast
  });

  const handleClosePosition = (exitPriceOverride = null, exitReason = 'Manual Exit') => {
    const tradeToClose = activeTradeRef.current;
    if (!tradeToClose) return;

    const exitPrice = exitPriceOverride !== null ? exitPriceOverride : currentPrice;
    const isLong = tradeToClose.side === 'BUY';
    const entryPrice = tradeToClose.entryPrice;
    const priceDiff = isLong ? (exitPrice - entryPrice) : (entryPrice - exitPrice);

    const pnlUsd = priceDiff * tradeToClose.quantity;
    const pnlPct = (priceDiff / entryPrice) * 100 * tradeToClose.leverage;

    setWallet((prev) => ({
      ...prev,
      balance: prev.balance + pnlUsd,
    }));

    if (pnlUsd < 0) {
      setRecentLossTimestamp(Date.now());
    }

    const closedTrade = {
      ...tradeToClose,
      exitPrice,
      pnlUsd,
      pnlPct,
      exitReason,
      timestamp: Date.now(),
    };

    setTradeHistory((prev) => [...prev, closedTrade]);
    setActiveTrade(null);
    soundEngine.playOrderPlaced();
    addToast(`Position Closed (${pnlUsd >= 0 ? '+' : ''}$${pnlUsd.toFixed(2)}) via ${exitReason}`, pnlUsd >= 0 ? 'success' : 'warning');

    fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trade: closedTrade })
    }).catch(e => console.warn('Failed to sync closed trade with backend:', e.message));

    fetch('/api/wallet/position', { method: 'DELETE' }).catch(e => console.warn('Failed to delete position on backend:', e.message));
  };

  const handleUpdateSl = (val) => {
    const strVal = val.toString();
    setPendingSl(strVal);
    if (activeTrade) {
      setActiveTrade((prev) => prev ? ({ ...prev, stopLoss: parseFloat(val) }) : null);
    }
  };

  const handleUpdateTp = (val) => {
    const strVal = val.toString();
    setPendingTp(strVal);
    if (activeTrade) {
      setActiveTrade((prev) => prev ? ({ ...prev, takeProfit: parseFloat(val) }) : null);
    }
  };

  const handleResetAccount = () => {
    if (window.confirm('Reset Virtual Wallet balance to $10,000.00 and clear trade history?')) {
      setWallet({ startingBalance: 10000.00, balance: 10000.00 });
      setActiveTrade(null);
      setTradeHistory([]);

      fetch('/api/wallet/reset', { method: 'POST' }).catch(e => console.warn('Failed to reset backend wallet:', e.message));
      fetch('/api/trades', { method: 'DELETE' }).catch(e => console.warn('Failed to clear backend trades:', e.message));
    }
  };

  const handleToggleIndicator = (key) => {
    setActiveIndicators((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* TradingView Header Bar */}
      <Header
        symbol={symbol}
        onSymbolChange={(s) => {
          setSymbol(s);
          setActiveTrade(null);
        }}
        interval={interval}
        onIntervalChange={setInterval}
        onLoadChart={loadChartData}
        isLoading={isLoading}
        twelveDataKey={twelveDataKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        dataSourceInfo={dataSourceInfo}
        currentPrice={currentPrice}
        priceChange24h={priceChange24h}
        high24h={high24h}
        low24h={low24h}
        volume24h={volume24h}
        candleCountdown={candleCountdown}
        wallet={wallet}
        onResetAccount={handleResetAccount}
        activeIndicators={activeIndicators}
        onToggleIndicator={handleToggleIndicator}
        isSplitScreen={isSplitScreen}
        onToggleSplitScreen={() => setIsSplitScreen((prev) => !prev)}
        onOpenStrategyTester={() => setIsStrategyTesterOpen(true)}
        onOpenMonteCarlo={() => setIsMonteCarloOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        isVoiceListening={voiceAssistant.isListening}
        onToggleVoice={voiceAssistant.toggleListening}
        onOpenIndicatorsModal={() => setIsIndicatorsModalOpen(true)}
        onOpenChartSettings={() => setIsChartSettingsOpen(true)}
        chartType={chartType}
        onChangeChartType={setChartType}
      />

      {/* JARVIS Live AI Voice HUD Banner */}
      {voiceAssistant.isListening && (
        <div className="bg-slate-900/95 border-b border-rose-500/40 px-4 py-2 flex items-center justify-between text-xs font-mono text-rose-300 shadow-xl backdrop-blur-md animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="font-bold tracking-wider text-rose-400">🎙️ JARVIS AI VOICE ONLINE:</span>
            <span className="text-slate-200 italic font-medium">
              {voiceAssistant.lastCommand ? `Hearing: "${voiceAssistant.lastCommand}"` : 'Listening... Speak "Buy", "Sell", "Play", "Next", "Full Screen"'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={voiceAssistant.toggleListening}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
            >
              Mute JARVIS
            </button>
          </div>
        </div>
      )}

      {/* Replay Controls Bar */}
      <ReplayControls
        isReplayMode={isReplayMode}
        onToggleReplayMode={() => {
          const nextMode = !isReplayMode;
          setIsReplayMode(nextMode);
          setIsSelectingReplayCut(nextMode);
          setIsPlaying(false);
          if (!nextMode && allCandles.length > 0) {
            setReplayIndex(allCandles.length - 1);
          }
        }}
        isSelectingReplayCut={isSelectingReplayCut}
        onToggleSelectReplayCut={() => {
          setIsSelectingReplayCut((prev) => {
            const next = !prev;
            if (next) setIsPlaying(false);
            return next;
          });
        }}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onStepNext={() => {
          if (replayIndex < allCandles.length - 1) {
            const nextIdx = replayIndex + 1;
            setReplayIndex(nextIdx);
            checkRiskTriggers(allCandles[nextIdx], activeTradeRef.current);
          }
        }}
        onStepPrev={() => {
          if (replayIndex > 0) setReplayIndex(replayIndex - 1);
        }}
        onJumpToLatest={() => {
          setReplayIndex(allCandles.length - 1);
          setIsPlaying(false);
        }}
        replayIndex={replayIndex}
        totalCandles={allCandles.length}
        onScrubReplay={(idx) => {
          setReplayIndex(idx);
          setIsPlaying(false);
        }}
        playbackSpeed={playbackSpeed}
        onChangePlaybackSpeed={setPlaybackSpeed}
      />

      {/* Main Dashboard Layout Grid */}
      <main className="p-3 md:p-4 flex flex-col gap-4 w-full">
        
        {/* Top Performance Analytics Bar */}
        <AnalyticsSummary wallet={wallet} tradeHistory={tradeHistory} />

        {/* Dynamic Symbol Search & Watchlist Bar (Placed directly below AnalyticsSummary) */}
        <WatchlistSidebar
          currentSymbol={symbol}
          onSelectSymbol={(s) => {
            setSymbol(s);
            setActiveTrade(null);
          }}
          currentPrice={currentPrice}
          priceChange24h={priceChange24h}
        />

        {/* Core Trading Terminal Layout (Dynamic Flex Chart + Sidebar Dock) */}
        <div className="flex flex-col lg:flex-row gap-4 w-full items-start">
          
          {/* Main Chart Container (Fills remaining horizontal width) */}
          <div className="flex-1 min-w-0 flex flex-col gap-3 w-full">
            {noticeMsg && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs p-2.5 rounded-xl flex items-center justify-between">
                <span>⚠️ {noticeMsg}</span>
                <button onClick={() => setNoticeMsg('')} className="text-amber-400 hover:text-amber-200">✕</button>
              </div>
            )}

            {isSplitScreen ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                <div className="relative w-full">
                  <div className="absolute top-2 left-2 z-20 bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded border border-slate-700 text-[10px] text-cyan-400 font-bold uppercase tracking-wider shadow">
                    Chart 1 — {symbol} ({interval})
                  </div>
                  <TradingChart
                    candles={visibleCandles}
                    latestTickBar={latestTickBar}
                    activeTrade={activeTrade}
                    activeIndicators={activeIndicators}
                    onCrosshairPriceChange={setHoveredPriceData}
                    symbol={symbol}
                    interval={interval}
                    pendingSl={pendingSl}
                    pendingTp={pendingTp}
                    isSlEnabled={isSlEnabled}
                    isTpEnabled={isTpEnabled}
                    onUpdateSl={handleUpdateSl}
                    onUpdateTp={handleUpdateTp}
                    candleCountdown={candleCountdown}
                    mlMarkers={mlData?.markers || []}
                    isSelectingReplayCut={isSelectingReplayCut}
                    onSelectReplayCutIndex={handleSelectReplayCutIndex}
                    isReplayMode={isReplayMode}
                    onToggleReplayMode={() => setIsReplayMode((prev) => !prev)}
                    onToggleSelectReplayCut={() => {
                      setIsSelectingReplayCut((prev) => {
                        const next = !prev;
                        if (next) setIsPlaying(false);
                        return next;
                      });
                    }}
                    isPlaying={isPlaying}
                    onTogglePlay={() => setIsPlaying(!isPlaying)}
                    onStepNext={() => {
                      if (replayIndex < allCandles.length - 1) {
                        const nextIdx = replayIndex + 1;
                        setReplayIndex(nextIdx);
                        checkRiskTriggers(allCandles[nextIdx], activeTradeRef.current);
                      }
                    }}
                    onStepPrev={() => {
                      if (replayIndex > 0) setReplayIndex(replayIndex - 1);
                    }}
                    replayIndex={replayIndex}
                    totalCandles={allCandles.length}
                    playbackSpeed={playbackSpeed}
                    onChangePlaybackSpeed={setPlaybackSpeed}
                    onExecuteTrade={handleExecuteTrade}
                    onClosePosition={handleClosePosition}
                    mlData={mlData}
                    onToggleIndicator={handleToggleIndicator}
                    onLoadMoreHistory={handleLoadMoreHistory}
                    isHistoryLoading={isHistoryLoading}
                  />
                </div>
                <div className="relative w-full">
                  <div className="absolute top-2 left-2 z-20 bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded border border-slate-700 text-[10px] text-emerald-400 font-bold uppercase tracking-wider shadow">
                    Chart 2 — {symbol} (15m Multi-TF Synced)
                  </div>
                  <TradingChart
                    candles={visibleCandlesChart2}
                    latestTickBar={latestTickBar}
                    activeTrade={activeTrade}
                    activeIndicators={activeIndicators}
                    onCrosshairPriceChange={() => {}}
                    symbol={symbol}
                    interval="15m"
                    pendingSl={pendingSl}
                    pendingTp={pendingTp}
                    isSlEnabled={isSlEnabled}
                    isTpEnabled={isTpEnabled}
                    onUpdateSl={handleUpdateSl}
                    onUpdateTp={handleUpdateTp}
                    candleCountdown=""
                    mlMarkers={mlData?.markers || []}
                    isSelectingReplayCut={isSelectingReplayCut}
                    onSelectReplayCutIndex={handleSelectReplayCutIndex}
                    isReplayMode={isReplayMode}
                    onToggleReplayMode={() => setIsReplayMode((prev) => !prev)}
                    onToggleSelectReplayCut={() => {
                      setIsSelectingReplayCut((prev) => {
                        const next = !prev;
                        if (next) setIsPlaying(false);
                        return next;
                      });
                    }}
                    isPlaying={isPlaying}
                    onTogglePlay={() => setIsPlaying(!isPlaying)}
                    onStepNext={() => {
                      if (replayIndex < allCandles.length - 1) {
                        const nextIdx = replayIndex + 1;
                        setReplayIndex(nextIdx);
                        checkRiskTriggers(allCandles[nextIdx], activeTradeRef.current);
                      }
                    }}
                    onStepPrev={() => {
                      if (replayIndex > 0) setReplayIndex(replayIndex - 1);
                    }}
                    replayIndex={replayIndex}
                    totalCandles={allCandles.length}
                    playbackSpeed={playbackSpeed}
                    onChangePlaybackSpeed={setPlaybackSpeed}
                    onExecuteTrade={handleExecuteTrade}
                    onClosePosition={handleClosePosition}
                    mlData={mlData}
                    onToggleIndicator={handleToggleIndicator}
                    onLoadMoreHistory={handleLoadMoreHistory}
                    isHistoryLoading={isHistoryLoading}
                  />
                </div>
              </div>
            ) : (
              <div className="relative w-full">
                <TradingChart
                  candles={visibleCandles}
                  latestTickBar={latestTickBar}
                  activeTrade={activeTrade}
                  activeIndicators={activeIndicators}
                  onCrosshairPriceChange={setHoveredPriceData}
                  symbol={symbol}
                  interval={interval}
                  pendingSl={pendingSl}
                  pendingTp={pendingTp}
                  isSlEnabled={isSlEnabled}
                  isTpEnabled={isTpEnabled}
                  onUpdateSl={handleUpdateSl}
                  onUpdateTp={handleUpdateTp}
                  candleCountdown={candleCountdown}
                  mlMarkers={mlData?.markers || []}
                  isSelectingReplayCut={isSelectingReplayCut}
                  onSelectReplayCutIndex={handleSelectReplayCutIndex}
                  isReplayMode={isReplayMode}
                  onToggleReplayMode={() => setIsReplayMode((prev) => !prev)}
                  onToggleSelectReplayCut={() => {
                    setIsSelectingReplayCut((prev) => {
                      const next = !prev;
                      if (next) setIsPlaying(false);
                      return next;
                    });
                  }}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  onStepNext={() => {
                    if (replayIndex < allCandles.length - 1) {
                      const nextIdx = replayIndex + 1;
                      setReplayIndex(nextIdx);
                      checkRiskTriggers(allCandles[nextIdx], activeTradeRef.current);
                    }
                  }}
                  onStepPrev={() => {
                    if (replayIndex > 0) setReplayIndex(replayIndex - 1);
                  }}
                  replayIndex={replayIndex}
                  totalCandles={allCandles.length}
                  playbackSpeed={playbackSpeed}
                  onChangePlaybackSpeed={setPlaybackSpeed}
                  onExecuteTrade={handleExecuteTrade}
                  onClosePosition={handleClosePosition}
                  mlData={mlData}
                  onToggleIndicator={handleToggleIndicator}
                  onLoadMoreHistory={handleLoadMoreHistory}
                />
              </div>
            )}

            {/* Trade Logs Panel - Placed directly under chart to utilize full terminal space */}
            <div className="w-full mt-1">
              <TradeHistory
                tradeHistory={tradeHistory}
                onClearHistory={() => setTradeHistory([])}
              />
            </div>
          </div>

          {/* Right Sidebar (Execution Panel, Active Positions, AI ML Signals & Watchlist) */}
          <div className="w-full lg:w-[350px] xl:w-[380px] shrink-0 flex flex-col gap-2.5 font-mono">
            
            {/* 1. Open Position Data (Always visible at top when active) */}
            <ActivePositionCard
              activeTrade={activeTrade}
              currentPrice={currentPrice}
              onClosePosition={() => handleClosePosition(null, 'Manual Exit')}
            />

            {/* 2. TradingView Pro Style Tab Switcher */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono select-none shadow-sm">
              <button
                type="button"
                onClick={() => setRightSidebarTab('orders')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  rightSidebarTab === 'orders'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Trade</span>
              </button>

              <button
                type="button"
                onClick={() => setRightSidebarTab('book')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  rightSidebarTab === 'book'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Order Book</span>
              </button>

              <button
                type="button"
                onClick={() => setRightSidebarTab('ai')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  rightSidebarTab === 'ai'
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>AI Signals</span>
              </button>
            </div>

            {/* 3. Tab Content */}
            {rightSidebarTab === 'orders' && (
              <OrderPanel
                currentPrice={currentPrice}
                symbol={symbol}
                wallet={wallet}
                activeTrade={activeTrade}
                onExecuteTrade={handleExecuteTrade}
                stopLossPrice={pendingSl}
                onStopLossChange={handleUpdateSl}
                isSlEnabled={isSlEnabled}
                onToggleSlEnabled={handleToggleSlEnabled}
                takeProfitPrice={pendingTp}
                onTakeProfitChange={handleUpdateTp}
                isTpEnabled={isTpEnabled}
                onToggleTpEnabled={handleToggleTpEnabled}
                candles={allCandles}
                smcData={smcData}
                mlData={mlData}
                onApplyAiTrade={handleApplyAiTrade}
              />
            )}

            {rightSidebarTab === 'book' && (
              <OrderBook
                currentPrice={currentPrice}
                symbol={symbol}
              />
            )}

            {rightSidebarTab === 'ai' && (
              <div className="flex flex-col gap-3">
                <MLSignalCard
                  mlData={mlData}
                  isLoading={isMlLoading}
                  onApplyAiTrade={handleApplyAiTrade}
                />
                <AiConfluenceMatrix
                  candles={allCandles}
                  smcData={smcData}
                  mlData={mlData}
                  symbol={symbol}
                  onApplyAiTrade={handleApplyAiTrade}
                />
              </div>
            )}

          </div>

        </div>

      </main>

      {/* TradingView fx Indicators Library Modal */}
      <IndicatorsModal
        isOpen={isIndicatorsModalOpen}
        onClose={() => setIsIndicatorsModalOpen(false)}
        activeIndicators={activeIndicators}
        onToggleIndicator={handleToggleIndicator}
      />

      {/* TradingView Chart Properties & Theme Settings Modal */}
      <ChartSettingsModal
        isOpen={isChartSettingsOpen}
        onClose={() => setIsChartSettingsOpen(false)}
        bgColor={chartBgColor}
        onChangeBgColor={setChartBgColor}
        gridStyle={chartGridStyle}
        onChangeGridStyle={setChartGridStyle}
        chartType={chartType}
        onChangeChartType={setChartType}
      />

      {/* Twelve Data API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={twelveDataKey}
        onSaveApiKey={handleSaveApiKey}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onCloseToast={removeToast} />

      {/* Auto Strategy Tester Modal */}
      <StrategyTester
        candles={allCandles}
        isOpen={isStrategyTesterOpen}
        onClose={() => setIsStrategyTesterOpen(false)}
      />

      {/* AI Trade Coach & Behavioral Audit Modal */}
      <AICoachModal
        isOpen={isCoachModalOpen}
        onClose={() => setIsCoachModalOpen(false)}
        auditResult={auditResult}
        trade={activeTrade}
      />

      {/* Monte Carlo 1,000-Run Risk Simulation Modal */}
      <MonteCarloModal
        isOpen={isMonteCarloOpen}
        onClose={() => setIsMonteCarloOpen(false)}
        tradeHistory={tradeHistory}
        startingBalance={wallet.startingBalance}
      />

      {/* Institutional Backtest Performance Audit Report Modal */}
      <BacktestReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        tradeHistory={tradeHistory}
        wallet={wallet}
        symbol={symbol}
        interval={interval}
      />
    </div>
  );
}

