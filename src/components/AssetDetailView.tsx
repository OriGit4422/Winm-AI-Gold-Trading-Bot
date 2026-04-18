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
                  <h3 className="text-xl font-bold font-mono">{assetData?.price}</h3>
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
                      contentStyle={{ backgroundColor: 'rgba(28, 27, 31, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                      itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
                      animationDuration={150}
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
                    {(orderBook?.asks || Array.from({ length: 8 }).map(() => [0, 0])).slice(0, 8).map((ask, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] font-mono group relative py-1">
                        <div 
                          className="absolute inset-y-0 right-0 bg-tertiary-container/10 -z-10 transition-all duration-300" 
                          style={{ width: `${((ask[1] || (Math.random() * 2)) / maxOrderSize) * 100}%` }} 
                        />
                        <span className="text-tertiary-container font-bold">{(ask[0] || (parseFloat(assetData?.price || "0") * (1 + (i + 1) * 0.0001))).toFixed(2)}</span>
                        <span className="text-on-surface/40">{(ask[1] || (Math.random() * 2)).toFixed(4)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Spread */}
                  <div className="py-2 border-y border-outline-variant/10 text-center">
                    <p className="text-[9px] text-on-surface/30 uppercase font-bold tracking-widest mb-0.5">Spread</p>
                    <p className="text-xs font-mono font-bold text-on-surface">0.12 (0.01%)</p>
                  </div>

                  {/* Bids */}
                  <div className="space-y-1">
                    {(orderBook?.bids || Array.from({ length: 8 }).map(() => [0, 0])).slice(0, 8).map((bid, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] font-mono group relative py-1">
                        <div 
                          className="absolute inset-y-0 left-0 bg-secondary-container/10 -z-10 transition-all duration-300" 
                          style={{ width: `${((bid[1] || (Math.random() * 2)) / maxOrderSize) * 100}%` }} 
                        />
                        <span className="text-secondary-container font-bold">{(bid[0] || (parseFloat(assetData?.price || "0") * (1 - (i + 1) * 0.0001))).toFixed(2)}</span>
                        <span className="text-on-surface/40">{(bid[1] || (Math.random() * 2)).toFixed(4)}</span>
                      </div>
                    ))}
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
                    <button className="py-3 bg-secondary-container/10 border border-secondary-container/20 text-secondary-container text-[10px] font-black uppercase tracking-widest rounded hover:bg-secondary-container/20 transition-all flex items-center justify-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Neural Buy
                    </button>
                    <button className="py-3 bg-tertiary-container/10 border border-tertiary-container/20 text-tertiary-container text-[10px] font-black uppercase tracking-widest rounded hover:bg-tertiary-container/20 transition-all flex items-center justify-center gap-2">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Neural Sell
                    </button>
                  </div>
                </div>

                {/* Simulated Trading Signals Section */}
                <div className="mt-8 pt-8 border-t border-outline-variant/10">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-primary mb-6 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Neural Trading Signals
                  </h4>
                  <div className="space-y-3">
                    {mockSignals.map((sig, i) => (
                      <div key={i} className="bg-surface-container-high/30 p-4 rounded-xl border border-outline-variant/10 group hover:border-primary/30 transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-[11px] font-black text-on-surface mb-0.5">{sig.id}</p>
                            <p className="text-[9px] font-bold text-secondary-container uppercase tracking-tighter">{sig.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-mono font-bold text-on-surface">${sig.price.toFixed(2)}</p>
                            <p className="text-[9px] font-bold text-on-surface/40 uppercase">Confidence: {sig.confidence}%</p>
                          </div>
                        </div>
                        <button className="w-full py-2 bg-on-surface/5 hover:bg-primary hover:text-on-primary text-[9px] font-black uppercase tracking-widest rounded transition-all">
                          Trade Now
                        </button>
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
