import { Search, DollarSign, Bitcoin, Euro, ArrowUpRight, ArrowDownRight, X, Activity, BarChart3, TrendingUp, Star, StarOff, PanelRight, Clock } from "lucide-react";
import { useMarketData, useAssetHistory, Timeframe } from "../services/marketService";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function LiveOrderBook({ basePrice, assetId }: { basePrice: number, assetId: string }) {
  const { orderBooks } = useMarketData();
  const book = orderBooks[assetId];

  // Fallback to simulated data if real data isn't available
  const [simulatedBook, setSimulatedBook] = useState<{ bids: [number, number][], asks: [number, number][] }>({ bids: [], asks: [] });

  useEffect(() => {
    if (book) return;

    const generateLevels = (base: number, side: 'buy' | 'sell') => {
      return Array.from({ length: 10 }).map((_, i) => {
        const offset = (i + 1) * (base * 0.0001);
        const price = side === 'buy' ? base - offset : base + offset;
        const size = Math.random() * (assetId.includes("BTC") ? 0.5 : 10) + 0.01;
        return [price, size] as [number, number];
      });
    };

    setSimulatedBook({
      bids: generateLevels(basePrice, 'buy'),
      asks: generateLevels(basePrice, 'sell')
    });

    const interval = setInterval(() => {
      setSimulatedBook(prev => ({
        bids: prev.bids.map(([p, s]) => [p + (Math.random() - 0.5) * (basePrice * 0.00001), s * (0.9 + Math.random() * 0.2)]),
        asks: prev.asks.map(([p, s]) => [p + (Math.random() - 0.5) * (basePrice * 0.00001), s * (0.9 + Math.random() * 0.2)])
      } as any));
    }, 1000);

    return () => clearInterval(interval);
  }, [basePrice, assetId, book]);

  const currentBook = book || simulatedBook;
  const maxTotal = Math.max(
    ...currentBook.bids.map(b => b[1]),
    ...currentBook.asks.map(a => a[1])
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Bids */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-secondary-container/40 mb-2 px-1">
          <span>Size</span>
          <span>Bid Price</span>
        </div>
        <div className="space-y-0.5">
          {currentBook.bids.map(([price, size], i) => (
            <div key={i} className="relative h-6 flex items-center px-2 group overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(size / maxTotal) * 100}%` }}
                className="absolute right-0 top-0 bottom-0 bg-secondary-container/5 group-hover:bg-secondary-container/10 transition-colors"
              />
              <div className="relative z-10 w-full flex justify-between items-center text-[10px] font-mono">
                <span className="text-on-surface/40">{size.toFixed(assetId.includes("BTC") ? 4 : 2)}</span>
                <span className="text-secondary-container font-bold">{price.toFixed(basePrice > 1000 ? 2 : 5)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Asks */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-tertiary-container/40 mb-2 px-1">
          <span>Ask Price</span>
          <span>Size</span>
        </div>
        <div className="space-y-0.5">
          {currentBook.asks.map(([price, size], i) => (
            <div key={i} className="relative h-6 flex items-center px-2 group overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(size / maxTotal) * 100}%` }}
                className="absolute left-0 top-0 bottom-0 bg-tertiary-container/5 group-hover:bg-tertiary-container/10 transition-colors"
              />
              <div className="relative z-10 w-full flex justify-between items-center text-[10px] font-mono">
                <span className="text-tertiary-container font-bold">{price.toFixed(basePrice > 1000 ? 2 : 5)}</span>
                <span className="text-on-surface/40">{size.toFixed(assetId.includes("BTC") ? 4 : 2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Markets({ onSelectAsset }: { onSelectAsset?: (id: string) => void }) {
  const { data: marketData, isConnected } = useMarketData();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("1m");
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem("winm_watchlist");
    return saved ? JSON.parse(saved) : [];
  });
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);

  useEffect(() => {
    if (selectedAssetId && onSelectAsset) {
      onSelectAsset(selectedAssetId);
      setSelectedAssetId(null); // Clear local so global handles it
    }
  }, [selectedAssetId, onSelectAsset]);

  useEffect(() => {
    localStorage.setItem("winm_watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleWatchlist = (id: string) => {
    setWatchlist(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const staticAssets = [
    { id: "XAU/USD", name: "Gold / US Dollar", type: "commodity", category: "Commodities" },
    { id: "EUR/USD", name: "Euro / US Dollar", type: "forex", category: "Forex" },
    { id: "BTC/USD", name: "Bitcoin / US Dollar", type: "crypto", category: "Crypto" },
    { id: "GBP/JPY", name: "Pound / Yen", type: "forex", category: "Forex" },
    { id: "ETH/USD", name: "Ethereum / US Dollar", type: "crypto", category: "Crypto" },
    { id: "USD/JPY", name: "Dollar / Yen", type: "forex", category: "Forex" },
  ];

  const assets = staticAssets.map(sa => {
    const live = marketData.find(a => a.id === sa.id);
    const priceNum = live ? parseFloat(live.price.replace(/,/g, '')) : 0;
    return {
      ...sa,
      price: live?.price || "---",
      change: live?.change || "0.00%",
      trend: live?.trend || "up",
      spread: live ? (Math.abs(Math.sin(priceNum)) * 0.4 + 0.1).toFixed(1) : "0.0",
      volume: live ? (Math.abs(Math.cos(priceNum)) * 100 + 50).toFixed(2) + "M" : "0.00M"
    };
  });

  const selectedAsset = assets.find(a => a.id === selectedAssetId);
  const monitorAsset = selectedAsset || assets[0];
  const history = useAssetHistory(selectedAssetId || monitorAsset?.id || "XAU/USD", timeframe, 40);

  return (
    <div className="space-y-8 relative">
      {/* Live Price Feed Monitor */}
      <section className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-6 overflow-hidden relative cursor-pointer" onClick={() => onSelectAsset?.(monitorAsset?.id)}>
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                {monitorAsset?.type === "commodity" && <DollarSign className="w-8 h-8 text-primary" />}
                {monitorAsset?.type === "forex" && <Euro className="w-8 h-8 text-on-surface/60" />}
                {monitorAsset?.type === "crypto" && <Bitcoin className="w-8 h-8 text-primary" />}
              </div>
              <div className="absolute -top-1 -right-1">
                <div className="relative">
                  <div className="w-3 h-3 bg-secondary-container rounded-full border-2 border-surface-container-low" />
                  <div className="absolute inset-0 bg-secondary-container/40 rounded-full animate-ping" />
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-on-surface tracking-tight">{monitorAsset?.id}</h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  monitorAsset?.trend === "up" ? "bg-secondary-container/10 text-secondary-container" : "bg-tertiary-container/10 text-tertiary-container"
                }`}>
                  {monitorAsset?.change}
                </span>
              </div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.2em]">{monitorAsset?.name}</p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end">
            <motion.div 
              key={monitorAsset?.price}
              initial={{ opacity: 0.5, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-primary tracking-tighter tnum mb-1"
            >
              {monitorAsset?.price}
            </motion.div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              Last Update: {new Date().toLocaleTimeString()}
            </div>
          </div>

          <div className="hidden lg:block w-48 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.slice(-20)}>
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="var(--color-primary)" 
                  strokeWidth={2} 
                  fill="var(--color-primary)" 
                  fillOpacity={0.1} 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Global Markets</h2>
            <button 
              onClick={() => setIsWatchlistOpen(!isWatchlistOpen)}
              className={`p-2 rounded-full transition-all ${isWatchlistOpen ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface/60 hover:text-primary'}`}
              title="Toggle Watchlist"
            >
              <PanelRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-on-surface-variant text-sm uppercase tracking-widest">Real-time asset liquidity & performance</p>
        </div>
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/40 group-focus-within:text-primary transition-colors" />
          <input
            className="w-full bg-surface-container-highest border-0 border-b border-outline-variant/20 focus:border-primary focus:ring-0 text-on-surface placeholder:text-on-surface/30 pl-12 pr-4 py-3 text-sm rounded-t-sm transition-all"
            placeholder="Search assets, symbols or tags..."
            type="text"
          />
        </div>
      </div>

      <div className="flex gap-6 relative">
        <div className="flex-1 space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {["All Assets", "Forex", "Crypto", "Commodities", "Indices"].map((cat, i) => (
              <button
                key={cat}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
                  i === 0 ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface/60 hover:bg-surface-container-high"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="bg-surface-container-lowest overflow-hidden rounded-lg border border-outline-variant/10">
            <div className="grid grid-cols-12 px-6 py-4 border-b border-outline-variant/10 text-on-surface/40 text-[10px] font-bold uppercase tracking-[0.2em]">
              <div className="col-span-4">Asset</div>
              <div className="col-span-3 text-right">Price</div>
              <div className="col-span-3 text-center">1H Trend</div>
              <div className="col-span-2 text-right">Change</div>
            </div>

            <div className="divide-y divide-outline-variant/5">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="grid grid-cols-12 px-6 py-6 items-center hover:bg-surface-container-low transition-colors group cursor-pointer"
                >
                  <div className="col-span-4 flex items-center gap-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(asset.id);
                      }}
                      className={`p-1.5 rounded-full transition-colors ${watchlist.includes(asset.id) ? 'text-primary' : 'text-on-surface/20 hover:text-on-surface/40'}`}
                    >
                      {watchlist.includes(asset.id) ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                    </button>
                    <div 
                      onClick={() => setSelectedAssetId(asset.id)}
                      className="flex items-center gap-4 flex-1"
                    >
                      <div className="w-10 h-10 bg-surface-container-high rounded-sm flex items-center justify-center border border-outline-variant/10">
                        {asset.type === "commodity" && <DollarSign className="w-5 h-5 text-primary" />}
                        {asset.type === "forex" && <Euro className="w-5 h-5 text-on-surface/60" />}
                        {asset.type === "crypto" && <Bitcoin className="w-5 h-5 text-primary" />}
                      </div>
                      <div>
                        <div className="font-headline font-bold text-on-surface">{asset.id}</div>
                        <div className="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest">{asset.name}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3 text-right" onClick={() => setSelectedAssetId(asset.id)}>
                    <motion.div 
                      key={asset.price}
                      initial={{ opacity: 0.8 }}
                      animate={{ opacity: 1 }}
                      className={`text-xl font-bold tnum tracking-tight px-2 py-1 rounded-sm inline-block ${
                        asset.trend === "up" ? "bg-secondary-container/10 text-secondary-container" : "bg-tertiary-container/10 text-tertiary-container"
                      }`}
                    >
                      {asset.price}
                    </motion.div>
                  </div>
                  <div className="col-span-3 px-8" onClick={() => setSelectedAssetId(asset.id)}>
                    <div className="h-8 w-full relative">
                      <svg className={`w-full h-full stroke-2 fill-none overflow-visible ${
                        asset.trend === "up" ? "stroke-secondary-container" : "stroke-tertiary-container"
                      }`} preserveAspectRatio="none">
                        <path
                          d={asset.trend === "up" 
                            ? "M0 25 L10 20 L20 28 L30 15 L40 22 L50 10 L60 18 L70 5 L80 12 L90 8 L100 2"
                            : "M0 5 L10 15 L20 10 L30 25 L40 18 L50 22 L60 15 L70 28 L80 20 L90 25 L100 30"
                          }
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className={`col-span-2 text-right font-bold tnum ${
                    asset.trend === "up" ? "text-secondary-container" : "text-tertiary-container"
                  }`} onClick={() => setSelectedAssetId(asset.id)}>
                    {asset.change}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isWatchlistOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0, x: 20 }}
              animate={{ width: 320, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: 20 }}
              className="hidden xl:block overflow-hidden"
            >
              <div className="w-80 bg-surface-container-lowest border border-outline-variant/10 rounded-lg h-full flex flex-col">
                <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary fill-current" />
                    My Watchlist
                  </h3>
                  <button onClick={() => setIsWatchlistOpen(false)} className="text-on-surface/40 hover:text-on-surface">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {watchlist.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <Star className="w-8 h-8 text-on-surface/10 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/30 leading-relaxed">
                        Your watchlist is empty. Click the star icon to add assets.
                      </p>
                    </div>
                  ) : (
                    watchlist.map(id => {
                      const asset = assets.find(a => a.id === id);
                      if (!asset) return null;
                      return (
                        <div 
                          key={id} 
                          onClick={() => setSelectedAssetId(id)}
                          className="p-3 bg-surface-container-low hover:bg-surface-container-high rounded border border-outline-variant/5 transition-all cursor-pointer group"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-on-surface">{id}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWatchlist(id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-tertiary-container hover:text-tertiary transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex justify-between items-end">
                            <span className="text-lg font-bold tnum tracking-tight">{asset.price}</span>
                            <span className={`text-[10px] font-bold ${asset.trend === 'up' ? 'text-secondary-container' : 'text-tertiary-container'}`}>
                              {asset.change}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-panel p-8 rounded-sm relative overflow-hidden min-h-[300px] flex flex-col justify-end">
          <img
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
            src="https://picsum.photos/seed/trading/1200/800"
            alt="Market Analysis"
            referrerPolicy="no-referrer"
          />
          <div className="relative z-10">
            <span className="px-3 py-1 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm mb-4 inline-block">
              Alpha Alert
            </span>
            <h3 className="font-headline text-4xl font-extrabold text-on-surface leading-tight mb-4 max-w-lg">
              Gold's Bullish Run: Institutional Inflows Hit 5-Year High
            </h3>
            <button className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs hover:gap-4 transition-all">
              Read Full Analysis <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="bg-surface-container p-8 rounded-sm border border-outline-variant/10 flex flex-col justify-between">
          <div>
            <h4 className="font-headline font-bold text-on-surface mb-2">Market Sentiment</h4>
            <p className="text-on-surface-variant text-sm mb-8 italic">Based on top 50 global indicators</p>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface/60">
                  <span>Bullish</span>
                  <span className="text-secondary-container">68%</span>
                </div>
                <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-secondary-container w-[68%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface/60">
                  <span>Volatility Index</span>
                  <span className="text-primary">Low</span>
                </div>
                <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[25%]" />
                </div>
              </div>
            </div>
          </div>
          <div className="pt-8">
            <button className="w-full py-3 bg-surface-container-highest border border-outline-variant/20 text-on-surface text-xs font-bold uppercase tracking-widest hover:bg-surface-variant transition-colors">
              Configure Alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
