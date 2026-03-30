import { useState } from "react";
import { TrendingUp, Play, Pause, Settings, Plus, ArrowUpRight, Activity, ExternalLink, Newspaper, Filter } from "lucide-react";
import { motion } from "motion/react";
import { useMarketData, useAssetHistory } from "../services/marketService";
import { useNewsFeed } from "../services/newsService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

export function Dashboard() {
  const { data: marketData } = useMarketData();
  const [newsCategory, setNewsCategory] = useState("all");
  const { news, loading: newsLoading, error: newsError } = useNewsFeed(newsCategory);
  const xauHistory = useAssetHistory("XAU/USD", "1m", 20);

  // Find specific assets for display
  const gold = marketData.find(a => a.id === "XAU/USD");
  const eur = marketData.find(a => a.id === "EUR/USD");
  const btc = marketData.find(a => a.id === "BTC/USD");

  const bots = [
    { 
      name: "Gold Scalper V2", 
      pair: "XAU/USD · M5 TF", 
      profit: "+$312.40", 
      winRate: "72.4%", 
      status: "Running", 
      livePrice: gold?.price,
      avgDuration: "14m",
      streak: "8W / 2L",
      dailyPL: "+$412.10",
      profitFactor: "1.82",
      sharpeRatio: "2.1",
      recentResults: ["W", "W", "L", "W", "W", "W", "W", "L"]
    },
    { 
      name: "EUR/USD Trend", 
      pair: "EUR/USD · H1 TF", 
      profit: "+$88.12", 
      winRate: "58.2%", 
      status: "Running", 
      livePrice: eur?.price,
      avgDuration: "2.4h",
      streak: "4W / 3L",
      dailyPL: "+$92.45",
      profitFactor: "1.45",
      sharpeRatio: "1.6",
      recentResults: ["W", "L", "W", "L", "L", "W", "W"]
    },
    { 
      name: "BTC Arbitrage", 
      pair: "BTC/USDT · Multi-Ex", 
      profit: "$0.00", 
      winRate: "--", 
      status: "Paused", 
      livePrice: btc?.price,
      avgDuration: "42s",
      streak: "12W / 1L",
      dailyPL: "$0.00",
      profitFactor: "2.10",
      sharpeRatio: "3.2",
      recentResults: ["W", "W", "W", "W", "W", "W", "W"]
    },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Section: Total Performance */}
      <section className="relative">
        <div className="glass-panel p-8 rounded-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent" />
          <div className="flex flex-col lg:flex-row justify-between items-stretch gap-8 relative z-10">
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-[0.2em] mb-4">
                  Total Performance
                </h2>
                <div className="flex items-baseline gap-4">
                  <span className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface">
                    +$522.93
                  </span>
                  <div className="flex items-center gap-1 text-secondary-container bg-secondary-container/10 px-3 py-1 rounded-sm mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-bold text-sm">+4.2%</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 space-y-1">
                <p className="text-on-surface/40 text-[10px] tracking-[0.2em] uppercase font-bold">
                  Live Asset Monitor
                </p>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Activity className="w-4 h-4 text-primary" />
                    <div className="absolute inset-0 bg-primary/40 rounded-full animate-ping" />
                  </div>
                  <span className="text-lg font-bold text-on-surface tracking-tight">XAU/USD</span>
                  <span className="text-primary font-bold tnum text-lg">{gold?.price || "---"}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${gold?.trend === 'up' ? 'bg-secondary-container/10 text-secondary-container' : 'bg-tertiary-container/10 text-tertiary-container'}`}>
                    {gold?.change || "0.00%"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 h-48 md:h-64 min-w-[300px] bg-surface-container-lowest/30 rounded-sm border border-outline-variant/5 p-4 relative group cursor-crosshair">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">XAU/USD Real-Time Chart</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-secondary-container rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold text-secondary-container uppercase tracking-tighter">Live Feed</span>
                </div>
              </div>
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <div className="px-2 py-0.5 bg-surface-container-high rounded text-[9px] font-bold text-on-surface/60 border border-outline-variant/10">M5</div>
                <div className="px-2 py-0.5 bg-primary/10 rounded text-[9px] font-bold text-primary border border-primary/20">LIVE</div>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={xauHistory}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    hide 
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    hide 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#151619', border: '1px solid #2a2a2a', borderRadius: '4px' }}
                    itemStyle={{ color: '#d4af37', fontWeight: 'bold' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#d4af37" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Active Bots Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="font-headline text-lg font-bold text-on-surface tracking-tight">Active Bots</h3>
            <span className="bg-surface-container-high px-2 py-0.5 rounded-sm text-[10px] font-bold text-primary border border-outline-variant/20 uppercase tracking-widest">
              3 Running
            </span>
          </div>
          <button className="gold-gradient text-on-primary text-xs font-bold px-6 py-2.5 rounded-sm tracking-widest uppercase flex items-center gap-2 active:scale-95 transition-all shadow-[0_8px_16px_-4px_rgba(212,175,55,0.3)]">
            <Plus className="w-4 h-4" />
            New Bot Setup
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-6 -mx-2 px-2 no-scrollbar">
          {bots.map((bot, i) => (
            <div
              key={i}
              className="min-w-[340px] bg-surface-container-low p-6 rounded-lg border border-outline-variant/10 hover:border-primary/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-sm bg-surface-container-high flex items-center justify-center border border-outline-variant/20">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col items-end">
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-sm ${
                    bot.status === "Running" ? "bg-secondary-container/10 text-secondary-container" : "bg-tertiary-container/10 text-tertiary-container"
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${bot.status === "Running" ? "bg-secondary-container" : "bg-tertiary-container"}`} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{bot.status}</span>
                  </div>
                  {bot.livePrice && (
                    <motion.span 
                      key={bot.livePrice}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[10px] font-bold text-primary mt-1 tnum"
                    >
                      LIVE: {bot.livePrice}
                    </motion.span>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-headline font-bold text-on-surface text-lg mb-1">{bot.name}</h4>
                <p className="text-xs text-on-surface/40 uppercase tracking-widest">{bot.pair}</p>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 pt-6 border-t border-outline-variant/5">
                <div>
                  <span className="block text-[10px] text-on-surface/40 uppercase mb-1 font-bold tracking-wider">Session Profit</span>
                  <span className={`font-semibold text-lg tnum ${bot.profit.startsWith("+") ? "text-secondary-container" : "text-on-surface"}`}>
                    {bot.profit}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-on-surface/40 uppercase mb-1 font-bold tracking-wider">Win Rate</span>
                  <span className="font-semibold text-on-surface text-lg tnum">{bot.winRate}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-on-surface/40 uppercase mb-1 font-bold tracking-wider">Daily P/L</span>
                  <span className={`font-semibold text-sm tnum ${bot.dailyPL.startsWith("+") ? "text-secondary-container" : "text-on-surface"}`}>
                    {bot.dailyPL}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-on-surface/40 uppercase mb-1 font-bold tracking-wider">Avg Duration</span>
                  <span className="font-semibold text-on-surface text-sm tnum">{bot.avgDuration}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-on-surface/40 uppercase mb-1 font-bold tracking-wider">Profit Factor</span>
                  <span className="font-semibold text-on-surface text-sm tnum">{bot.profitFactor}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-on-surface/40 uppercase mb-1 font-bold tracking-wider">Sharpe Ratio</span>
                  <span className="font-semibold text-on-surface text-sm tnum">{bot.sharpeRatio}</span>
                </div>
                <div className="col-span-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="block text-[10px] text-on-surface/40 uppercase font-bold tracking-wider">Max Streak (W/L)</span>
                    <span className="font-semibold text-on-surface text-sm tnum tracking-widest">{bot.streak}</span>
                  </div>
                  <div className="flex gap-1">
                    {bot.recentResults?.map((res, idx) => (
                      <div 
                        key={idx} 
                        className={`w-2 h-2 rounded-full ${res === "W" ? "bg-secondary-container shadow-[0_0_4px_#00b954]" : "bg-tertiary-container shadow-[0_0_4px_#ff4d4d]"}`}
                        title={res === "W" ? "Win" : "Loss"}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Markets Brief */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-headline font-bold text-on-surface">Market Heatmap</h3>
            <div className="flex gap-4">
              <button className="text-[10px] font-bold uppercase tracking-widest text-primary border-b border-primary pb-1">
                Forex
              </button>
              <button className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40 pb-1">
                Crypto
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {[
              { name: "EURUSD", intensity: 40 },
              { name: "GBPUSD", intensity: 20 },
              { name: "USDJPY", intensity: 10, type: "bear" },
              { name: "XAUUSD", intensity: 80 },
              { name: "AUDUSD", intensity: 5 },
              { name: "USDCHF", intensity: 30, type: "bear" },
              { name: "BTCUSD", intensity: 90 },
              { name: "ETHUSD", intensity: 70 },
              { name: "GBPJPY", intensity: 50 },
              { name: "USDCAD", intensity: 15, type: "bear" },
              { name: "NZDUSD", intensity: 10 },
              { name: "XAGUSD", intensity: 45 },
            ].map((market, i) => (
              <div
                key={i}
                className={`aspect-square flex items-center justify-center rounded-sm border transition-all hover:scale-105 cursor-pointer ${
                  market.type === "bear"
                    ? "bg-tertiary-container/20 border-tertiary-container/10"
                    : market.intensity > 0
                    ? "bg-secondary-container/20 border-secondary-container/10"
                    : "bg-surface-container-high border-outline-variant/10"
                }`}
                style={{ opacity: market.intensity ? market.intensity / 100 + 0.4 : 1 }}
              >
                <span className="text-[10px] font-bold">{market.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/10 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-headline font-bold text-on-surface mb-6">Risk Profile</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface/60">Max Drawdown</span>
                <span className="font-bold text-tertiary-container">3.2%</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                <div className="bg-tertiary-container h-full w-[32%]" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-on-surface/60">Leverage Use</span>
                <span className="font-bold text-on-surface">1:24</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[60%]" />
              </div>
            </div>
          </div>
          <div className="mt-8 p-4 bg-surface-container-lowest border border-outline-variant/10 rounded-sm">
            <p className="text-[11px] leading-relaxed text-on-surface/60">
              <span className="text-primary font-bold">SYSTEM NOTE:</span> All algorithmic safety parameters are active.
              Equity protection threshold set at $11,500.00.
            </p>
          </div>
        </div>
      </section>

      {/* Real-time News Feed */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="font-headline text-lg font-bold text-on-surface tracking-tight">Market Intelligence</h3>
            <div className="flex items-center gap-2 bg-surface-container-high px-2 py-0.5 rounded-sm">
              <Newspaper className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Live Feed</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
            <div className="flex items-center gap-1.5 mr-2 text-on-surface/40">
              <Filter className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Filter:</span>
            </div>
            {["all", "Forex", "Crypto", "Commodities"].map((cat) => (
              <button
                key={cat}
                onClick={() => setNewsCategory(cat)}
                className={`px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  newsCategory === cat
                    ? "bg-primary/10 border-primary/40 text-primary shadow-[0_0_10px_rgba(212,175,55,0.1)]"
                    : "bg-surface-container-high border-outline-variant/10 text-on-surface/40 hover:text-on-surface/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/10 animate-pulse space-y-4">
                <div className="h-4 bg-outline-variant/20 rounded w-3/4" />
                <div className="h-20 bg-outline-variant/10 rounded w-full" />
                <div className="h-3 bg-outline-variant/20 rounded w-1/4" />
              </div>
            ))
          ) : newsError ? (
            <div className="col-span-full p-8 bg-surface-container-low border border-outline-variant/10 rounded-lg text-center">
              <p className="text-on-surface/60 text-sm mb-4">{newsError}</p>
              <p className="text-[10px] text-on-surface/40 uppercase tracking-widest">
                Please ensure <code className="text-primary">VITE_NEWS_API_KEY</code> is configured in your environment.
              </p>
            </div>
          ) : news.length > 0 ? (
            news.map((article, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/10 hover:border-primary/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{article.source.name}</span>
                    <span className="text-[10px] text-on-surface/40 font-bold">{new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h4 className="font-headline font-bold text-on-surface leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h4>
                  <p className="text-xs text-on-surface/60 leading-relaxed line-clamp-3 mb-6">
                    {article.description}
                  </p>
                </div>
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface/40 hover:text-primary transition-colors self-start"
                >
                  Read Full Report
                  <ExternalLink className="w-3 h-3" />
                </a>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full p-8 bg-surface-container-low border border-outline-variant/10 rounded-lg text-center">
              <p className="text-on-surface/60 text-sm">No news articles found at the moment.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
