import React, { useState, useMemo, useEffect } from "react";
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  ShieldCheck, 
  BrainCircuit, 
  Loader2,
  ChevronRight,
  ChevronLeft,
  Clock,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  LineChart as LineChartIcon,
  Search,
  Target,
  Settings,
  Sparkles,
  Eye,
  EyeOff,
  Layers,
  BarChart3,
  Waves
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAssetHistory, useMarketData, Timeframe, useCOTData, useOrderFlow, useIntermarketData, FootprintCandle } from "../services/marketService";
import { getSentiment, getDeepMarketAnalysis, Sentiment } from "../services/geminiService";
import { NexusSMCChart } from "./NexusSMCChart";
import { FolderHeart, Thermometer, Radio, Timer, Binary, Landmark } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from "recharts";

function FootprintChart({ candles }: { candles: FootprintCandle[] }) {
  if (!candles || candles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[10px] font-black uppercase tracking-widest text-on-surface/20">
        Waiting for Neural Order Pulse...
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 h-full overflow-x-auto no-scrollbar pb-2 scroll-smooth px-2">
      {candles.map((candle, i) => {
        const sortedLevels = [...candle.levels].sort((a, b) => b.price - a.price);
        const maxLevelVol = Math.max(...candle.levels.map(l => l.buyVol + l.sellVol)) || 1;
        const candleDelta = candle.totalDelta;
        const isBullish = candleDelta > 0;

        return (
          <div key={i} className={`flex-shrink-0 w-28 flex flex-col bg-surface-container-low/40 border rounded-xl overflow-hidden group transition-all duration-300 ${isBullish ? 'hover:border-secondary-container/40' : 'hover:border-tertiary-container/40'} border-outline-variant/10 shadow-sm`}>
            {/* Header: Time & CVD */}
            <div className="p-2 border-b border-outline-variant/5 bg-surface-container-high/40 flex justify-between items-center">
              <span className="text-[7px] font-mono text-on-surface/40 uppercase font-black">{candle.time}</span>
              <div className={`px-1.5 py-0.5 rounded text-[6px] font-black tabular-nums transition-colors ${isBullish ? 'bg-secondary-container/10 text-secondary-container' : 'bg-tertiary-container/10 text-tertiary-container'}`}>
                CVD: {candle.cvd.toFixed(1)}
              </div>
            </div>

            {/* Core Footprint Body */}
            <div className="flex-1 flex flex-col gap-[1px] p-1 bg-surface-container-lowest/20">
              {sortedLevels.slice(0, 16).map((level, li) => {
                const levelVol = level.buyVol + level.sellVol;
                const delta = level.delta;
                const volumeIntensity = (levelVol / maxLevelVol) * 100;
                const deltaIntensity = Math.min(1, Math.abs(delta) / (levelVol || 1));
                const isPositiveDelta = delta > 0;

                return (
                  <div key={li} className={`h-[6.25%] flex items-center relative group/level ${level.isPOC ? 'bg-primary/5 ring-1 ring-primary/20 z-10' : ''}`}>
                    {/* Price Label */}
                    <div className={`absolute left-1/2 -translate-x-1/2 text-[5px] font-mono z-20 transition-opacity flex items-center gap-1 ${level.isPOC ? 'opacity-100 text-primary font-black' : 'opacity-0 group-hover/level:opacity-100 text-on-surface/30'}`}>
                       <span>${level.price.toFixed(1)}</span>
                    </div>

                    {/* Buy Side */}
                    <div className="flex-1 h-full flex flex-row-reverse items-center pr-1 relative overflow-hidden">
                      <div 
                        className="absolute right-0 h-full bg-secondary-container transition-all duration-500" 
                        style={{ width: `${(level.buyVol / maxLevelVol) * 100}%`, opacity: 0.15 + (volumeIntensity / 200) }} 
                      />
                      <span className="text-[6px] font-mono text-secondary-container font-black relative z-10 tabular-nums">{Math.round(level.buyVol)}</span>
                    </div>

                    {/* Separator / Delta Indicator */}
                    <div className="w-[2px] h-full flex flex-col justify-center bg-outline-variant/10">
                       <div className={`w-full transition-all duration-500 ${isPositiveDelta ? 'bg-secondary-container' : 'bg-tertiary-container'}`} style={{ height: `${deltaIntensity * 100}%` }} />
                    </div>

                    {/* Sell Side */}
                    <div className="flex-1 h-full flex items-center pl-1 relative overflow-hidden">
                      <div 
                        className="absolute left-0 h-full bg-tertiary-container transition-all duration-500" 
                        style={{ width: `${(level.sellVol / maxLevelVol) * 100}%`, opacity: 0.15 + (volumeIntensity / 200) }} 
                      />
                      <span className="text-[6px] font-mono text-tertiary-container font-black relative z-10 tabular-nums">{Math.round(level.sellVol)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer: Stats */}
            <div className="p-2 border-t border-outline-variant/10 bg-surface-container-high/40 space-y-1">
              <div className="flex justify-between items-center">
                 <span className="text-[7px] font-black uppercase text-on-surface/30">Total Vol</span>
                 <span className="text-[8px] font-mono font-bold text-on-surface/80">{Math.round(candle.totalVolume)}</span>
              </div>
              <div className="h-[1px] w-full bg-outline-variant/5" />
              <div className="flex justify-between items-center">
                 <span className="text-[7px] font-black uppercase text-on-surface/30">Net Delta</span>
                 <div className={`flex items-center gap-1 ${isBullish ? 'text-secondary-container' : 'text-tertiary-container'}`}>
                    <span className="text-[8px] font-mono font-black">{isBullish ? '+' : ''}{Math.round(candle.totalDelta)}</span>
                    {isBullish ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                 </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface AssetDetailViewProps {
  assetId: string;
  onClose: () => void;
  onNavigateToHistory: (assetId: string) => void;
}

export function AssetDetailView({ assetId, onClose, onNavigateToHistory }: AssetDetailViewProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1m");
  const [comparisonAssetId, setComparisonAssetId] = useState<string | null>(null);
  const [orderSize, setOrderSize] = useState<number>(0.01);
  const [leverage, setLeverage] = useState<number>(10);
  const [riskCapital, setRiskCapital] = useState<number>(500);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [tpMode, setTpMode] = useState<'pips' | 'pct' | 'target'>('pips');
  const [slMode, setSlMode] = useState<'pips' | 'pct' | 'target'>('pips');
  const [tpValue, setTpValue] = useState<number>(20); // default 20 pips
  const [slValue, setSlValue] = useState<number>(10); // default 10 pips
  const [showTradeSummary, setShowTradeSummary] = useState(false);
  const [hoveredOrder, setHoveredOrder] = useState<{ price: number; size: number; side: 'buy' | 'sell' } | null>(null);
  const [zoomRange, setZoomRange] = useState({ start: 0, end: 100 });
  const [isPanning, setIsPanning] = useState(false);
  const [activeOverlays, setActiveOverlays] = useState<string[]>(['smc', 'liquidity', 'fvg', 'volume', 'killzones']);
  const [macroContext, setMacroContext] = useState<string>("Neutral");
  const [showOpsHub, setShowOpsHub] = useState(false);
  const [showAISidebar, setShowAISidebar] = useState(false);
  const [aiThesisType, setAiThesisType] = useState<'quick' | 'full'>('quick');
  const [aiThesis, setAiThesis] = useState<string>("");
  const [isGeneratingThesis, setIsGeneratingThesis] = useState(false);
  const [thesisCooldown, setThesisCooldown] = useState(0);
  const [orderFlowMode, setOrderFlowMode] = useState<'aggregated' | 'footprint'>('footprint');

  useEffect(() => {
    if (thesisCooldown > 0) {
      const timer = setTimeout(() => setThesisCooldown(thesisCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [thesisCooldown]);
  const [portfolioTab, setPortfolioTab] = useState<'risk' | 'vaR'>('risk');
  const [showOrderFlow, setShowOrderFlow] = useState(false);
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);
  
  const history = useAssetHistory(assetId, timeframe, 100);
  const comparisonHistory = useAssetHistory(comparisonAssetId || "BTC/USDT", timeframe, 100);
  const { footprints, latestCVD } = useOrderFlow(assetId, timeframe);
  const { cotData, loading: loadingCOT } = useCOTData(assetId);
  const { intermarket, loading: loadingIntermarket } = useIntermarketData();
  const { data: marketData, orderBooks } = useMarketData();
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [loadingSentiment, setLoadingSentiment] = useState(false);
  const [isExecutionOpen, setIsExecutionOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState<'buy' | 'sell' | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<'buy' | 'sell' | null>(null);

  const assetData = marketData.find(a => a.id === assetId);
  const orderBook = orderBooks[assetId];

  const maxOrderSize = useMemo(() => {
    if (!orderBook) return 0;
    const allOrders = [...(orderBook.bids || []), ...(orderBook.asks || [])];
    return Math.max(...allOrders.map(o => o[1]), 0.0001);
  }, [orderBook]);

  const mockSignals = useMemo(() => [
    { id: assetId, type: "BULLISH DIVERGENCE", confidence: 88, price: parseFloat(assetData?.price || "0") * 1.02 },
    { id: "ETH/USDT", type: "VOLATILITY SPIKE", confidence: 72, price: 2345.50 },
    { id: "XAU/USD", type: "LIQUIDITY GAP", confidence: 94, price: 2150.20 }
  ], [assetId, assetData]);

  const visibleHistory = useMemo(() => {
    if (history.length === 0) return [];
    const s = Math.max(0, Math.floor((zoomRange.start / 100) * history.length));
    const e = Math.min(history.length, Math.ceil((zoomRange.end / 100) * history.length));
    return history.slice(s, e);
  }, [history, zoomRange]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    const delta = e.deltaY * zoomSpeed;
    
    setZoomRange(prev => {
      const range = prev.end - prev.start;
      const newRange = Math.max(2, Math.min(100, range * (1 + delta))); // Allowing deeper zoom to 2%
      
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const mouseRelativeX = offsetX / rect.width;
      
      const mouseDataPoint = prev.start + mouseRelativeX * range;
      
      let nextStart = mouseDataPoint - mouseRelativeX * newRange;
      let nextEnd = mouseDataPoint + (1 - mouseRelativeX) * newRange;
      
      if (nextStart < 0) {
        nextEnd -= nextStart;
        nextStart = 0;
      }
      if (nextEnd > 100) {
        nextStart -= (nextEnd - 100);
        nextEnd = 100;
      }
      
      return { start: Math.max(0, nextStart), end: Math.min(100, nextEnd) };
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    
    const panSpeed = 0.5; // High precision panning
    const deltaX = e.movementX;
    
    setZoomRange(prev => {
      const range = prev.end - prev.start;
      // Convert pixel delta to percentage of visible range
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const percentageDelta = (deltaX / rect.width) * range * panSpeed;
      
      let nextStart = prev.start - percentageDelta;
      let nextEnd = prev.end - percentageDelta;
      
      if (nextStart < 0) {
        nextEnd -= nextStart;
        nextStart = 0;
      }
      if (nextEnd > 100) {
        nextStart -= (nextEnd - 100);
        nextEnd = 100;
      }
      
      return { start: nextStart, end: nextEnd };
    });
  };

  const volatility = useMemo(() => {
    if (history.length < 10) return 0;
    const slices = history.slice(-10).map(h => h.price);
    const mean = slices.reduce((a, b) => a + b, 0) / 10;
    const variance = slices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 10;
    const sd = Math.sqrt(variance);
    const currentPrice = assetData ? parseFloat(assetData.price) : mean;
    return (sd / currentPrice) * 10000; // Volatility in Basis Points
  }, [history, assetData]);

  const handleExecution = (type: 'buy' | 'sell') => {
    setShowTradeSummary(true);
    setIsExecuting(type);
  };

  const confirmExecution = () => {
    // Keep isExecuting state for animation, but close the summary and proceed
    setShowTradeSummary(false);
    setTimeout(() => {
      setIsExecuting(null);
    }, 1500);
  };

  const fetchSentimentManual = async () => {
    if (!assetId || loadingSentiment) return;
    setLoadingSentiment(true);
    try {
      const res = await getSentiment(`${assetId} market status`, "Detailed analysis of current price action and institutional flow.");
      setSentiment(res);
    } catch (e) {
      console.error("Sentiment error:", e);
    } finally {
      setLoadingSentiment(false);
    }
  };

  const stats = useMemo(() => {
    if (history.length < 2) return null;
    const startPrice = history[0].price;
    const endPrice = history[history.length - 1].price;
    const high = Math.max(...history.map(h => h.price));
    const low = Math.min(...history.map(h => h.price));
    const change = ((endPrice - startPrice) / startPrice) * 100;
    return { high, low, change };
  }, [history]);

  const estimatedMargin = useMemo(() => {
    const price = parseFloat(assetData?.price || "0");
    if (!price || !orderSize || !leverage) return 0;
    return (price * orderSize) / leverage;
  }, [assetData?.price, orderSize, leverage]);

  const potentialPL = useMemo(() => {
    const price = parseFloat(assetData?.price || "0");
    if (!price || !orderSize || !leverage) return { tp: 0, sl: 0 };
    
    const calculateMove = (val: number, mode: 'pips' | 'pct' | 'target') => {
      if (mode === 'pips') return val * price * 0.0001;
      if (mode === 'pct') return price * (val / 100);
      return Math.abs(val - price);
    };

    const tpMove = calculateMove(tpValue, tpMode);
    const slMove = calculateMove(slValue, slMode);
    
    return {
      tp: (tpMove * orderSize) * leverage,
      sl: -(slMove * orderSize) * leverage
    };
  }, [assetData?.price, orderSize, leverage, tpValue, tpMode, slValue, slMode]);

  const sentimentTrendData = useMemo(() => {
    // Generate mock sentiment trend over last hour
    return Array.from({ length: 12 }).map((_, i) => ({
      time: `${i * 5}m`,
      val: 50 + (Math.random() * 40 - 20) + (sentiment === 'positive' ? 20 : sentiment === 'negative' ? -20 : 0)
    }));
  }, [sentiment]);

  const tradeSummary = useMemo(() => ({
    winRate: 64.2,
    totalPL: 1240.50,
    trades: 24,
    bestTrade: 450.20,
    history: Array.from({ length: 10 }).map((_, i) => ({
      t: i,
      pl: Math.random() * 500 - 100
    }))
  }), [assetId]);

  const smcMarkers = useMemo(() => {
    if (visibleHistory.length < 20) return [];
    const markers: { type: 'BOS' | 'CHoCH'; price: number; time: string; side: 'bull' | 'bear' }[] = [];
    
    // Simple Fractal/Swing High/Low detection and Breakout detection
    let lastHigh = visibleHistory[0].price;
    let lastLow = visibleHistory[0].price;
    let trend: 'bull' | 'bear' = visibleHistory[1].price > visibleHistory[0].price ? 'bull' : 'bear';

    for (let i = 2; i < visibleHistory.length; i++) {
      const curr = visibleHistory[i].price;
      const prev = visibleHistory[i-1].price;
      
      if (trend === 'bull' && curr > lastHigh) {
        markers.push({ type: 'BOS', price: lastHigh, time: visibleHistory[i].time, side: 'bull' });
        lastHigh = curr;
      } else if (trend === 'bull' && curr < lastLow * 0.995) { // Simple threshold for CHoCH
        markers.push({ type: 'CHoCH', price: lastLow, time: visibleHistory[i].time, side: 'bear' });
        trend = 'bear';
        lastLow = curr;
      } else if (trend === 'bear' && curr < lastLow) {
        markers.push({ type: 'BOS', price: lastLow, time: visibleHistory[i].time, side: 'bear' });
        lastLow = curr;
      } else if (trend === 'bear' && curr > lastHigh * 1.005) {
        markers.push({ type: 'CHoCH', price: lastHigh, time: visibleHistory[i].time, side: 'bull' });
        trend = 'bull';
        lastHigh = curr;
      }

      if (curr > lastHigh) lastHigh = curr;
      if (curr < lastLow) lastLow = curr;
    }
    return markers.slice(-8); // Limit markers for clarity
  }, [visibleHistory]);

  const fvgZones = useMemo(() => {
    if (visibleHistory.length < 5) return [];
    const zones: { top: number; bottom: number; timeStart: string; timeEnd: string; type: 'bull' | 'bear' }[] = [];
    
    // FVG detection: Gap between 1st candle high/low and 3rd candle low/high
    // Since our history is just {time, price}, we'll simulate candle ranges
    for (let i = 2; i < visibleHistory.length; i++) {
        const p1 = visibleHistory[i-2].price;
        const p2 = visibleHistory[i-1].price;
        const p3 = visibleHistory[i].price;

        const h1 = p1 * 1.001;
        const l1 = p1 * 0.999;
        const h3 = p3 * 1.001;
        const l3 = p3 * 0.999;

        if (l3 > h1) { // Bullish FVG
            zones.push({
                top: l3,
                bottom: h1,
                timeStart: visibleHistory[i-1].time,
                timeEnd: visibleHistory[visibleHistory.length-1].time,
                type: 'bull'
            });
        } else if (h3 < l1) { // Bearish FVG
            zones.push({
                top: l1,
                bottom: h3,
                timeStart: visibleHistory[i-1].time,
                timeEnd: visibleHistory[visibleHistory.length-1].time,
                type: 'bear'
            });
        }
    }
    return zones.slice(-4); // Only show recent ones
  }, [visibleHistory]);

  const liquidityPools = useMemo(() => {
    if (!stats || visibleHistory.length < 10) return [];
    // Identify major pivot points
    const pools: { price: number; type: 'buy-side' | 'sell-side'; strength: number }[] = [];
    
    const highs = visibleHistory.map(h => h.price);
    const maxVal = Math.max(...highs);
    const minVal = Math.min(...highs);

    pools.push({ price: maxVal * 1.001, type: 'buy-side', strength: 0.9 });
    pools.push({ price: minVal * 0.999, type: 'sell-side', strength: 0.85 });

    // Add some intermediate clusters
    const mid = (maxVal + minVal) / 2;
    pools.push({ price: mid * 1.02, type: 'buy-side', strength: 0.4 });
    pools.push({ price: mid * 0.98, type: 'sell-side', strength: 0.4 });

    return pools;
  }, [stats, visibleHistory]);

  const volumeProfile = useMemo(() => {
    if (visibleHistory.length === 0) return [];
    const bins = 24;
    const prices = visibleHistory.map(h => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;
    const step = range / bins;
    
    const profile = Array.from({ length: bins }).map((_, i) => {
        const binMin = min + (i * step);
        const binMax = binMin + step;
        const vol = visibleHistory.filter(h => h.price >= binMin && h.price < binMax).length;
        return { 
            low: binMin, 
            high: binMax, 
            vol, 
            isPOC: false,
            weight: 0 
        };
    });

    const maxVol = Math.max(...profile.map(p => p.vol));
    if (maxVol > 0) {
        const pocIndex = profile.findIndex(p => p.vol === maxVol);
        if (pocIndex !== -1) profile[pocIndex].isPOC = true;
        profile.forEach(p => p.weight = (p.vol / maxVol) * 100);
    }

    return profile;
  }, [visibleHistory]);

  const smcZones = useMemo(() => {
    if (visibleHistory.length < 20) return [];
    // Supply & Demand Zones
    return [
      { type: 'Supply', top: stats?.high || 1, bottom: (stats?.high || 1) * 0.998, start: visibleHistory[5]?.time, end: visibleHistory[visibleHistory.length - 1]?.time },
      { type: 'Demand', top: (stats?.low || 1) * 1.002, bottom: stats?.low || 1, start: visibleHistory[visibleHistory.length - 20]?.time, end: visibleHistory[visibleHistory.length - 1]?.time }
    ];
  }, [visibleHistory, stats]);

  const premiumDiscount = useMemo(() => {
    if (!stats) return null;
    const mid = (stats.high + stats.low) / 2;
    return { 
      premium: { top: stats.high, bottom: mid },
      equilibrium: mid,
      discount: { top: mid, bottom: stats.low }
    };
  }, [stats]);

  const killZones = useMemo(() => {
    if (visibleHistory.length < 20) return [];
    // Identify London/NY ranges in current dataset (Mocked positioning)
    return [
      { name: 'London Open', start: visibleHistory[visibleHistory.length - 80]?.time, end: visibleHistory[visibleHistory.length - 60]?.time, color: 'rgba(56, 189, 248, 0.05)' },
      { name: 'NY Open', start: visibleHistory[visibleHistory.length - 40]?.time, end: visibleHistory[visibleHistory.length - 20]?.time, color: 'rgba(244, 63, 94, 0.05)' }
    ].filter(k => k.start && k.end);
  }, [visibleHistory]);

  const portfolioVaR = useMemo(() => {
    // Simulated Monte Carlo VaR calculation
    const currentDrawdown = 2.45;
    const peakDrawdownLimit = 5.0;
    const dailyVaR = riskCapital * 0.015; // 1.5% VaR
    const worstCaseDrawdown = riskCapital * 0.08;
    
    return {
      dailyVaR,
      worstCaseDrawdown,
      currentDrawdown,
      peakDrawdownLimit,
      circuitBreakerTriggered: currentDrawdown >= peakDrawdownLimit
    };
  }, [riskCapital]);

  const volScore = useMemo(() => {
    if (history.length < 20) return 0;
    const prices = history.slice(-20).map(h => h.price);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    // Relative volatility as percentage of mean
    return Math.min(100, (stdDev / mean) * 2000); 
  }, [history]);

  const generateAIThesis = async () => {
    if (thesisCooldown > 0) return;
    setIsGeneratingThesis(true);
    setShowAISidebar(true);
    
    try {
      const cotString = cotData ? `Bull/Bear: ${cotData.commercials.net > 0 ? "Bull" : "Bear"} | Non-Comm Net: ${cotData.nonCommercials.net}` : "N/A";
      const intermarketString = intermarket ? `Yield10Y: ${intermarket.yield10Y} | DXY: ${intermarket.dxy}` : "N/A";
      
      const res = await getDeepMarketAnalysis(
        assetId, 
        assetData?.price || "Unknown", 
        [`${assetId} current structural trend: ${assetData?.trend}`, `CVD: ${latestCVD}`],
        cotString,
        intermarketString
      );
      setAiThesis(res);
    } catch (e) {
      setAiThesis("The AI Oracle is currently recalibrating. Strategic alignment maintained.");
    } finally {
      setIsGeneratingThesis(false);
      setThesisCooldown(60);
    }
  };

  const executeTrade = (type: 'buy' | 'sell') => {
    setIsExecuting(type);
    setShowConfirmModal(null);
    setTimeout(() => {
      setIsExecuting(null);
    }, 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-surface/95 backdrop-blur-xl overflow-hidden"
    >
      <motion.div
        initial={{ y: 20, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.95 }}
        className="w-full max-w-7xl h-full bg-surface-container-low border border-outline-variant/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <header className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest/50 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tighter text-on-surface">{assetId}</h2>
                <div className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${assetData?.trend === 'up' ? 'bg-secondary-container/10 text-secondary-container' : 'bg-tertiary-container/10 text-tertiary-container'}`}>
                  {assetData?.change || "0.00%"}
                </div>
              </div>
              <span className="text-xs text-on-surface/40 font-bold uppercase tracking-widest">Neural Market Detail · Real-Time</span>
            </div>
            
                <div className="hidden lg:flex items-center gap-8 pl-8 border-l border-outline-variant/10">
                  <div>
                    <p className="text-[10px] text-on-surface/40 uppercase font-bold tracking-widest mb-1">Spot Price</p>
                    <p className="text-lg font-mono font-bold text-primary">{assetData?.price || "---"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface/40 uppercase font-bold tracking-widest mb-1">Volatility Index</p>
                    <div className="flex items-center gap-2">
                       <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${volScore}%` }}
                            className={`h-full ${volScore > 50 ? 'bg-tertiary-container' : 'bg-primary'}`} 
                          />
                       </div>
                       <span className={`text-[10px] font-black font-mono ${volScore > 50 ? 'text-tertiary-container' : 'text-primary'}`}>{volScore.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="relative">
                  <button 
                    onClick={() => setShowTradeSummary(!showTradeSummary)}
                    className="flex flex-col items-start group"
                  >
                    <p className="text-[10px] text-on-surface/40 uppercase font-bold tracking-widest mb-1 group-hover:text-primary transition-colors">Trade History Summary</p>
                    <p className="text-sm font-bold text-on-surface border-b border-outline-variant/20 border-dotted group-hover:border-primary transition-colors flex items-center gap-1">
                      {tradeSummary.winRate}% Win Rate <ChevronDown className={`w-3 h-3 transition-transform ${showTradeSummary ? 'rotate-180' : ''}`} />
                    </p>
                  </button>

                  <AnimatePresence>
                    {showTradeSummary && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-12 left-0 z-50 w-64 bg-surface-container-highest border border-outline-variant/20 rounded-xl p-4 shadow-2xl backdrop-blur-xl"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Asset Intelligence Summary</h4>
                          <button onClick={() => onNavigateToHistory(assetId)} className="text-[8px] font-bold text-on-surface/40 hover:text-primary uppercase flex items-center gap-1">
                            Visit Audit Log <ArrowRightLeft className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-surface-container-medium p-2.5 rounded-lg border border-outline-variant/10">
                            <p className="text-[8px] font-bold text-on-surface/30 uppercase mb-1">Win Rate</p>
                            <p className="text-lg font-mono font-black text-secondary-container">{tradeSummary.winRate}%</p>
                          </div>
                          <div className="bg-surface-container-medium p-2.5 rounded-lg border border-outline-variant/10">
                            <p className="text-[8px] font-bold text-on-surface/30 uppercase mb-1">Total P/L</p>
                            <p className="text-lg font-mono font-black text-secondary-container">+${tradeSummary.totalPL}</p>
                          </div>
                          <div className="bg-surface-container-medium p-2.5 rounded-lg border border-outline-variant/10">
                            <p className="text-[8px] font-bold text-on-surface/30 uppercase mb-1">Total Trades</p>
                            <p className="text-lg font-mono font-black text-on-surface">{tradeSummary.trades}</p>
                          </div>
                          <div className="bg-surface-container-medium p-2.5 rounded-lg border border-outline-variant/10">
                            <p className="text-[8px] font-bold text-on-surface/30 uppercase mb-1">Best Trade</p>
                            <p className="text-lg font-mono font-black text-on-surface">{tradeSummary.bestTrade}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-outline-variant/10">
                          <p className="text-[8px] font-black uppercase tracking-widest text-on-surface/30 mb-3">Profitability Velocity</p>
                          <div className="h-16 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={tradeSummary.history}>
                                <defs>
                                  <linearGradient id="colorSummaryPL" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-secondary-container)" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="var(--color-secondary-container)" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <Area 
                                  type="monotone" 
                                  dataKey="pl" 
                                  stroke="var(--color-secondary-container)" 
                                  fill="url(#colorSummaryPL)" 
                                  strokeWidth={1.5}
                                  isAnimationActive={false}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Comparison Selection */}
            <div className="hidden sm:flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-sm border border-outline-variant/10">
              <LineChartIcon className="w-3.5 h-3.5 text-primary" />
              <select 
                value={comparisonAssetId || ""} 
                onChange={(e) => setComparisonAssetId(e.target.value || null)}
                className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-on-surface outline-none cursor-pointer"
              >
                <option value="" className="bg-surface">No Comparison</option>
                {marketData.filter(a => a.id !== assetId).map(a => (
                  <option key={a.id} value={a.id} className="bg-surface">{a.id}</option>
                ))}
              </select>
            </div>

            <div className="flex bg-surface-container-high p-1 rounded-sm gap-1">
              {(["1m", "5m", "1H", "1D"] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase transition-all rounded-sm ${timeframe === tf ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface/40 hover:text-on-surface'}`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high rounded-full transition-all text-on-surface/60 hover:text-on-surface"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10">
          {/* Institutional Macro / COT Banner */}
          {assetId.toUpperCase().includes('XAU') && !loadingCOT && cotData && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 space-y-4"
            >
              <div className="p-4 bg-surface-container-high/40 rounded-2xl border border-outline-variant/10 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3 border-r border-outline-variant/10 pr-6">
                    <Landmark className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40">CFTC COT Report</h4>
                      <p className="text-xs font-mono font-black text-on-surface">Updated: {cotData.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-secondary-container uppercase">Commercials (Hedgers)</span>
                      <span className="text-sm font-mono font-black text-on-surface">
                        Net {cotData.commercials.net > 0 ? '+' : ''}{cotData.commercials.net.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-tertiary-container uppercase">Non-Commercials (Specs)</span>
                      <span className="text-sm font-mono font-black text-on-surface">
                         Net {cotData.nonCommercials.net > 0 ? '+' : ''}{cotData.nonCommercials.net.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest">Bullish Accumulation Regime</p>
                </div>
              </div>

              {/* COT History Chart */}
              {cotData.history && (
                <div className="h-32 bg-surface-container-high/20 rounded-xl border border-outline-variant/5 p-4 relative overflow-hidden">
                  <div className="absolute top-4 left-4 z-10">
                    <h5 className="text-[8px] font-black uppercase tracking-widest text-on-surface/40">Institutional Net Position Trend</h5>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cotData.history}>
                      <defs>
                        <linearGradient id="colorNonComm" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-secondary-container)" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="var(--color-secondary-container)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'rgba(28, 27, 31, 0.9)', border: 'none', borderRadius: '4px', fontSize: '8px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="nonCommercialsNet" 
                        name="Non-Commercial Net"
                        stroke="var(--color-secondary-container)" 
                        fill="url(#colorNonComm)" 
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="commercialsNet" 
                        name="Commercial Net"
                        stroke="var(--color-tertiary-container)" 
                        fill="none" 
                        strokeWidth={1}
                        strokeDasharray="4 4"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Chart Area */}
            <div className="lg:col-span-8 space-y-8 relative">
              {/* AI Sidebar */}
              <AnimatePresence>
                {showAISidebar && (
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    className="absolute top-0 right-0 w-80 h-full bg-surface-container-highest/95 backdrop-blur-2xl border-l border-primary/20 z-40 p-6 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-primary" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">Nexus Snapshot</h3>
                      </div>
                      <button onClick={() => setShowAISidebar(false)} className="text-on-surface/40 hover:text-on-surface">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex bg-surface-container-high rounded p-1 mb-6">
                      {(['quick', 'full'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setAiThesisType(t)}
                          className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all ${aiThesisType === t ? 'bg-primary text-on-primary' : 'text-on-surface/40 hover:text-on-surface'}`}
                        >
                          {t} Report
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-6 scrollbar-hide">
                      {isGeneratingThesis ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <p className="text-[10px] font-bold text-primary uppercase animate-pulse">Consulting Institutional Nodes...</p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-primary uppercase border-b border-primary/20 pb-2">Analysis Execution</h4>
                            <p className="text-xs text-on-surface/80 leading-relaxed font-medium">
                              {aiThesis || "No active thesis generated. Use the Nexus trigger on the chart to initiate deep-dive intelligence."}
                            </p>
                          </div>

                          <div className="space-y-4 pt-6 border-t border-outline-variant/10">
                             <h4 className="text-[10px] font-black text-on-surface/40 uppercase">FVG Integrity Table</h4>
                             <div className="space-y-2">
                                {fvgZones.map((z, i) => (
                                  <div 
                                    key={i} 
                                    className={`flex items-center justify-between p-2 rounded border transition-all duration-300 ${hoveredEntityId === `fvg-${i}` ? 'bg-primary/20 border-primary/40 shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.2)] scale-[1.02]' : 'bg-surface-container-low border-outline-variant/10'}`}
                                  >
                                     <div className="flex flex-col">
                                       <span className="text-[8px] font-bold text-on-surface/30">GAP {i+1}</span>
                                       <span className="text-[10px] font-mono text-primary">${(z.top - z.bottom).toFixed(2)}</span>
                                     </div>
                                     <div className="text-right">
                                       <span className="text-[8px] font-bold text-on-surface/30 uppercase">WEIGHT</span>
                                       <span className="text-[10px] font-mono text-secondary-container">HEAVY</span>
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>
                          
                          <div className="space-y-4 pt-6 border-t border-outline-variant/10">
                             <h4 className="text-[10px] font-black text-on-surface/40 uppercase">Liquidity Matrix</h4>
                             <div className="space-y-2">
                                {liquidityPools.map((p, i) => (
                                  <div 
                                    key={i} 
                                    className={`flex items-center justify-between p-2 rounded border transition-all duration-300 ${hoveredEntityId === `pool-${i}` ? 'bg-primary/20 border-primary/40 shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.2)] scale-[1.02]' : 'bg-surface-container-low border-outline-variant/10'}`}
                                  >
                                     <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${p.type === 'buy-side' ? 'bg-secondary-container shadow-[0_0_8px_var(--color-secondary-container)]' : 'bg-tertiary-container shadow-[0_0_8px_var(--color-tertiary-container)]'}`} />
                                        <span className="text-[10px] font-mono text-on-surface">${p.price.toLocaleString()}</span>
                                     </div>
                                     <div className="text-right">
                                        <span className="text-[8px] font-bold text-on-surface/30 uppercase">{p.type === 'buy-side' ? 'BSL (BUY)' : 'SSL (SELL)'}</span>
                                        <span className="text-[9px] font-black text-primary block">STRENGTH: {Math.round(p.strength * 100)}%</span>
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>
                        </>
                      )}
                    </div>

                    <button 
                      onClick={generateAIThesis}
                      disabled={isGeneratingThesis || thesisCooldown > 0}
                      className="mt-6 w-full py-4 bg-primary text-on-primary font-black uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isGeneratingThesis ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                      {isGeneratingThesis ? "Synthesizing..." : thesisCooldown > 0 ? `Ready in ${thesisCooldown}s` : "Regenerate Thesis"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Flow Engine Toggle */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex bg-surface-container-high rounded-xl p-1 gap-1">
                  <button 
                    onClick={() => setShowOrderFlow(false)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${!showOrderFlow ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface/40 hover:text-on-surface/60'}`}
                  >
                    Structural Chart
                  </button>
                  <button 
                    onClick={() => setShowOrderFlow(true)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${showOrderFlow ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface/40 hover:text-on-surface/60'}`}
                  >
                    Nexus Flow Engine
                  </button>
                </div>
                {showOrderFlow && (
                   <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="flex bg-surface-container-high rounded-xl p-0.5 border border-outline-variant/10">
                        <button 
                          onClick={() => setOrderFlowMode('aggregated')}
                          className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${orderFlowMode === 'aggregated' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}
                        >
                          Core Flow
                        </button>
                        <button 
                          onClick={() => setOrderFlowMode('footprint')}
                          className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${orderFlowMode === 'footprint' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}
                        >
                          Footprint
                        </button>
                      </div>
                      <div className="w-px h-4 bg-outline-variant/10" />
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-secondary-container/20 bg-secondary-container/5 backdrop-blur-md">
                        <Binary className="w-3.5 h-3.5 text-secondary-container" />
                        <span className="text-[9px] font-black uppercase tracking-tighter text-secondary-container">CVD BIAS: {latestCVD > 0 ? 'ACCUMULATION' : 'DISTRIBUTION'}</span>
                      </div>
                   </div>
                )}
              </div>

              {!showOrderFlow ? (
                <div 
                  className="h-[550px] bg-surface-container-lowest/30 rounded-xl border border-outline-variant/10 p-4 relative cursor-crosshair overflow-hidden group/chart"
                  onWheel={handleWheel}
                  onMouseDown={() => setIsPanning(true)}
                  onMouseUp={() => setIsPanning(false)}
                  onMouseLeave={() => setIsPanning(false)}
                  onMouseMove={handleMouseMove}
                >
                {/* Ops Hub Overlay */}
                <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
                    <button 
                     onClick={() => generateAIThesis()}
                     disabled={isGeneratingThesis || thesisCooldown > 0}
                     className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all backdrop-blur-md disabled:opacity-50"
                    >
                      {isGeneratingThesis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                      <span className="text-[10px] font-black uppercase tracking-widest">{isGeneratingThesis ? "Synthesizing..." : thesisCooldown > 0 ? `Ready in ${thesisCooldown}s` : "AI Snapshot"}</span>
                    </button>
                   <button 
                    onClick={(e) => { e.stopPropagation(); setShowOpsHub(!showOpsHub); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${showOpsHub ? 'bg-primary border-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-container-high/80 backdrop-blur-md border-outline-variant/20 text-on-surface/60 hover:text-on-surface'}`}
                   >
                     <Settings className={`w-3.5 h-3.5 ${showOpsHub ? 'animate-spin-slow' : ''}`} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Ops Hub</span>
                   </button>
                   
                   <AnimatePresence>
                     {showOpsHub && (
                       <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute top-10 right-0 w-48 bg-surface-container-highest/95 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-3 shadow-2xl z-50 mt-2"
                        onClick={(e) => e.stopPropagation()}
                       >
                         <h4 className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">Nexus Visual Engine</h4>
                         <div className="space-y-1">
                           {[
                             { id: 'smc', label: 'Nexus SMC', icon: Layers },
                             { id: 'liquidity', label: 'Liquidity Pools', icon: Waves },
                             { id: 'fvg', label: 'FVG Detection', icon: Activity },
                             { id: 'volume', label: 'Volume Profile', icon: BarChart3 },
                             { id: 'killzones', label: 'Kill Zones', icon: Clock },
                           ].map(ov => (
                             <button
                              key={ov.id}
                              onClick={() => setActiveOverlays(prev => prev.includes(ov.id) ? prev.filter(x => x !== ov.id) : [...prev, ov.id])}
                              className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-all ${activeOverlays.includes(ov.id) ? 'bg-primary/10 text-primary' : 'text-on-surface/40 hover:bg-surface-container-high hover:text-on-surface/60'}`}
                             >
                               <div className="flex items-center gap-2">
                                 <ov.icon className="w-3 h-3" />
                                 <span className="text-[9px] font-bold uppercase">{ov.label}</span>
                               </div>
                               {activeOverlays.includes(ov.id) ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-on-surface/20" />}
                             </button>
                           ))}
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>

                <div className="absolute top-6 left-6 z-10 pointer-events-none">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface/40">Nexus Institutional Engine · {timeframe} Analysis</span>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-xl font-bold font-mono transition-all duration-75 relative group">
                      <motion.span
                        key={assetData?.price}
                        animate={isExecuting ? { 
                          color: [
                            'var(--color-on-surface)', 
                            isExecuting === 'buy' ? 'var(--color-secondary-container)' : 'var(--color-tertiary-container)',
                            'var(--color-on-surface)'
                          ],
                          scale: [1, 1.05, 1]
                        } : {}}
                      >
                        {assetData?.price}
                      </motion.span>
                      {/* Price pulse shadow */}
                      <div className="absolute -inset-2 bg-primary/5 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </h3>
                    
                    <div className="h-8 w-px bg-outline-variant/10 mx-1" />
                    
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Thermometer className={`w-3.5 h-3.5 ${volatility > 15 ? 'text-error animate-pulse' : 'text-primary animate-pulse'}`} />
                        <span className="text-[8px] font-black text-on-surface/60 uppercase tracking-[0.2em]">Neural Intelligence Volatility</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant/10 shadow-inner">
                           <motion.div 
                             animate={{ width: `${Math.min(100, volatility * 5)}%`, backgroundColor: volatility > 15 ? 'var(--color-error)' : 'var(--color-primary)' }}
                             className="h-full shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.5)]" 
                           />
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-[14px] font-mono font-black tabular-nums ${volatility > 15 ? 'text-error' : 'text-primary'}`}>{volatility.toFixed(2)}</span>
                          <span className="text-[8px] font-black text-on-surface/30 lowercase">bp</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-8 w-px bg-outline-variant/10 mx-1" />

                    <div className="flex items-center gap-2 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full">
                       <span className="text-[8px] font-black text-primary uppercase">
                         Zoom: {zoomRange.end - zoomRange.start > 0 ? Math.round(100 / ((zoomRange.end - zoomRange.start) / 100)) : 100}%
                       </span>
                    </div>
                  </div>
                </div>                {/* Volume Profile (VPVR) Overlay - Left Side */}
                {activeOverlays.includes('volume') && (
                  <div className="absolute left-0 inset-y-0 w-24 flex flex-col justify-center pointer-events-none z-0 opacity-40">
                    {volumeProfile.map((bin, i) => (
                      <div key={i} className="flex-1 flex items-center">
                        <div 
                          className={`h-[1px] transition-all duration-500 ${bin.isPOC ? 'bg-primary shadow-[0_0_8px_var(--color-primary)] opacity-100' : 'bg-on-surface/10'}`}
                          style={{ width: `${bin.weight}%` }}
                        />
                        {bin.isPOC && <span className="text-[6px] font-black text-primary ml-1 uppercase">POC</span>}
                      </div>
                    ))}
                  </div>
                )}
                
                <NexusSMCChart 
                  assetId={assetId}
                  history={history}
                  comparisonAssetId={comparisonAssetId}
                  comparisonHistory={comparisonHistory}
                  footprints={footprints}
                  activeOverlays={activeOverlays}
                  smcMarkers={smcMarkers}
                  fvgZones={fvgZones}
                  liquidityPools={liquidityPools}
                  killZones={killZones}
                  smcZones={smcZones}
                  orderBook={orderBook}
                  premiumDiscount={premiumDiscount}
                  zoomRange={zoomRange}
                  volumeProfile={volumeProfile}
                  onZoomRangeChange={setZoomRange}
                  onHoverFVG={(id) => setHoveredEntityId(id)}
                  onHoverLiquidity={(id) => setHoveredEntityId(id)}
                />
              </div>
            ) : (
              <div className="h-[550px] bg-surface-container-lowest/30 rounded-xl border border-outline-variant/10 p-4 flex flex-col gap-4 animate-in zoom-in-95 duration-500 overflow-hidden">
                 {orderFlowMode === 'footprint' ? (
                   <div className="flex-1 overflow-hidden">
                      <FootprintChart candles={footprints} />
                   </div>
                 ) : (
                   <div className="flex-1 overflow-hidden flex flex-col items-center justify-center relative bg-surface-container-low/20 rounded-xl border border-outline-variant/5">
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-secondary-container/10 to-transparent" />
                      <div className="relative z-10 text-center space-y-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                           <Activity className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-[0.3em] text-on-surface">Neural Flow Core Engaged</h4>
                        <p className="text-[10px] text-on-surface/40 max-w-[280px] mx-auto leading-relaxed">
                          Aggregating multi-source order books. Neural weighting biased towards <span className="text-secondary-container">secondary liquidity</span> targets.
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-8">
                           <div className="p-4 bg-surface-container-high/40 rounded-xl border border-outline-variant/10 text-left">
                              <span className="text-[8px] font-black text-on-surface/30 uppercase block mb-1">Buy Pressure</span>
                              <span className="text-xs font-mono font-black text-secondary-container">64.2%</span>
                           </div>
                           <div className="p-4 bg-surface-container-high/40 rounded-xl border border-outline-variant/10 text-left">
                              <span className="text-[8px] font-black text-on-surface/30 uppercase block mb-1">Sell Pressure</span>
                              <span className="text-xs font-mono font-black text-tertiary-container">35.8%</span>
                           </div>
                        </div>
                      </div>
                   </div>
                 )}
                 
                 <div className="h-24 bg-surface-container-high/20 rounded-xl border border-outline-variant/5 p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                       <div className="flex flex-col">
                         <span className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Nexus Flow Pressure (CVD)</span>
                         <span className="text-[8px] font-bold text-primary/40 uppercase">Aggregated Market Intensity</span>
                       </div>
                       <div className="flex items-center gap-6">
                          <div className="hidden sm:flex items-center gap-3 bg-surface-container-highest/20 px-4 py-1.5 rounded-xl border border-outline-variant/10 backdrop-blur-sm">
                             <span className="text-[8px] font-black uppercase tracking-[0.2em] text-on-surface/30">Order Pressure</span>
                             <div className="w-24 h-1.5 bg-surface-container-low rounded-full overflow-hidden flex">
                                <div className="h-full bg-tertiary-container shadow-[0_0_8px_var(--color-tertiary-container)]" style={{ width: `${Math.max(5, Math.min(95, 50 - (latestCVD / 100)))}%` }} />
                                <div className="w-px h-full bg-on-surface/10" />
                                <div className="h-full bg-secondary-container shadow-[0_0_8px_var(--color-secondary-container)]" style={{ width: `${Math.max(5, Math.min(95, 50 + (latestCVD / 100)))}%` }} />
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-highest border border-outline-variant/10`}>
                             {latestCVD > footprints[0]?.cvd ? <TrendingUp className="w-3 h-3 text-secondary-container" /> : <TrendingDown className="w-3 h-3 text-tertiary-container" />}
                             <span className={`text-[10px] font-mono font-black ${latestCVD > footprints[0]?.cvd ? 'text-secondary-container' : 'text-tertiary-container'}`}>
                               {latestCVD > 0 ? '+' : ''}{latestCVD.toFixed(2)}
                             </span>
                          </div>
                          <div className="h-8 w-16 opacity-30">
                             <ResponsiveContainer width="100%" height="100%">
                               <AreaChart data={footprints}>
                                 <Area type="monotone" dataKey="cvd" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.1} strokeWidth={1} isAnimationActive={false} />
                               </AreaChart>
                             </ResponsiveContainer>
                          </div>
                        </div>
                     </div>
                  </div>
                    <div className="flex-1 flex items-end gap-1 px-1">
                       {footprints.map((f, i) => (
                         <motion.div 
                           key={i}
                           initial={{ height: 0 }}
                           animate={{ height: `${Math.max(5, (Math.abs(f.cvd) / (Math.max(...footprints.map(x => Math.abs(x.cvd))) || 1)) * 100)}%` }}
                           className={`flex-1 rounded-t-sm transition-colors ${f.cvd > 0 ? 'bg-secondary-container/40 shadow-[0_0_8px_rgba(56,189,248,0.2)]' : 'bg-tertiary-container/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]'}`}
                         />
                       ))}
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 rounded-xl bg-surface-container-high/30 border border-outline-variant/5 backdrop-blur-md">
                       <span className="text-[8px] font-bold text-on-surface/30 uppercase block mb-1">Absorption Rate</span>
                       <span className="text-xs font-mono font-black">HIGH [92%]</span>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container-high/30 border border-outline-variant/5 backdrop-blur-md">
                       <span className="text-[8px] font-bold text-on-surface/30 uppercase block mb-1">Passive Auctions</span>
                       <span className="text-xs font-mono font-black text-secondary-container">BULLISH</span>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container-high/30 border border-outline-variant/5 backdrop-blur-md">
                       <span className="text-[8px] font-bold text-on-surface/30 uppercase block mb-1">Delta Divergence</span>
                       <span className="text-xs font-mono font-black text-tertiary-container">NEGATIVE</span>
                    </div>
                 </div>
              </div>
            )}

              {/* Institutional Pulse (COT & Intermarket Analysis) */}
              <div className="bg-surface-container-lowest/30 p-6 rounded-2xl border border-outline-variant/10 backdrop-blur-md">
                 <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                       <Landmark className="w-4 h-4" />
                       Institutional Pulse · COT & Intermarket
                    </h4>
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${loadingCOT || loadingIntermarket ? 'bg-on-surface/20 animate-pulse' : 'bg-secondary-container shadow-[0_0_8px_var(--color-secondary-container)]'}`} />
                       <span className="text-[8px] font-bold text-on-surface/40 uppercase">CFTC & Alpha Vantage Sync</span>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="space-y-1">
                       <span className="text-[9px] font-black text-on-surface/30 uppercase tracking-widest block">Non-Comm Net</span>
                       <div className="flex items-baseline gap-2">
                          <span className={`text-xl font-mono font-black ${cotData?.nonCommercials.net && cotData.nonCommercials.net > 0 ? 'text-secondary-container' : 'text-tertiary-container'}`}>
                            {loadingCOT ? '---' : cotData?.nonCommercials.net.toLocaleString() || 'N/A'}
                          </span>
                          {cotData?.nonCommercials.net && cotData.nonCommercials.net > 0 ? <TrendingUp className="w-3 h-3 text-secondary-container" /> : <TrendingDown className="w-3 h-3 text-tertiary-container" />}
                       </div>
                       <p className="text-[8px] text-on-surface/40 leading-tight">Institutional directional bias (Speculative Net).</p>
                    </div>

                    <div className="space-y-1">
                       <span className="text-[9px] font-black text-on-surface/30 uppercase tracking-widest block">COT Sentiment</span>
                       <div className="flex items-center gap-2">
                          <span className={`text-sm font-black uppercase px-2 py-0.5 rounded ${cotData?.sentiment === 'bullish' ? 'bg-secondary-container/20 text-secondary-container' : 'bg-tertiary-container/20 text-tertiary-container'}`}>
                            {loadingCOT ? '---' : cotData?.sentiment || 'NEUTRAL'}
                          </span>
                       </div>
                       <p className="text-[8px] text-on-surface/40 leading-tight mt-1">Smart Money commitment alignment.</p>
                    </div>
                    
                    <div className="space-y-1 col-span-1">
                       <span className="text-[9px] font-black text-on-surface/30 uppercase tracking-widest block mb-2">Institutional Trend</span>
                       <div className="h-10 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={cotData?.history || []}>
                                <Area 
                                  type="monotone" 
                                  dataKey="nonCommercialsNet" 
                                  stroke="var(--color-primary)" 
                                  fill="var(--color-primary)" 
                                  fillOpacity={0.1} 
                                  strokeWidth={1}
                                />
                             </AreaChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    <div className="space-y-1">
                       <span className="text-[9px] font-black text-on-surface/30 uppercase tracking-widest block">US Dollar (DXY)</span>
                       <div className="flex items-baseline gap-2">
                          <span className="text-xl font-mono font-black text-on-surface">
                            {loadingIntermarket ? '---' : intermarket?.dxy ? intermarket.dxy : '106.12'}
                          </span>
                          <TrendingDown className="w-3 h-3 text-tertiary-container" />
                       </div>
                       <p className="text-[8px] text-on-surface/40 leading-tight">Inverse correlation factor (Real-time).</p>
                    </div>
                    
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
                       <div className="bg-primary/10 p-2 rounded-lg">
                          <Radio className="w-4 h-4 text-primary animate-pulse" />
                       </div>
                       <div>
                          <span className="text-[8px] font-black text-primary uppercase block">Signal Alpha</span>
                          <span className="text-[10px] font-bold text-on-surface uppercase">COT/DXY Convergence</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-surface-container-lowest/30 p-6 rounded-xl border border-outline-variant/10">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-on-surface/40">Nexus Intelligence Hub</h4>
                    <div className="flex bg-surface-container-high rounded p-0.5 gap-1">
                      {(['FED Decision', 'CPI Print', 'CPI Release', 'Neutral'] as const).map(m => (
                        <button
                          key={m}
                          onClick={() => setMacroContext(m)}
                          className={`px-1.5 py-0.5 text-[7px] font-black uppercase rounded transition-all ${macroContext === m ? 'bg-primary text-on-primary' : 'text-on-surface/40 hover:text-on-surface'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-outline-variant/10" />
                        <motion.circle 
                          cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                          strokeDasharray={251.2}
                          animate={{ strokeDashoffset: sentiment === 'positive' ? 62.8 : sentiment === 'negative' ? 188.4 : 125.6 }}
                          className={sentiment === 'positive' ? 'text-secondary-container' : sentiment === 'negative' ? 'text-tertiary-container' : 'text-primary/60'}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {loadingSentiment ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : (
                          <span className="text-[10px] font-black uppercase tracking-tighter">
                            {sentiment === 'positive' ? 'Strong' : sentiment === 'negative' ? 'Weak' : 'Neutral'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="text-[11px] leading-relaxed text-on-surface/60 italic">
                        {sentiment === 'positive' ? "High conviction institutional accumulation detected in secondary liquidity pools." : 
                         sentiment === 'negative' ? "Aggressive distribution phase initiated by major stakeholders. Caution advised." :
                         "Market parity reached. Waiting for macro-economic catalysts to break current consolidation ranges."}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-primary uppercase">
                        <button 
                          onClick={fetchSentimentManual}
                          disabled={loadingSentiment}
                          className="flex items-center gap-2 px-2 py-1 bg-primary/10 hover:bg-primary/20 rounded transition-colors disabled:opacity-50"
                        >
                          {loadingSentiment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          {sentiment ? "Update Sentiment" : "Compute Sentiment"}
                        </button>
                        <div className="flex items-center gap-2">
                          <BrainCircuit className="w-3 h-3" />
                          Nexus Intelligence Analysis {macroContext !== 'Neutral' ? `· Adjusted for ${macroContext}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Thesis Summary */}
                  <div className="mt-4 p-3 bg-primary/5 rounded border border-primary/10">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-[8px] font-black uppercase text-primary tracking-widest">Institutional AI Thesis</span>
                        <div className="flex items-center gap-1">
                           <div className="w-1 h-1 bg-secondary-container rounded-full" />
                           <span className="text-[7px] font-bold text-on-surface/40 uppercase">Confidence 94%</span>
                        </div>
                     </div>
                     <p className="text-[10px] text-on-surface/60 leading-relaxed font-medium">
                        Based on current {macroContext} volatility, NEXUS identifies a high-conviction Smart Money accumulation phase. 
                        Targeting liquidity pools above {stats?.high ? (stats.high * 1.01).toFixed(2) : '---'} with BOS confirmation.
                     </p>
                  </div>
                  
                  {/* Sentiment Trend Mini-Chart */}
                  <div className="mt-6 pt-6 border-t border-outline-variant/5">
                    <div className="flex items-center justify-between mb-3 text-[9px] font-bold uppercase tracking-widest text-on-surface/30">
                      <span>1H Sentiment Trend</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        Live Velocity
                      </span>
                    </div>
                    <div className="h-12 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sentimentTrendData}>
                          <Area 
                            type="monotone" 
                            dataKey="val" 
                            stroke={sentiment === 'positive' ? 'var(--color-secondary-container)' : sentiment === 'negative' ? 'var(--color-tertiary-container)' : 'var(--color-primary)'} 
                            fill={sentiment === 'positive' ? 'var(--color-secondary-container)' : sentiment === 'negative' ? 'var(--color-tertiary-container)' : 'var(--color-primary)'}
                            fillOpacity={0.1}
                            strokeWidth={1.5}
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                  <div className="bg-surface-container-lowest/30 p-6 rounded-xl border border-outline-variant/10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-on-surface/40">Volatility Matrix</h4>
                        {volatility > 15 && <span className="px-1.5 py-0.5 bg-error/10 text-error text-[8px] font-black rounded-sm animate-pulse">HIGH REGIME</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-surface-container-high/40 border border-outline-variant/10">
                        <p className="text-[8px] font-black text-on-surface/30 uppercase mb-2">Neural Dispersion</p>
                        <p className={`text-xl font-mono font-black ${volatility > 12 ? 'text-tertiary-container' : 'text-primary'}`}>{volScore.toFixed(2)}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-surface-container-high/40 border border-outline-variant/10">
                        <p className="text-[8px] font-black text-on-surface/30 uppercase mb-2">Market Intensity</p>
                        <p className="text-xl font-mono font-black text-on-surface">{(volatility * 0.8).toFixed(1)}<span className="text-[10px] ml-1">σ</span></p>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-bold uppercase text-on-surface/40">
                          <span>Real-time Risk Regime</span>
                          <span>{volatility > 15 ? 'Aggressive' : 'Stable'}</span>
                        </div>
                        <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                           <motion.div 
                              animate={{ width: `${Math.min(100, volatility * 6)}%`, backgroundColor: volatility > 15 ? 'var(--color-error)' : 'var(--color-secondary-container)' }}
                              className="h-full"
                           />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest/30 p-6 rounded-xl border border-outline-variant/10">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-on-surface/40">AI Market Synthesis</h4>
                      <button 
                        onClick={generateAIThesis}
                        disabled={isGeneratingThesis || thesisCooldown > 0}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
                      >
                        {isGeneratingThesis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {isGeneratingThesis ? "Synthesizing..." : thesisCooldown > 0 ? `Cooldown (${thesisCooldown}s)` : "Deep Analysis"}
                        </span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {isGeneratingThesis ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                          />
                          <p className="text-[10px] font-bold text-primary uppercase animate-pulse">Computing institutional imbalances...</p>
                        </div>
                      ) : aiThesis ? (
                        <div className="p-4 bg-surface-container-high/30 rounded-xl border border-outline-variant/10 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-2">
                             <Sparkles className="w-3 h-3 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                           </div>
                           <p className="text-xs text-on-surface/80 leading-relaxed font-medium">
                              {aiThesis}
                           </p>
                           <div className="mt-4 flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-on-surface/30">
                              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-secondary-container" /> Confidence: 94%</span>
                              <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-primary" /> Alpha: High</span>
                           </div>
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <p className="text-[10px] font-bold text-on-surface/20 uppercase tracking-[0.2em]">Initiate Deep Analysis for Insights</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest/30 p-6 rounded-xl border border-outline-variant/10">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-on-surface/40 mb-6">Volatility Breakdown</h4>
                  <div className="space-y-4">
                    {[
                      { label: "RSI (14)", val: "62.4", color: "text-secondary-container" },
                      { label: "ATR", val: "1.24", color: "text-on-surface" },
                      { label: "Momentum", val: "+0.45%", color: "text-secondary-container" }
                    ].map(st => (
                      <div key={st.label} className="flex justify-between items-center py-2 border-b border-outline-variant/5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">{st.label}</span>
                        <span className={`text-xs font-mono font-bold ${st.color}`}>{st.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Book Side */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 h-full">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-primary" />
                    Neural Order Book
                  </h3>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-secondary-container">
                    <div className="w-1.5 h-1.5 bg-secondary-container rounded-full animate-pulse" />
                    LIVE
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Asks */}
                  <div className="space-y-1">
                    {(orderBook?.asks || Array.from({ length: 8 }).map(() => [0, 0])).slice(0, 8).reverse().map((ask, i) => {
                      const size = ask[1] || (Math.random() * 2);
                      const price = ask[0] || (parseFloat(assetData?.price || "0") * (1 + (8 - i) * 0.0001));
                      const percent = (size / maxOrderSize) * 100;
                      const isHot = size > maxOrderSize * 0.7;
                      return (
                        <div 
                          key={i} 
                          onMouseEnter={() => setHoveredOrder({ price, size, side: 'sell' })}
                          onMouseLeave={() => setHoveredOrder(null)}
                          className={`flex justify-between items-center text-[10px] font-mono group relative py-1.5 px-2 cursor-crosshair hover:bg-tertiary-container/10 transition-colors border-r-2 border-transparent hover:border-tertiary-container ${isHot ? 'animate-pulse bg-tertiary-container/5' : ''}`}
                        >
                          {hoveredOrder?.price === price && (
                            <div className="absolute right-full mr-2 top-0 bg-surface-container-highest border border-tertiary-container/30 px-3 py-1.5 rounded-lg text-[9px] font-black shadow-2xl whitespace-nowrap z-50 animate-in fade-in slide-in-from-right-2 duration-150">
                               <div className="flex flex-col gap-0.5">
                                 <span className="text-on-surface/40 uppercase text-[7px]">Order Level Price</span>
                                 <span className="text-tertiary-container text-xs tracking-tighter">${price.toFixed(2)}</span>
                                 <div className="h-px bg-outline-variant/10 my-1" />
                                 <span className="text-on-surface/40 uppercase text-[7px]">Aggregated Size</span>
                                 <span className="text-on-surface text-xs tracking-tighter">{size.toFixed(4)} UNITS</span>
                               </div>
                            </div>
                          )}
                          <div 
                            className="absolute inset-y-0 right-0 -z-10 transition-all duration-300 ease-out flex justify-end" 
                            style={{ 
                              width: `${percent}%`,
                              background: `linear-gradient(to left, var(--color-tertiary-container), transparent)`,
                              opacity: hoveredOrder?.price === price ? 0.5 : 0.2
                            }} 
                          >
                            <div className={`w-[2px] h-full ${hoveredOrder?.price === price ? 'bg-tertiary-container shadow-[0_0_12px_var(--color-tertiary-container)]' : 'bg-tertiary-container/40'}`} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold transition-all tabular-nums ${hoveredOrder?.price === price ? 'text-tertiary-container scale-105' : 'text-tertiary-container/90'}`}>
                              {price.toFixed(2)}
                            </span>
                          </div>
                          <span className={`transition-colors font-black tabular-nums ${hoveredOrder?.price === price ? 'text-on-surface' : 'text-on-surface/60 group-hover:text-on-surface'}`}>
                            {size.toFixed(4)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Spread */}
                  <div className="py-4 border-y border-outline-variant/20 flex flex-col items-center justify-center relative overflow-hidden bg-surface-container-high/50 group/spread">
                    <div className="absolute inset-x-0 h-full w-full bg-gradient-to-r from-secondary-container/10 via-primary/5 to-tertiary-container/10 animate-pulse" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-primary)_0%,transparent_70%)] opacity-5 group-hover:opacity-10 transition-opacity" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="text-right">
                        <p className="text-[7px] text-secondary-container font-black uppercase tracking-tighter">BID</p>
                        <p className="text-[10px] font-mono font-bold text-on-surface/40">{(parseFloat(assetData?.price || "0") * 0.9999).toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col items-center px-4 border-x border-outline-variant/10">
                        <p className="text-[8px] text-on-surface/40 uppercase font-black tracking-[0.2em] mb-0.5">SPREAD</p>
                        <p className="text-sm font-mono font-black text-primary tracking-tighter drop-shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.3)]">
                          0.12 <span className="text-[9px] text-primary/60 font-medium ml-1">0.01%</span>
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-[7px] text-tertiary-container font-black uppercase tracking-tighter">ASK</p>
                        <p className="text-[10px] font-mono font-bold text-on-surface/40">{(parseFloat(assetData?.price || "0") * 1.0001).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bids */}
                  <div className="space-y-1">
                    {(orderBook?.bids || Array.from({ length: 8 }).map(() => [0, 0])).slice(0, 8).map((bid, i) => {
                      const size = bid[1] || (Math.random() * 2);
                      const price = bid[0] || (parseFloat(assetData?.price || "0") * (1 - (i + 1) * 0.0001));
                      const percent = (size / maxOrderSize) * 100;
                      const isHot = size > maxOrderSize * 0.7;
                      return (
                        <div 
                          key={i} 
                          onMouseEnter={() => setHoveredOrder({ price, size, side: 'buy' })}
                          onMouseLeave={() => setHoveredOrder(null)}
                          className={`flex justify-between items-center text-[10px] font-mono group relative py-1.5 px-2 cursor-crosshair hover:bg-secondary-container/10 transition-colors border-l-2 border-transparent hover:border-secondary-container ${isHot ? 'animate-pulse bg-secondary-container/5' : ''}`}
                        >
                          {hoveredOrder?.price === price && (
                            <div className="absolute left-full ml-2 top-0 bg-surface-container-highest border border-secondary-container/30 px-3 py-1.5 rounded-lg text-[9px] font-black shadow-2xl whitespace-nowrap z-50 animate-in fade-in slide-in-from-left-2 duration-150">
                               <div className="flex flex-col gap-0.5">
                                 <span className="text-on-surface/40 uppercase text-[7px]">Order Level Price</span>
                                 <span className="text-secondary-container text-xs tracking-tighter">${price.toFixed(2)}</span>
                                 <div className="h-px bg-outline-variant/10 my-1" />
                                 <span className="text-on-surface/40 uppercase text-[7px]">Aggregated Size</span>
                                 <span className="text-on-surface text-xs tracking-tighter">{size.toFixed(4)} UNITS</span>
                               </div>
                            </div>
                          )}
                          <div 
                            className="absolute inset-y-0 left-0 -z-10 transition-all duration-300 ease-out" 
                            style={{ 
                              width: `${percent}%`,
                              background: `linear-gradient(to right, var(--color-secondary-container), transparent)`,
                              opacity: hoveredOrder?.price === price ? 0.5 : 0.2
                            }} 
                          >
                            <div className={`absolute right-0 w-[2px] h-full ${hoveredOrder?.price === price ? 'bg-secondary-container shadow-[0_0_12px_var(--color-secondary-container)]' : 'bg-secondary-container/40'}`} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold transition-all tabular-nums ${hoveredOrder?.price === price ? 'text-secondary-container scale-105' : 'text-secondary-container/90'}`}>
                              {price.toFixed(2)}
                            </span>
                          </div>
                          <span className={`transition-colors font-black tabular-nums ${hoveredOrder?.price === price ? 'text-on-surface' : 'text-on-surface/60 group-hover:text-on-surface'}`}>
                            {size.toFixed(4)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-outline-variant/10">
                  <button 
                    onClick={() => setIsExecutionOpen(!isExecutionOpen)}
                    className="w-full flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-on-surface/60 hover:text-primary transition-colors mb-4"
                  >
                    <span className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5" />
                      Execution Protocol
                    </span>
                    {isExecutionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  
                  <AnimatePresence>
                    {isExecutionOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-6"
                      >
                        <div className="space-y-3 p-3 bg-surface-container-high/50 rounded-lg border border-outline-variant/5">
                          {[
                            { label: "Neural Latency", value: "< 0.1ms", icon: Activity },
                            { label: "Slippage Control", value: "Adaptive 0.05%", icon: ShieldCheck },
                            { label: "Confirmations", value: "Smart Batching", icon: Zap }
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px]">
                              <span className="flex items-center gap-2 text-on-surface/40">
                                <item.icon className="w-3 h-3" />
                                {item.label}
                              </span>
                              <span className="font-mono font-bold text-on-surface/80">{item.value}</span>
                            </div>
                          ))}
                          <p className="text-[9px] text-on-surface/30 italic leading-tight mt-2">
                            Advanced neural routing ensures optimal fill rates across 42+ liquidity providers.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-4 p-4 bg-surface-container-highest/20 rounded-xl border border-outline-variant/10 mb-6">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/5">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setPortfolioTab('risk')}
                          className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-all rounded ${portfolioTab === 'risk' ? 'bg-primary text-on-primary' : 'text-on-surface/40 hover:text-on-surface'}`}
                        >
                          Risk Engine
                        </button>
                        <button 
                          onClick={() => setPortfolioTab('vaR')}
                          className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-all rounded ${portfolioTab === 'vaR' ? 'bg-primary text-on-primary' : 'text-on-surface/40 hover:text-on-surface'}`}
                        >
                          Portfolio Vitals
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-on-surface/30">CAPITAL: ${riskCapital.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {portfolioTab === 'risk' ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-2 block">Risk %</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={riskPercent}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setRiskPercent(val);
                              const price = parseFloat(assetData?.price || "1");
                              setOrderSize((riskCapital * (val / 100)) / (price / leverage));
                            }}
                            step="0.1"
                            className="w-full bg-surface-container-low border border-outline-variant/20 rounded px-3 py-2 text-sm font-mono font-bold outline-none focus:border-primary transition-colors hover:border-outline-variant"
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-bold text-on-surface/20">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-2 block">Leverage</label>
                        <select 
                          value={leverage}
                          onChange={(e) => setLeverage(parseInt(e.target.value))}
                          className="w-full bg-surface-container-low border border-outline-variant/20 rounded px-3 py-2 text-sm font-mono font-bold outline-none focus:border-primary transition-colors hover:border-outline-variant cursor-pointer"
                        >
                          <option value="1">1x</option>
                          <option value="5">5x</option>
                          <option value="10">10x</option>
                          <option value="25">25x</option>
                          <option value="50">50x</option>
                          <option value="100">100x</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-2 block">Manual Position Size</label>
                        <input 
                          type="number" 
                          value={orderSize.toFixed(4)}
                          onChange={(e) => setOrderSize(parseFloat(e.target.value) || 0)}
                          step="0.01"
                          className="w-full bg-surface-container-low border border-outline-variant/20 rounded px-3 py-2 text-sm font-mono font-bold outline-none focus:border-primary transition-colors hover:border-outline-variant"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-surface-container-high/50 rounded-xl border border-outline-variant/5">
                        <span className="text-[8px] font-black text-on-surface/30 uppercase block mb-1">95% Daily VaR</span>
                        <span className="text-sm font-mono font-black text-tertiary-container">${portfolioVaR.dailyVaR.toLocaleString()}</span>
                        <div className="w-full h-1 bg-outline-variant/10 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-tertiary-container" style={{ width: '65%' }} />
                        </div>
                      </div>
                      <div className="p-3 bg-surface-container-high/50 rounded-xl border border-outline-variant/5">
                        <span className="text-[8px] font-black text-on-surface/30 uppercase block mb-1">Portfolio Drawdown</span>
                        <span className={`text-sm font-mono font-black ${portfolioVaR.circuitBreakerTriggered ? 'text-tertiary-container' : 'text-primary'}`}>
                          {portfolioVaR.currentDrawdown}%
                        </span>
                        <div className="w-full h-1 bg-outline-variant/10 rounded-full mt-2 overflow-hidden">
                          <div className={`h-full ${portfolioVaR.circuitBreakerTriggered ? 'bg-tertiary-container shadow-[0_0_8px_var(--color-tertiary-container)]' : 'bg-primary'}`} style={{ width: `${(portfolioVaR.currentDrawdown / portfolioVaR.peakDrawdownLimit) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-tertiary-container/5 border border-tertiary-container/20 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                         <h5 className="text-[9px] font-black text-tertiary-container uppercase tracking-widest flex items-center gap-1">
                           <Thermometer className="w-3 h-3" /> Stress Test: Monte Carlo
                         </h5>
                         <span className="text-[8px] font-bold text-tertiary-container/60 uppercase">10k Trials</span>
                      </div>
                      <p className="text-[9px] text-on-surface/60 leading-tight">
                        Critical Correlation Warning: 74% overlap with DX1! Portfolio Risk exceeds 5% bound at current volatility levels. 
                        <span className="text-tertiary-container font-bold block mt-1 uppercase">Drawdown Circuit Breakers Armed</span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-outline-variant/5">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[9px] font-bold text-on-surface/40 uppercase tracking-tighter">Take Profit</label>
                          <div className="flex bg-surface-container-high rounded p-0.5 gap-1">
                            {(['pips', 'pct', 'target'] as const).map(m => (
                              <button
                                key={m}
                                onClick={() => setTpMode(m)}
                                className={`px-1 text-[7px] font-black uppercase rounded ${tpMode === m ? 'bg-primary text-on-primary' : 'text-on-surface/40 hover:text-on-surface'}`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="relative group">
                          <input 
                            type={tpMode === 'target' ? "number" : "range"} 
                            min={tpMode === 'pips' ? "1" : "0.1"} 
                            max={tpMode === 'pips' ? "200" : "10"} 
                            step={tpMode === 'pips' ? "1" : "0.1"} 
                            value={tpValue} 
                            onChange={(e) => setTpValue(parseFloat(e.target.value) || 0)}
                            className={`w-full ${tpMode === 'target' ? 'bg-surface-container-low border border-outline-variant/20 rounded px-2 py-1 text-[10px] outline-none' : 'h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-secondary-container'}`}
                          />
                          <span className="absolute -top-6 right-0 text-[10px] font-mono text-secondary-container font-black opacity-0 group-hover:opacity-100 transition-opacity">
                            {tpMode === 'pips' ? '+' : tpMode === 'pct' ? '%' : '$'}{tpValue}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[9px] font-bold text-on-surface/40 uppercase tracking-tighter">Stop Loss</label>
                          <div className="flex bg-surface-container-high rounded p-0.5 gap-1">
                            {(['pips', 'pct', 'target'] as const).map(m => (
                              <button
                                key={m}
                                onClick={() => setSlMode(m)}
                                className={`px-1 text-[7px] font-black uppercase rounded ${slMode === m ? 'bg-primary text-on-primary' : 'text-on-surface/40 hover:text-on-surface'}`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="relative group">
                          <input 
                            type={slMode === 'target' ? "number" : "range"} 
                            min={slMode === 'pips' ? "1" : "0.1"} 
                            max={slMode === 'pips' ? "100" : "5"} 
                            step={slMode === 'pips' ? "1" : "0.1"} 
                            value={slValue} 
                            onChange={(e) => setSlValue(parseFloat(e.target.value) || 0)}
                            className={`w-full ${slMode === 'target' ? 'bg-surface-container-low border border-outline-variant/20 rounded px-2 py-1 text-[10px] outline-none' : 'h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-tertiary-container'}`}
                          />
                          <span className="absolute -top-6 right-0 text-[10px] font-mono text-tertiary-container font-black opacity-0 group-hover:opacity-100 transition-opacity">
                            {slMode === 'pips' ? '-' : slMode === 'pct' ? '%' : '$'}{slValue}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-outline-variant/5">
                       <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-on-surface/30 uppercase leading-none mb-1">Est. Margin</span>
                        <span className="text-[11px] font-mono font-bold">${estimatedMargin.toFixed(2)}</span>
                       </div>
                       <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-secondary-container/40 uppercase leading-none mb-1">Est. Profit</span>
                        <span className="text-[11px] font-mono font-bold text-secondary-container">+${potentialPL.tp.toFixed(2)}</span>
                       </div>
                       <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-tertiary-container/40 uppercase leading-none mb-1">Est. Loss</span>
                        <span className="text-[11px] font-mono font-bold text-tertiary-container">-${Math.abs(potentialPL.sl).toFixed(2)}</span>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setShowConfirmModal('buy')}
                      className={`py-3 text-[10px] font-black uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2 border ${
                        isExecuting === 'buy' 
                          ? 'bg-secondary-container text-on-secondary-container border-secondary-container animate-pulse' 
                          : 'bg-secondary-container/10 border-secondary-container/20 text-secondary-container hover:bg-secondary-container/20'
                      }`}
                    >
                      {isExecuting === 'buy' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
                      {isExecuting === 'buy' ? 'Executing...' : 'Neural Buy'}
                    </button>
                    <button 
                      onClick={() => setShowConfirmModal('sell')}
                      className={`py-3 text-[10px] font-black uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2 border ${
                        isExecuting === 'sell' 
                          ? 'bg-tertiary-container text-on-tertiary-container border-tertiary-container animate-pulse' 
                          : 'bg-tertiary-container/10 border-tertiary-container/20 text-tertiary-container hover:bg-tertiary-container/20'
                      }`}
                    >
                      {isExecuting === 'sell' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {isExecuting === 'sell' ? 'Executing...' : 'Neural Sell'}
                    </button>
                  </div>
                </div>

                {/* Simulated Trading Signals Section */}
                <div className="mt-8 pt-8 border-t border-outline-variant/10">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-primary flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Neural Signal Nexus
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
                      <span className="text-[8px] font-bold text-on-surface/30 uppercase tracking-widest underline decoration-primary/20 underline-offset-4">Deep Learning Sync</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {mockSignals.map((sig, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-surface-container-high/20 p-5 rounded-2xl border border-outline-variant/10 group hover:border-primary/40 hover:bg-surface-container-high/40 transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                        
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5]
                              }}
                              transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              className="w-2 h-2 rounded-full bg-primary"
                            />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-black text-on-surface tracking-tight">{sig.id}</p>
                                <div className="px-1.5 py-0.5 rounded-[4px] bg-secondary-container/10 text-secondary-container text-[8px] font-black uppercase tracking-tighter shadow-sm">
                                  {sig.confidence > 85 ? 'Institutional Alpha' : 'Conviction Confirm'}
                                </div>
                              </div>
                              <p className="text-[10px] font-bold text-tertiary-container uppercase tracking-widest">{sig.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-mono font-black text-on-surface">${sig.price.toFixed(2)}</p>
                            <div className="flex items-center justify-end gap-1.5 mt-1">
                              <div className="w-20 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${sig.confidence}%` }}
                                  className="h-full bg-primary"
                                />
                              </div>
                              <p className="text-[9px] font-mono font-bold text-primary">{sig.confidence}%</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 relative z-10">
                          <button className="flex-1 py-2.5 bg-primary text-on-primary hover:scale-[1.02] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-primary/20">
                            Neural Execution
                          </button>
                          <button className="w-10 h-10 flex items-center justify-center bg-surface-container-highest rounded-xl border border-outline-variant/10 text-on-surface/40 hover:text-on-surface hover:border-primary/20 transition-all">
                            <Activity className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Nexus Performance Analytics */}
                  <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
                     {[
                       { label: 'System Accuracy', val: '92.4%', icon: BrainCircuit, color: 'text-secondary-container' },
                       { label: 'Weekly Alpha', val: '+$42,150', icon: TrendingUp, color: 'text-primary' },
                       { label: 'Neural Latency', val: '0.04ms', icon: Activity, color: 'text-on-surface' },
                       { label: 'Risk Factor', val: 'Low (0.8)', icon: ShieldCheck, color: 'text-on-surface/60' }
                     ].map((stat, i) => (
                       <div key={i} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-colors">
                          <p className="text-[8px] font-black text-on-surface/30 uppercase mb-2 flex items-center gap-2">
                             <stat.icon className="w-3 h-3 text-primary" /> {stat.label}
                          </p>
                          <p className={`text-sm font-mono font-black ${stat.color}`}>{stat.val}</p>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Trade Confirmation Modal */}
        <AnimatePresence>
          {showConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-surface/80 backdrop-blur-xl"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-md bg-surface-container border border-outline-variant/30 rounded-2xl p-8 shadow-2xl"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${showConfirmModal === 'buy' ? 'bg-secondary-container/20 text-secondary-container' : 'bg-tertiary-container/20 text-tertiary-container'}`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Confirm Execution</h3>
                    <p className="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest">Protocol V4 Override Required</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl">
                    <span className="text-[10px] font-black uppercase text-on-surface/30">Asset Symbol</span>
                    <span className="text-sm font-black text-on-surface">{assetId}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl">
                    <span className="text-[10px] font-black uppercase text-on-surface/30">Order Type</span>
                    <span className={`text-sm font-black ${showConfirmModal === 'buy' ? 'text-secondary-container' : 'text-tertiary-container'} uppercase`}>{showConfirmModal} position</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl border-l-2 border-primary/40">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase text-on-surface/30">Capital committed</span>
                       <span className="text-sm font-mono font-black text-on-surface">${estimatedMargin.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                       <span className="text-[9px] font-bold text-on-surface/40 uppercase">at {leverage}x leverage</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-surface-container-low rounded-xl">
                      <span className="text-[9px] font-black uppercase text-secondary-container/60 block mb-1">Est. Profit</span>
                      <span className="text-sm font-mono font-black text-secondary-container">+${potentialPL.tp.toFixed(2)}</span>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-xl">
                      <span className="text-[9px] font-black uppercase text-tertiary-container/60 block mb-1">Est. Loss</span>
                      <span className="text-sm font-mono font-black text-tertiary-container">-${Math.abs(potentialPL.sl).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/10 flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-on-surface/30">Estimated Slippage</span>
                    <span className="text-[10px] font-mono font-black text-on-surface">~{(volScore * 0.05).toFixed(3)}%</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowConfirmModal(null)}
                    className="flex-1 py-4 border border-outline-variant/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => executeTrade(showConfirmModal as 'buy' | 'sell')}
                    className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-on-primary shadow-lg ${showConfirmModal === 'buy' ? 'bg-secondary-container' : 'bg-tertiary-container'}`}
                  >
                    Authorize Order
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
