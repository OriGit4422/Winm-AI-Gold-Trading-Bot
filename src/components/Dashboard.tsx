import React, { useState, useMemo, useEffect } from "react";
import { 
  TrendingUp, 
  Activity, 
  ArrowDownRight, 
  ArrowUp, 
  ArrowDown, 
  Waves, 
  Zap, 
  Target, 
  Plus, 
  Gauge, 
  Filter, 
  Newspaper,
  Sparkles,
  Loader2,
  Settings,
  Pencil,
  Type,
  Ruler,
  Eraser
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMarketData, useAssetHistory, useIntermarketData, useCOTData } from "../services/marketService";
import { useNewsFeed, NewsArticle } from "../services/newsService";
import { summarizeArticle, SummaryLength, getSentiment, Sentiment, getDeepMarketAnalysis, AlphaSignal } from "../services/geminiService";
import ReactMarkdown from "react-markdown";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { IntermarketPanel } from "./IntermarketPanel";
import { AlphaSignals } from "./AlphaSignals";

interface NewsArticleCardProps {
  article: NewsArticle;
  index: number;
}

function NewsArticleCard({ article, index }: NewsArticleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (summary) return;
    setLoading(true);
    const result = await summarizeArticle(article.title, article.description, "medium");
    const sent = await getSentiment(article.title, article.description);
    setSummary(result);
    setSentiment(sent);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => setIsExpanded(!isExpanded)}
      className={`bg-surface-container-low border border-outline-variant/10 rounded-lg overflow-hidden cursor-pointer hover:border-primary/20 transition-all ${isExpanded ? 'ring-1 ring-primary/20' : ''}`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{article.source.name || 'MARKET'}</span>
          <span className="text-[10px] text-on-surface/40 font-bold uppercase">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ''}</span>
        </div>
        <h4 className="text-sm font-bold text-on-surface leading-snug mb-2 group-hover:text-primary transition-colors">
          {article.title}
        </h4>
        <p className="text-xs text-on-surface/60 line-clamp-2 leading-relaxed mb-4">
          {article.description}
        </p>
        
        <div className="flex items-center justify-between">
          <button
            onClick={handleSummarize}
            disabled={loading}
            className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest hover:opacity-80 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {summary ? "AI Insights Ready" : "Extract AI Insights"}
          </button>
          
          {sentiment && (
            <div className={`px-2 py-0.5 rounded-sm text-[9px] font-extrabold uppercase ${
              sentiment === 'positive' ? 'bg-secondary-container/10 text-secondary-container' : 
              sentiment === 'negative' ? 'bg-tertiary-container/10 text-tertiary-container' : 
              'bg-surface-container-high text-on-surface/60'
            }`}>
              {sentiment}
            </div>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-outline-variant/5"
            >
              <div className="bg-surface-container-high/50 p-4 rounded text-xs leading-relaxed text-on-surface/80 max-h-[200px] overflow-y-auto news-markdown">
                {summary ? (
                  <ReactMarkdown>{summary}</ReactMarkdown>
                ) : (
                  <p className="italic text-on-surface/40">Click "Extract AI Insights" to generate a neural summary and sentiment analysis of this intelligence report.</p>
                )}
              </div>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-4 block text-center py-2 text-[10px] font-bold uppercase tracking-widest border border-outline-variant/10 rounded hover:bg-surface-container-high transition-colors text-on-surface/60"
              >
                Read Official Source
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function Dashboard({ onSelectAsset }: { onSelectAsset?: (id: string) => void }) {
  const { data: marketData, isConnected, historyData } = useMarketData();
  const [selectedAsset, setSelectedAsset] = useState("XAU/USD");
  const [newsCategory, setNewsCategory] = useState("all");
  const { news, loading: newsLoading } = useNewsFeed(newsCategory);
  const [deepAnalysis, setDeepAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisCooldown, setAnalysisCooldown] = useState(0);

  useEffect(() => {
    if (analysisCooldown > 0) {
      const timer = setTimeout(() => setAnalysisCooldown(analysisCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [analysisCooldown]);
  const [drawings, setDrawings] = useState<{ type: 'trend' | 'fibo' | 'text', startX: number, startY: number, endX?: number, endY?: number, text?: string }[]>([]);
  const [activeTool, setActiveTool] = useState<'trend' | 'fibo' | 'text' | null>(null);
  const [currentDrawing, setCurrentDrawing] = useState<any>(null);
  const history = useAssetHistory(selectedAsset, "1m", 60);

  const activeAssetData = marketData.find(a => a.id === selectedAsset);
  
  const handleChartMouseDown = (e: React.MouseEvent) => {
    if (!activeTool) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentDrawing({ type: activeTool, startX: x, startY: y, endX: x, endY: y });
  };

  const handleChartMouseMove = (e: React.MouseEvent) => {
    if (!currentDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentDrawing({ ...currentDrawing, endX: x, endY: y });
  };

  const handleChartMouseUp = () => {
    if (!currentDrawing) return;
    if (currentDrawing.type === 'text') {
      const text = window.prompt("Enter annotation:");
      if (text) setDrawings([...drawings, { ...currentDrawing, text }]);
    } else {
      setDrawings([...drawings, currentDrawing]);
    }
    setCurrentDrawing(null);
  };
  
  // Analytics Calculations
  const analytics = useMemo(() => {
    if (marketData.length === 0) return null;

    const calculateMetrics = (assetId: string) => {
      const hist = historyData[assetId] || [];
      const currentHistory = assetId === selectedAsset ? history : hist; // Prefer real-time hook if it's the selected one
      if (currentHistory.length < 10) return null;
      const prices = currentHistory.map(h => h.price);
      const currentPrice = prices[prices.length - 1];
      const mean = prices.slice(-10).reduce((a, b) => a + b, 0) / 10;
      const variance = prices.slice(-10).reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 10;
      const volatility = (Math.sqrt(variance) / currentPrice) * 10000;
      const momentum = ((currentPrice - prices[prices.length - 10]) / prices[prices.length - 10]) * 100;
      return { volatility, momentum, currentPrice };
    };

    return {
      gold: calculateMetrics("XAU/USD"),
      eur: calculateMetrics("EUR/USD"),
      btc: calculateMetrics("BTC/USD")
    };
  }, [marketData, historyData, history, selectedAsset]);

  const handleDeepAnalysis = async () => {
    if (!activeAssetData || analysisCooldown > 0) return;
    setIsAnalyzing(true);
    try {
      const headlines = news.slice(0, 5).map(n => n.title);
      const result = await getDeepMarketAnalysis(selectedAsset, activeAssetData.price, headlines);
      setDeepAnalysis(result);
    } finally {
      setIsAnalyzing(false);
      setAnalysisCooldown(60); 
    }
  };

  useEffect(() => {
    if (activeAssetData) {
      setDeepAnalysis(null); // Reset when changing asset
    }
  }, [selectedAsset]);

  const { intermarket } = useIntermarketData();
  const { cotData: cot } = useCOTData("XAU/USD");

  const marketContext = useMemo(() => {
    const assetString = marketData.map(a => `[${a.id}: LIVE_PRICE=${a.price} (RAW=${a.price.replace(/,/g, '')})]`).join(" | ");
    const newsString = news.slice(0, 3).map(n => n.title).join("; ");
    
    let cotString = "";
    if (cot) {
      const netSign = cot.nonCommercials.net > 0 ? "+" : "";
      cotString = `[COT_REPORT (Gold/XAU): Non-Commercial_Net=${netSign}${cot.nonCommercials.net.toLocaleString()} (L:${cot.nonCommercials.long.toLocaleString()}, S:${cot.nonCommercials.short.toLocaleString()}) | Bias=${cot.sentiment?.toUpperCase()}]`;
    }
    
    const intermarketString = intermarket ? `[INTERMARKET: DXY=${intermarket.dxy} | YIELD_10Y=${intermarket.yield10Y}%]` : "";
    
    const context = `SYSTEM_TIME: ${new Date().toISOString()} | CURRENT_MARKET_PRICES: ${assetString} | LATEST_NEWS: ${newsString} | ${cotString} | ${intermarketString}`;
    return context;
  }, [marketData, news, cot, intermarket]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-outline-variant/10 border border-outline-variant/10 min-h-[calc(100vh-12rem)]">
      {/* Left Sidebar: Asset Nav */}
      <aside className="lg:col-span-3 bg-surface-container-low p-4 space-y-6">
        <div className="flex items-center gap-2 mb-8">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-[0.2em]">Live Terminal</h2>
        </div>
        
        <div className="space-y-1">
          {["XAU/USD", "EUR/USD", "GBP/JPY", "BTC/USD"].map(id => {
            const asset = marketData.find(a => a.id === id);
            const isActive = selectedAsset === id;
            return (
              <div key={id} className="relative group">
                <button
                  onClick={() => setSelectedAsset(id)}
                  className={`w-full flex items-center justify-between p-3 rounded transition-all group ${
                    isActive ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-surface-container-high"
                  }`}
                >
                  <div className="text-left">
                    <span className={`text-xs font-bold block ${isActive ? "text-primary" : "text-on-surface/60"}`}>{id}</span>
                    <span className="text-[10px] text-on-surface/30 font-bold uppercase tracking-wider">Spot</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono block">{asset?.price || "---"}</span>
                    <span className={`text-[10px] font-bold ${asset?.trend === 'up' ? 'text-secondary-container' : 'text-tertiary-container'}`}>
                      {asset?.change || "0.00%"}
                    </span>
                  </div>
                </button>
                <button 
                  onClick={() => onSelectAsset?.(id)}
                  className="absolute right-[-4px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 bg-surface border border-outline-variant/20 rounded-full shadow-lg transition-all z-10 hover:scale-110 active:scale-90"
                >
                  <Zap className="w-3 h-3 text-primary" />
                </button>
              </div>
            );
          })}
        </div>

        <IntermarketPanel />

        <div className="pt-8 border-t border-outline-variant/5">
          <h3 className="text-[9px] font-bold text-on-surface/30 uppercase tracking-[0.2em] mb-4">Volatility Index</h3>
          <div className="space-y-4">
            {["XAU/USD", "EUR/USD"].map(id => {
              const val = id === "XAU/USD" ? analytics?.gold?.volatility : analytics?.eur?.volatility;
              return (
                <div key={id} className="space-y-1.5 cursor-pointer" onClick={() => onSelectAsset?.(id)}>
                  <div className="flex justify-between text-[10px] items-center">
                    <span className="font-bold text-on-surface/40">{id}</span>
                    <span className="font-mono font-bold">{(val || 0).toFixed(1)}</span>
                  </div>
                  <div className="h-0.5 bg-outline-variant/10 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: `${Math.min((val || 0) * 8, 100)}%` }}
                      className="h-full bg-primary" 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content: Analysis Engine */}
      <main className="lg:col-span-6 bg-surface p-6 overflow-y-auto">
        <header className="flex justify-between items-center mb-10 border-b border-outline-variant/10 pb-6">
          <div className="cursor-pointer" onClick={() => onSelectAsset?.(selectedAsset)}>
            <h1 className="text-2xl font-bold tracking-tight mb-1">{selectedAsset} Deep Analysis</h1>
            <p className="text-[10px] text-on-surface/40 uppercase tracking-widest font-bold">Powered by Gemini-3 Flash · Neural Market Insights</p>
          </div>
          <button 
            onClick={handleDeepAnalysis}
            disabled={isAnalyzing || analysisCooldown > 0}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest rounded hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isAnalyzing ? "Run AI Synthesis" : analysisCooldown > 0 ? `Ready in ${analysisCooldown}s` : "Run AI Synthesis"}
          </button>
        </header>

        <AnimatePresence mode="wait">
          {deepAnalysis ? (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-invert prose-sm max-w-none prose-headings:text-primary prose-headings:font-headline news-markdown bg-surface-container-low p-8 rounded-lg border border-outline-variant/10"
            >
              <ReactMarkdown>{deepAnalysis}</ReactMarkdown>
            </motion.div>
          ) : (
            <motion.div
              key="chart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-2 p-1 bg-surface-container-low border border-outline-variant/10 rounded-lg w-fit">
                {[
                  { id: 'trend', icon: Pencil, label: 'Trend' },
                  { id: 'fibo', icon: Ruler, label: 'Fib' },
                  { id: 'text', icon: Type, label: 'Text' },
                ].map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id as any)}
                    className={`p-2 rounded transition-all ${activeTool === tool.id ? 'bg-primary text-on-primary' : 'text-on-surface/40 hover:bg-surface-container-high'}`}
                    title={tool.label}
                  >
                    <tool.icon className="w-4 h-4" />
                  </button>
                ))}
                <div className="w-px h-4 bg-outline-variant/20 mx-1" />
                <button
                  onClick={() => setDrawings([])}
                  className="p-2 text-on-surface/40 hover:text-error transition-colors"
                  title="Clear All"
                >
                  <Eraser className="w-4 h-4" />
                </button>
              </div>

              <div 
                className="h-[350px] bg-surface-container-low/50 rounded-lg p-4 border border-outline-variant/5 relative cursor-crosshair group"
                onMouseDown={handleChartMouseDown}
                onMouseMove={handleChartMouseMove}
                onMouseUp={handleChartMouseUp}
              >
                 <svg className="absolute inset-0 pointer-events-none z-10 w-full h-full overflow-hidden">
                    {drawings.map((d, i) => (
                      <React.Fragment key={i}>
                        {d.type === 'trend' && (
                          <line x1={d.startX} y1={d.startY} x2={d.endX} y2={d.endY} stroke="var(--color-primary)" strokeWidth="1.5" />
                        )}
                        {d.type === 'fibo' && (
                          <g>
                            <line x1={d.startX} y1={d.startY} x2={d.endX} y2={d.endY} stroke="var(--color-primary)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
                            {[0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].map(lvl => {
                              const y = d.startY + (d.endY! - d.startY) * lvl;
                              return (
                                <g key={lvl}>
                                  <line x1="0" y1={y} x2="100%" y2={y} stroke="var(--color-secondary-container)" strokeWidth="0.5" opacity="0.2" />
                                  <text x="5" y={y - 2} fontSize="8" fill="var(--color-secondary-container)" opacity="0.5">{lvl === 0 ? 'START' : lvl === 1 ? 'END' : lvl}</text>
                                </g>
                              );
                            })}
                          </g>
                        )}
                        {d.type === 'text' && (
                          <text x={d.startX} y={d.startY} fill="var(--color-primary)" fontSize="10" fontWeight="bold">{d.text}</text>
                        )}
                      </React.Fragment>
                    ))}
                    {currentDrawing && (
                      <>
                        {currentDrawing.type === 'trend' && (
                          <line x1={currentDrawing.startX} y1={currentDrawing.startY} x2={currentDrawing.endX} y2={currentDrawing.endY} stroke="var(--color-primary)" strokeWidth="1.5" strokeDasharray="4 4" />
                        )}
                        {currentDrawing.type === 'fibo' && (
                          <line x1={currentDrawing.startX} y1={currentDrawing.startY} x2={currentDrawing.endX} y2={currentDrawing.endY} stroke="var(--color-primary)" strokeWidth="1" strokeDasharray="4 4" />
                        )}
                      </>
                    )}
                 </svg>

                 <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorPriceDashboard" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      hide
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      orientation="right" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.1)' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(28, 27, 31, 0.9)', border: 'none', borderRadius: '4px', fontSize: '10px' }}
                      itemStyle={{ color: 'var(--color-primary)' }}
                      isAnimationActive={false}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="var(--color-primary)" 
                      strokeWidth={1.5}
                      fillOpacity={1} 
                      fill="url(#colorPriceDashboard)" 
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col items-center justify-center text-center p-6 opacity-40">
                <Sparkles className="w-12 h-12 mb-4 text-primary opacity-20" />
                <h3 className="text-sm font-bold uppercase tracking-widest mb-2">Neural Synthesis Engine</h3>
                <p className="text-xs max-w-xs leading-relaxed">Trigger the Gemini engine for a multi-variable analysis including fundamental sentiment and institutional liquidity sweeps.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Right Sidebar: Signals & Actions */}
      <aside className="lg:col-span-3 bg-surface-container-low p-6 space-y-8">
        <div className="space-y-6">
          <AlphaSignals marketContext={marketContext} />
        </div>

        <div className="pt-8 border-t border-outline-variant/5">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-4 h-4 text-on-surface/40" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface/40">Auto-Reflex</h3>
          </div>
          <div className="p-4 bg-primary/5 rounded border border-primary/20">
            <p className="text-[10px] leading-relaxed text-on-surface/60 italic mb-4">
              System is monitoring {selectedAsset} for institutional liquidity sweeps around psychological levels.
            </p>
            <div className="flex items-center gap-2 text-[9px] font-bold text-primary uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Actively Scanning...
            </div>
          </div>
        </div>
      </aside>

      {/* Bottom Intelligence Feed */}
      <section className="lg:col-span-12 bg-surface-container-lowest p-6 border-t border-outline-variant/10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Newspaper className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Market Intelligence Feed</h3>
          </div>
          <div className="flex items-center gap-2">
            {["all", "Forex", "Crypto"].map((cat) => (
              <button
                key={cat}
                onClick={() => setNewsCategory(cat)}
                className={`px-3 py-1 rounded-sm text-[9px] font-bold uppercase tracking-[0.2em] transition-all border ${
                  newsCategory === cat ? "bg-primary/20 border-primary/40 text-primary" : "border-outline-variant/10 text-on-surface/40"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {newsLoading ? (
             Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 bg-outline-variant/5 animate-pulse rounded" />
            ))
          ) : (
            news.slice(0, 4).map((article, i) => (
              <NewsArticleCard key={article.title} article={article} index={i} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
