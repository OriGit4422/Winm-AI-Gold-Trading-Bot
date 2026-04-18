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
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Line } from "recharts";
import { useAssetHistory, useMarketData, Timeframe } from "../services/marketService";
import { getSentiment, Sentiment } from "../services/geminiService";

interface AssetDetailViewProps {
  assetId: string;
  onClose: () => void;
}

export function AssetDetailView({ assetId, onClose }: AssetDetailViewProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1m");
  const [comparisonAssetId, setComparisonAssetId] = useState<string | null>(null);
  const history = useAssetHistory(assetId, timeframe, 100);
  const comparisonHistory = useAssetHistory(comparisonAssetId || "BTC/USDT", timeframe, 100);
  const { data: marketData, orderBooks } = useMarketData();
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [loadingSentiment, setLoadingSentiment] = useState(false);
  const [isExecutionOpen, setIsExecutionOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState<'buy' | 'sell' | null>(null);

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

  const handleExecution = (type: 'buy' | 'sell') => {
    setIsExecuting(type);
    setTimeout(() => {
      setIsExecuting(null);
    }, 1500);
  };

  useEffect(() => {
    async function fetchSentiment() {
      if (!assetId) return;
      setLoadingSentiment(true);
      const res = await getSentiment(`${assetId} market status`, "Detailed analysis of current price action and institutional flow.");
      setSentiment(res);
      setLoadingSentiment(false);
    }
    fetchSentiment();
  }, [assetId]);

  const stats = useMemo(() => {
    if (history.length < 2) return null;
    const startPrice = history[0].price;
    const endPrice = history[history.length - 1].price;
    const high = Math.max(...history.map(h => h.price));
    const low = Math.min(...history.map(h => h.price));
    const change = ((endPrice - startPrice) / startPrice) * 100;
    return { high, low, change };
  }, [history]);

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
                <p className="text-[10px] text-on-surface/40 uppercase font-bold tracking-widest mb-1">24h High</p>
                <p className="text-lg font-mono font-bold text-on-surface">{(stats?.high || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface/40 uppercase font-bold tracking-widest mb-1">24h Low</p>
                <p className="text-lg font-mono font-bold text-on-surface">{(stats?.low || 0).toLocaleString()}</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Chart Area */}
            <div className="lg:col-span-8 space-y-8">
              <div className="h-[450px] bg-surface-container-lowest/30 rounded-xl border border-outline-variant/10 p-4 relative">
                <div className="absolute top-6 left-6 z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface/40">Market Trajectory</span>
                  </div>
                  <h3 className="text-xl font-bold font-mono transition-all duration-75">
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
                  </h3>
                </div>
                
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history.map((h, i) => ({
                    ...h,
                    comparePrice: comparisonAssetId && comparisonHistory[i] ? comparisonHistory[i].price : undefined
                  }))}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }}
                      minTickGap={50}
                    />
                    <YAxis 
                      yAxisId="primary"
                      domain={['auto', 'auto']} 
                      orientation="right" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: 'var(--color-primary)', fontFamily: 'monospace' }}
                      width={60}
                    />
                    {comparisonAssetId && (
                      <YAxis 
                        yAxisId="compare"
                        domain={['auto', 'auto']} 
                        orientation="left" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}
                        width={60}
                      />
                    )}
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-surface-container-highest border border-outline-variant/20 p-3 rounded-lg shadow-2xl backdrop-blur-md">
                              <p className="text-[9px] text-on-surface/40 uppercase font-black mb-2 border-b border-outline-variant/10 pb-1">{label}</p>
                              {payload.map((entry: any, i: number) => (
                                <div key={i} className="flex flex-col mb-1 last:mb-0">
                                  <span className="text-[8px] text-on-surface/30 uppercase font-bold tracking-tighter">{entry.name}</span>
                                  <span className={`text-xs font-mono font-bold ${entry.name === assetId ? 'text-primary' : 'text-on-surface/60'}`}>
                                    ${entry.value.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      yAxisId="primary"
                      type="monotone" 
                      dataKey="price" 
                      stroke="var(--color-primary)" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                      isAnimationActive={false}
                      name={assetId}
                    />
                    {comparisonAssetId && (
                      <Line
                        yAxisId="compare"
                        type="monotone"
                        dataKey="comparePrice"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                        isAnimationActive={false}
                        name={comparisonAssetId}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
                
                <div className="h-20 -mt-20 pointer-events-none opacity-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={history}>
                      <Bar 
                        dataKey="volume" 
                        fill="var(--color-primary)" 
                        opacity={0.3}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Volume & Momentum */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-surface-container-lowest/30 p-6 rounded-xl border border-outline-variant/10">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-on-surface/40 mb-6">Neural Sentiment Analysis</h4>
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
                      <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase">
                        <BrainCircuit className="w-3 h-3" />
                        Gemini Neural Insight
                      </div>
                    </div>
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
                    {(orderBook?.asks || Array.from({ length: 8 }).map(() => [0, 0])).slice(0, 8).map((ask, i) => {
                      const size = ask[1] || (Math.random() * 2);
                      const percent = (size / maxOrderSize) * 100;
                      return (
                        <div key={i} className="flex justify-between items-center text-[11px] font-mono group relative py-1 px-1 cursor-crosshair hover:bg-on-surface/5 transition-colors">
                          <div 
                            className="absolute inset-y-0 right-0 -z-10 transition-all duration-500 ease-out flex justify-end" 
                            style={{ 
                              width: `${percent}%`,
                              background: `linear-gradient(to left, var(--color-tertiary-container), transparent)`,
                              opacity: 0.15
                            }} 
                          >
                            <div className="w-[1px] h-full bg-tertiary-container/30" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-tertiary-container font-bold">{(ask[0] || (parseFloat(assetData?.price || "0") * (1 + (i + 1) * 0.0001))).toFixed(2)}</span>
                            <span className="text-[8px] text-tertiary-container/40 opacity-0 group-hover:opacity-100 transition-opacity">SELL</span>
                          </div>
                          <span className="text-on-surface/40 group-hover:text-on-surface transition-colors">{size.toFixed(4)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Spread */}
                  <div className="py-3 border-y border-outline-variant/10 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                    <p className="text-[9px] text-on-surface/30 uppercase font-bold tracking-widest mb-0.5 relative z-10">Neural Spread</p>
                    <p className="text-xs font-mono font-bold text-on-surface relative z-10">0.12 <span className="text-[9px] opacity-40">(0.01%)</span></p>
                  </div>

                  {/* Bids */}
                  <div className="space-y-1">
                    {(orderBook?.bids || Array.from({ length: 8 }).map(() => [0, 0])).slice(0, 8).map((bid, i) => {
                      const size = bid[1] || (Math.random() * 2);
                      const percent = (size / maxOrderSize) * 100;
                      return (
                        <div key={i} className="flex justify-between items-center text-[11px] font-mono group relative py-1 px-1 cursor-crosshair hover:bg-on-surface/5 transition-colors">
                          <div 
                            className="absolute inset-y-0 left-0 -z-10 transition-all duration-500 ease-out border-r border-secondary-container/20" 
                            style={{ 
                              width: `${percent}%`,
                              background: `linear-gradient(to right, var(--color-secondary-container), transparent)`,
                              opacity: 0.15
                            }} 
                          >
                            <div className="absolute right-0 w-[1px] h-full bg-secondary-container/30" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-secondary-container font-bold">{(bid[0] || (parseFloat(assetData?.price || "0") * (1 - (i + 1) * 0.0001))).toFixed(2)}</span>
                            <span className="text-[8px] text-secondary-container/40 opacity-0 group-hover:opacity-100 transition-opacity">BUY</span>
                          </div>
                          <span className="text-on-surface/40 group-hover:text-on-surface transition-colors">{size.toFixed(4)}</span>
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

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleExecution('buy')}
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
                      onClick={() => handleExecution('sell')}
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
                      <div key={i} className="bg-surface-container-high/20 p-5 rounded-2xl border border-outline-variant/10 group hover:border-primary/40 hover:bg-surface-container-high/40 transition-all duration-300 relative overflow-hidden">
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
                                  {sig.confidence > 85 ? 'High Conviction' : 'Medium Conviction'}
                                </div>
                              </div>
                              <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">{sig.type}</p>
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
                          <button className="flex-1 py-2.5 bg-on-surface text-surface hover:bg-primary hover:text-on-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-black/20 transform group-hover:scale-[1.02]">
                            Neural Execution
                          </button>
                          <button className="w-10 h-10 flex items-center justify-center bg-surface-container-highest rounded-xl border border-outline-variant/10 text-on-surface/40 hover:text-on-surface hover:border-primary/20 transition-all">
                            <Activity className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
