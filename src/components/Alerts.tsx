import { Radio, TrendingUp, TrendingDown, ShieldCheck, RefreshCw, X, Bolt, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { useSignals } from "../services/signalService";
import { executeTrade, useTrades } from "../services/tradeService";
import { useMarketData } from "../services/marketService";

export function Alerts() {
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [lotSize, setLotSize] = useState("0.10");
  const [leverage, setLeverage] = useState("100");
  const [riskLimit, setRiskLimit] = useState("2.0");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);

  const { signals, loading: signalsLoading, error: signalsError, lastUpdated, refresh } = useSignals(30000);
  const { trades } = useTrades();
  const { data: marketData } = useMarketData();

  // Sentiment derived from live market data
  const sentimentItems = [
    { label: "Gold (XAU)", id: "XAU/USD" },
    { label: "EUR/USD", id: "EUR/USD" },
    { label: "Bitcoin (BTC)", id: "BTC/USD" },
  ].map(item => {
    const asset = marketData.find(a => a.id === item.id);
    const pct = asset ? parseFloat(asset.change.replace("%", "")) : 0;
    const bullPct = Math.round(50 + pct * 5);
    const clampedPct = Math.min(95, Math.max(5, bullPct));
    const status = clampedPct >= 60 ? "Bullish" : clampedPct <= 40 ? "Bearish" : "Neutral";
    const color = status === "Bullish" ? "bg-secondary-container" : status === "Bearish" ? "bg-tertiary-container" : "bg-primary-container";
    return { label: item.label, value: clampedPct, status, color };
  });

  // Signal history from real executed trades (last 10 closed)
  const signalHistory = trades
    .filter(t => t.status === "CLOSED")
    .slice(0, 5)
    .map(t => ({
      pair: t.symbol,
      time: t.closeTime ? new Date(t.closeTime).toLocaleString() : "Closed",
      status: parseFloat((t.profit || "0").replace(/[^-\d.]/g, "")) > 0 ? "Hit Target" : "Stopped Out",
      color: parseFloat((t.profit || "0").replace(/[^-\d.]/g, "")) > 0 ? "text-secondary-container" : "text-on-surface-variant",
    }));

  const handleTradeNow = (signal: any) => {
    setSelectedSignal(signal);
    setIsSuccess(false);
    setExecError(null);
    setShowDrawer(true);
  };

  const handleConfirmTrade = async () => {
    setIsExecuting(true);
    setExecError(null);
    try {
      const result = await executeTrade({
        symbol: selectedSignal.id,
        type: selectedSignal.trend === "up" ? "BUY" : "SELL",
        lotSize,
        leverage,
        riskLimit,
      });
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => setShowDrawer(false), 2000);
      } else {
        setExecError(result.error || "Trade execution failed");
      }
    } catch {
      setExecError("Network error — could not reach server");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-12">
      <section>
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-2">Alpha Alerts</h1>
        <p className="text-on-surface-variant text-lg max-w-2xl">
          Real-time trading signals computed from live price momentum and cross-asset volatility metrics.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-xl font-bold text-primary-container uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4" />
              Active Signals
            </h2>
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <span className="text-xs text-on-surface-variant/60 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Updated {lastUpdated}
                </span>
              )}
              <button
                onClick={refresh}
                className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors text-on-surface/40 hover:text-primary"
                title="Refresh signals"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {signalsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-surface-container-low rounded-sm p-6 animate-pulse">
                <div className="h-6 bg-outline-variant/20 rounded w-1/3 mb-3" />
                <div className="h-4 bg-outline-variant/10 rounded w-1/2" />
              </div>
            ))
          ) : signalsError ? (
            <div className="p-8 bg-surface-container-low border border-outline-variant/10 rounded-sm text-center">
              <p className="text-on-surface/60 text-sm">{signalsError}</p>
            </div>
          ) : signals.length === 0 ? (
            <div className="p-8 bg-surface-container-low border border-outline-variant/10 rounded-sm text-center">
              <p className="text-on-surface/60 text-sm">No strong signals detected at this time.</p>
              <p className="text-[10px] text-on-surface/40 uppercase tracking-widest mt-2">
                Signals appear when momentum is sufficient. Refreshes every 30 seconds.
              </p>
            </div>
          ) : (
            signals.map((signal, i) => (
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
                        <span className="font-bold tnum text-primary">{signal.price}</span>
                        <span className={`flex items-center gap-1 ${signal.trend === "up" ? "text-secondary-container" : "text-primary"}`}>
                          <ShieldCheck className="w-3 h-3" /> {signal.confidence} Confidence
                        </span>
                        <span className="text-on-surface/40 text-xs">
                          {signal.dataSource === "simulator" ? "Simulated" : "Live"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleTradeNow(signal)}
                      className="gold-gradient px-5 py-2 text-xs font-bold uppercase tracking-widest text-on-primary rounded-sm shadow-lg active:scale-95 transition-all"
                    >
                      Trade Now
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
          {/* Sentiment — derived from live market data */}
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-sm p-6">
            <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-6">Market Sentiment</h2>
            <div className="space-y-6">
              {sentimentItems.map(item => (
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
              <p className="text-[9px] text-on-surface/30 italic uppercase tracking-widest">Computed from live price changes</p>
            </div>
          </div>

          {/* Signal History — from real executed trades */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-[0.2em]">Trade History</h2>
            {signalHistory.length === 0 ? (
              <div className="bg-surface-container-low/50 p-4 text-center">
                <p className="text-[10px] text-on-surface/40 uppercase tracking-widest">No executed trades yet.</p>
                <p className="text-[10px] text-on-surface/30 mt-1">Use "Trade Now" to execute your first trade.</p>
              </div>
            ) : (
              <div className="bg-surface-container-low/50 divide-y divide-outline-variant/10">
                {signalHistory.map((item, i) => (
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
            )}
          </div>
        </div>
      </div>

      {/* Trade Drawer */}
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
                    <h2 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight uppercase">Trade Submitted</h2>
                    <p className="text-on-surface-variant text-sm max-w-xs">
                      Your <span className="font-bold text-on-surface">{selectedSignal.trend === "up" ? "BUY" : "SELL"} {selectedSignal.id}</span> order has been recorded. Connect MT5 for live execution.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
                          {selectedSignal.id}{" "}
                          <span className={selectedSignal.trend === "up" ? "text-secondary-container" : "text-tertiary-container"}>
                            {selectedSignal.trend === "up" ? "BUY" : "SELL"}
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

                    <div className="bg-surface-container-highest/30 p-5 rounded-lg border border-outline-variant/20">
                      <div className="flex items-center gap-3 mb-3">
                        <Bolt className="w-5 h-5 text-primary fill-primary" />
                        <div>
                          <p className="font-bold text-sm tracking-tight">TRADE EXECUTION</p>
                          <p className="text-[10px] text-on-surface/50 uppercase tracking-widest">Configure below</p>
                        </div>
                      </div>
                      <div className="bg-primary/5 border-l-2 border-primary p-3">
                        <p className="text-xs text-primary leading-relaxed">
                          Trade will be recorded and forwarded to MT5 when connected.
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
                            min="0.01"
                            value={lotSize}
                            onChange={e => setLotSize(e.target.value)}
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
                              min="1"
                              value={leverage}
                              onChange={e => setLeverage(e.target.value)}
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
                              min="0.1"
                              value={riskLimit}
                              onChange={e => setRiskLimit(e.target.value)}
                              className="w-full bg-transparent p-3 text-base font-medium tnum outline-none text-on-surface"
                            />
                            <span className="text-[10px] text-on-surface/40 pr-4 font-bold">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {execError && (
                      <div className="p-3 bg-tertiary-container/10 border border-tertiary-container/20 rounded text-tertiary-container text-xs font-bold">
                        {execError}
                      </div>
                    )}

                    <div className="pt-4 space-y-3">
                      <button
                        onClick={handleConfirmTrade}
                        disabled={isExecuting}
                        className={`w-full h-14 gold-gradient text-on-primary font-headline font-extrabold text-sm tracking-widest rounded-sm shadow-lg active:scale-95 transition-all uppercase flex items-center justify-center gap-3 ${isExecuting ? "opacity-70 cursor-not-allowed" : ""}`}
                      >
                        {isExecuting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                              className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full"
                            />
                            Submitting…
                          </>
                        ) : (
                          "Confirm Execution"
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
