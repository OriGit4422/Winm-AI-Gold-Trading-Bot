import { Radio, TrendingUp, TrendingDown, Waves, ShieldCheck, Zap, BarChart, ChevronRight, X, Bolt, Activity, Radar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useMarketData } from "../services/marketService";

export function Alerts() {
  const { data: marketData, historyData } = useMarketData();
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [liveSignals, setLiveSignals] = useState<any[]>([]);
  const [lotSize, setLotSize] = useState("0.10");
  const [leverage, setLeverage] = useState("100");
  const [riskLimit, setRiskLimit] = useState("2.0");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Generate live signals based on market data
  useEffect(() => {
    if (marketData.length === 0) return;

    const generateSignal = () => {
      // Pick a random asset to analyze
      const asset = marketData[Math.floor(Math.random() * marketData.length)];
      const history = historyData[asset.id] || [];
      
      if (history.length < 10) return;

      const prices = history.map(h => h.price);
      const currentPrice = prices[prices.length - 1];
      const prevPrice = prices[prices.length - 2];
      
      // 1. Calculate Volatility (Standard Deviation of last 10 points)
      const mean = prices.slice(-10).reduce((a, b) => a + b, 0) / 10;
      const variance = prices.slice(-10).reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 10;
      const volatility = Math.sqrt(variance);
      const volRelative = (volatility / currentPrice) * 10000; // Basis points

      // 2. Calculate Momentum (Rate of change)
      const momentum = ((currentPrice - prices[prices.length - 10]) / prices[prices.length - 10]) * 100;

      // 3. Cross-Asset Correlation (Compare with Gold as benchmark)
      const gold = marketData.find(a => a.id === "XAU/USD");
      const goldTrend = gold?.trend || "up";
      const assetTrend = asset.trend;
      const isCorrelated = goldTrend === assetTrend;

      // 4. Signal Synthesis
      let type = "NEUTRAL SCAN";
      let trend: "up" | "down" = assetTrend;
      let confidence = 50;

      if (volRelative > 5 && Math.abs(momentum) > 0.05) {
        if (momentum > 0) {
          type = isCorrelated ? "BULLISH INSTITUTIONAL INFLOW" : "BULLISH DIVERGENCE DETECTED";
          trend = "up";
        } else {
          type = !isCorrelated ? "BEARISH LIQUIDITY SWEEP" : "BEARISH MOMENTUM ACCELERATION";
          trend = "down";
        }
        confidence = 75 + Math.min(volRelative * 2, 20) + Math.min(Math.abs(momentum) * 100, 5);
      } else if (volRelative > 8) {
        type = "HFT VOLATILITY SPIKE";
        confidence = 85;
      } else if (Math.abs(momentum) > 0.1) {
        type = momentum > 0 ? "ORDER BLOCK BREAKOUT" : "ORDER BLOCK REJECTION";
        confidence = 80;
      } else {
        // Fallback to a random interesting signal if conditions aren't met but we want to show something
        const types = ["VWAP DEVIATION", "LIQUIDITY GAP FILL", "CROSS-ASSET ARBITRAGE"];
        type = types[Math.floor(Math.random() * types.length)];
        confidence = 60 + Math.random() * 15;
      }

      const newSignal = {
        id: asset.id,
        type,
        time: "Just now",
        confidence: Math.min(confidence, 99.8).toFixed(1),
        trend,
        price: asset.price,
        volatility: volRelative.toFixed(2),
        momentum: momentum.toFixed(4) + "%",
        timestamp: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      setLiveSignals(prev => [newSignal, ...prev.slice(0, 4)]);
    };

    // Initial signals
    if (liveSignals.length === 0) {
      for(let i=0; i<3; i++) generateSignal();
    }

    const interval = setInterval(generateSignal, 8000);
    return () => clearInterval(interval);
  }, [marketData, liveSignals.length]);

  const signals = [
    { id: "XAU/USD", type: "BULLISH INSTITUTIONAL INFLOW", time: "2m ago", confidence: "92%", trend: "up", price: "2,341.82" },
    { id: "EUR/USD", type: "RESISTANCE BREAKOUT", time: "14m ago", confidence: "84%", trend: "down", price: "1.0842" },
    { id: "GBP/JPY", type: "LIQUIDITY SWEEP HIGH", time: "45m ago", confidence: "78%", trend: "up", price: "191.24" },
  ];

  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleTradeNow = (signal: any) => {
    setSelectedSignal(signal);
    setIsSuccess(false);
    setShowConfirmation(false);
    setShowDrawer(true);
  };

  const handleConfirmTrade = async () => {
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }
    setIsExecuting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsExecuting(false);
    setIsSuccess(true);
    
    console.log("Trade Confirmed:", {
      signal: selectedSignal?.id,
      lotSize,
      leverage,
      riskLimit
    });

    // Close after a short delay
    setTimeout(() => {
      setShowDrawer(false);
      setShowConfirmation(false);
    }, 2000);
  };

  const getSignalIcon = (type: string) => {
    if (type.includes("INFLOW")) return <Zap className="w-3 h-3 text-secondary-container" />;
    if (type.includes("SWEEP")) return <Waves className="w-3 h-3 text-tertiary-container" />;
    if (type.includes("VOLATILITY")) return <Activity className="w-3 h-3 text-primary" />;
    if (type.includes("BLOCK")) return <BarChart className="w-3 h-3 text-primary" />;
    return <ShieldCheck className="w-3 h-3 text-on-surface/40" />;
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 85) return "text-secondary-container";
    if (conf >= 70) return "text-primary";
    return "text-tertiary-container";
  };

  const getConfidenceBg = (conf: number) => {
    if (conf >= 85) return "bg-secondary-container";
    if (conf >= 70) return "bg-primary";
    return "bg-tertiary-container";
  };

  return (
    <div className="space-y-12">
      <section>
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-2">Alpha Alerts</h1>
        <p className="text-on-surface-variant text-lg max-w-2xl">
          Institutional-grade signals synthesized from dark pool liquidity and cross-asset volatility metrics.
        </p>
      </section>

      {/* New Real-Time Signal Feed */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-xl font-bold text-primary flex items-center gap-2">
            <Radar className="w-5 h-5 animate-pulse" />
            Live Alpha Feed
          </h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
            <Activity className="w-3 h-3 text-primary animate-bounce" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Real-Time Scanning</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {liveSignals.map((signal) => (
              <motion.div
                key={signal.timestamp}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                className="bg-surface-container-low border border-outline-variant/10 p-5 rounded-xl relative overflow-hidden group"
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${signal.trend === 'up' ? 'bg-secondary-container' : 'bg-tertiary-container'}`} />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-1.5 rounded-sm bg-surface-container-highest border border-outline-variant/10`}>
                      {getSignalIcon(signal.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-on-surface">{signal.id}</h3>
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${signal.trend === 'up' ? 'text-secondary-container' : 'text-tertiary-container'}`}>
                        {signal.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary tnum">{signal.price}</p>
                    <p className="text-[9px] text-on-surface/40 font-bold uppercase">{signal.time}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-on-surface/40">Signal Confidence</span>
                    <span className={getConfidenceColor(parseFloat(signal.confidence))}>{signal.confidence}%</span>
                  </div>
                  <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${signal.confidence}%` }}
                      className={`h-full ${getConfidenceBg(parseFloat(signal.confidence))}`} 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {signal.volatility && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-surface-container-highest rounded text-[9px] font-bold text-on-surface/40">
                        <Waves className="w-2.5 h-2.5" />
                        VOL: {signal.volatility}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleTradeNow(signal)}
                    className="px-4 py-2 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest rounded hover:bg-primary/90 transition-all active:scale-95"
                  >
                    Trade Now
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-xl font-bold text-primary-container uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4" />
              Active Signals
            </h2>
            <span className="text-xs text-on-surface-variant/60 uppercase tracking-widest">Live Updates • 34ms Latency</span>
          </div>

          {signals.map((signal, i) => (
            <div
              key={i}
              className={`group relative bg-surface-container-low rounded-sm p-6 transition-all hover:bg-surface-container border-l-2 ${
                signal.trend === "up" ? "border-secondary-container" : "border-tertiary-container"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`${signal.trend === "up" ? "bg-secondary-container/10 text-secondary-container" : "bg-tertiary-container/10 text-tertiary-container"} p-3 rounded-sm`}>
                    {signal.trend === "up" ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-headline text-xl font-bold">{signal.id}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-sm uppercase font-bold tracking-tighter ${
                        signal.trend === "up" ? "bg-secondary-container/20 text-secondary-container" : "bg-tertiary-container/20 text-tertiary-container"
                      }`}>
                        {signal.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                      <span className="flex items-center gap-1">{signal.time}</span>
                      <span className={`flex items-center gap-1 ${signal.trend === "up" ? "text-secondary-container" : "text-primary"}`}>
                        <ShieldCheck className="w-3 h-3" /> {signal.confidence} Confidence
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-5 py-2 text-xs font-bold uppercase tracking-widest text-on-surface border border-outline-variant/30 hover:border-primary transition-all">
                    View Analysis
                  </button>
                  <button 
                    onClick={() => handleTradeNow(signal)}
                    className="gold-gradient px-5 py-2 text-xs font-bold uppercase tracking-widest text-on-primary rounded-sm shadow-lg active:scale-95 transition-all"
                  >
                    Trade Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-sm p-6">
            <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-6">Market Sentiment</h2>
            <div className="space-y-6">
              {[
                { label: "Gold (XAU)", value: 82, status: "Bullish", color: "bg-secondary-container" },
                { label: "EUR/USD", value: 64, status: "Bearish", color: "bg-tertiary-container" },
                { label: "Indices (DXY)", value: 51, status: "Neutral", color: "bg-primary-container" },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-xs uppercase">
                    <span className="text-on-surface">{item.label}</span>
                    <span className={item.color.replace("bg-", "text-")}>{item.value}% {item.status}</span>
                  </div>
                  <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden flex">
                    <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-[0.2em]">Signal History</h2>
            <div className="bg-surface-container-low/50 divide-y divide-outline-variant/10">
              {[
                { pair: "BTC/USD", time: "Closed 4h ago", status: "Hit Target", color: "text-secondary-container" },
                { pair: "USD/JPY", time: "Closed 12h ago", status: "Hit Target", color: "text-secondary-container" },
                { pair: "XAU/USD", time: "Closed 1d ago", status: "Stopped Out", color: "text-on-surface-variant" },
              ].map((item, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{item.pair}</p>
                    <p className="text-[10px] text-on-surface-variant/60 uppercase">{item.time}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-sm bg-surface-container-highest ${item.color}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 hover:text-primary transition-colors">
              View All Archive
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDrawer && selectedSignal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isExecuting && setShowDrawer(false)}
              className="fixed inset-0 bg-surface/80 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed inset-0 m-auto z-[101] w-full max-w-lg h-fit bg-surface-container rounded-xl shadow-2xl border border-outline-variant/20 overflow-hidden"
            >
              <div className="px-8 py-10 space-y-8">
                {isSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-10 text-center space-y-4"
                  >
                    <div className="w-20 h-20 bg-secondary-container/20 rounded-full flex items-center justify-center text-secondary-container">
                      <ShieldCheck className="w-12 h-12" />
                    </div>
                    <h2 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight uppercase">Trade Executed</h2>
                    <p className="text-on-surface-variant text-sm max-w-xs">
                      Your order for <span className="font-bold text-on-surface">{selectedSignal.id}</span> has been successfully placed on the network.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
                          {selectedSignal.id} <span className={selectedSignal.trend === "up" ? "text-secondary-container" : "text-tertiary-container"}>
                            {selectedSignal.trend === "up" ? "BULLISH" : "BEARISH"}
                          </span>
                        </h2>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-on-surface-variant text-xs uppercase tracking-widest">Entry Signal</span>
                          <span className="text-2xl font-bold tnum text-primary">{selectedSignal.price}</span>
                        </div>
                      </div>
                      <button onClick={() => setShowDrawer(false)} className="text-on-surface/40 hover:text-on-surface transition-colors">
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    {showConfirmation ? (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                         <div className="bg-surface-container-highest/50 p-6 rounded-lg border border-primary/20 space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-primary">Trade Confirmation Summary</h3>
                            <div className="grid grid-cols-2 gap-y-4">
                               <div className="flex flex-col">
                                 <span className="text-[10px] text-on-surface/30 uppercase font-black">Asset</span>
                                 <span className="text-sm font-bold">{selectedSignal.id}</span>
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-[10px] text-on-surface/30 uppercase font-black">Direction</span>
                                 <span className={`text-sm font-bold ${selectedSignal.trend === 'up' ? 'text-secondary-container' : 'text-tertiary-container'}`}>{selectedSignal.trend === 'up' ? 'BUY / LONG' : 'SELL / SHORT'}</span>
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-[10px] text-on-surface/30 uppercase font-black">Volume</span>
                                 <span className="text-sm font-bold">{lotSize} Lots</span>
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-[10px] text-on-surface/30 uppercase font-black">Leverage</span>
                                 <span className="text-sm font-bold">{leverage}x</span>
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-[10px] text-on-surface/30 uppercase font-black">Risk Param</span>
                                 <span className="text-sm font-bold">{riskLimit}% Portfolio</span>
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-[10px] text-on-surface/30 uppercase font-black">Execution Mode</span>
                                 <span className="text-sm font-bold text-primary">MARKET (INSTANT)</span>
                               </div>
                            </div>
                         </div>
                         <div className="p-3 bg-secondary-container/5 rounded border border-secondary-container/10 flex items-center gap-3">
                           <ShieldCheck className="w-5 h-5 text-secondary-container" />
                           <p className="text-[10px] text-on-surface/60 font-medium italic">
                             Institutional execution verified. Press confirm to transmit order to liquidity pool.
                           </p>
                         </div>
                      </motion.div>
                    ) : (
                      <>
                        <div className="bg-surface-container-highest/30 p-5 rounded-lg border border-outline-variant/20">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Bolt className="w-5 h-5 text-primary fill-primary" />
                              <div>
                                <p className="font-bold text-sm tracking-tight">TRADE EXECUTION</p>
                                <p className="text-[10px] text-on-surface/50 uppercase tracking-widest">Manual Override Active</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-primary/5 border-l-2 border-primary p-3">
                            <p className="text-xs text-primary leading-relaxed">
                              Configure your parameters below to execute the trade on the <span className="font-bold">{selectedSignal.id}</span> pair.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Lot Size</label>
                        <div className="bg-surface-container-lowest p-1 rounded border border-outline-variant/20 focus-within:border-primary transition-colors flex items-center">
                          <input 
                            type="number" 
                            step="0.01"
                            value={lotSize}
                            onChange={(e) => setLotSize(e.target.value)}
                            className="w-full bg-transparent p-3 text-base font-medium tnum outline-none text-on-surface"
                          />
                          <span className="text-[10px] text-on-surface/40 pr-4 font-bold">LOTS</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Leverage</label>
                          <div className="bg-surface-container-lowest p-1 rounded border border-outline-variant/20 focus-within:border-primary transition-colors flex items-center">
                            <input 
                              type="number" 
                              value={leverage}
                              onChange={(e) => setLeverage(e.target.value)}
                              className="w-full bg-transparent p-3 text-base font-medium tnum outline-none text-on-surface"
                            />
                            <span className="text-[10px] text-on-surface/40 pr-4 font-bold">X</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Risk Limit</label>
                          <div className="bg-surface-container-lowest p-1 rounded border border-outline-variant/20 focus-within:border-primary transition-colors flex items-center">
                            <input 
                              type="number" 
                              step="0.1"
                              value={riskLimit}
                              onChange={(e) => setRiskLimit(e.target.value)}
                              className="w-full bg-transparent p-3 text-base font-medium tnum outline-none text-on-surface"
                            />
                            <span className="text-[10px] text-on-surface/40 pr-4 font-bold">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 space-y-3">
                      <button 
                        onClick={handleConfirmTrade}
                        disabled={isExecuting}
                        className={`w-full h-14 gold-gradient text-on-primary font-headline font-extrabold text-sm tracking-widest rounded-sm shadow-lg active:scale-95 transition-all uppercase flex items-center justify-center gap-3 ${isExecuting ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isExecuting ? (
                          <>
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                              className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full"
                            />
                            Executing...
                          </>
                        ) : (
                          showConfirmation ? "Confirm Institutional Order" : "Proceed to Confirmation"
                        )}
                      </button>
                      <button 
                        onClick={() => setShowDrawer(false)}
                        disabled={isExecuting}
                        className="w-full py-3 text-on-surface/40 text-[10px] uppercase tracking-[0.3em] hover:text-on-surface transition-colors disabled:opacity-30"
                      >
                        Cancel Trade
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
