import { Landmark, ShieldCheck, Zap, Activity, Bolt, Play, History, TrendingUp, BarChart3, Loader2, Settings2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StrategyBuilder } from "./StrategyBuilder";

export function Config() {
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [backtestResult, setBacktestResult] = useState<{
    profit: string;
    winRate: string;
    drawdown: string;
    trades: number;
  } | null>(null);

  const runBacktest = () => {
    setIsBacktesting(true);
    setBacktestResult(null);
    
    // Mock simulation delay
    setTimeout(() => {
      setIsBacktesting(false);
      setBacktestResult({
        profit: "+$2,450.12",
        winRate: "64.2%",
        drawdown: "4.8%",
        trades: 124
      });
    }, 3000);
  };

  return (
    <div className="space-y-10">
      <AnimatePresence>
        {showBuilder && (
          <StrategyBuilder onClose={() => setShowBuilder(false)} />
        )}
      </AnimatePresence>

      <div className="mb-10">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-2">Bot Configuration</h1>
        <p className="text-on-surface-variant font-light max-w-2xl">
          Precision parameters for the WINM AI algorithmic execution engine. Adjust MT5 connectivity and risk architecture below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-low p-6 rounded-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Landmark className="w-16 h-16" />
            </div>
            <h2 className="font-headline text-lg font-bold mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              MT5 Terminal Link
            </h2>
            <div className="space-y-4">
              {[
                { label: "Server", value: "ICMarkets-SC-Demo", type: "text" },
                { label: "Login ID", value: "8849201", type: "text" },
                { label: "Password", value: "••••••••••••", type: "password" },
              ].map((field) => (
                <div key={field.label} className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold ml-1">
                    {field.label}
                  </label>
                  <input
                    className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-primary transition-colors px-4 py-3 text-sm font-medium outline-none tnum"
                    defaultValue={field.value}
                    type={field.type}
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 p-3 bg-secondary-container/10 rounded flex items-center gap-3 border border-secondary-container/20">
              <ShieldCheck className="w-4 h-4 text-secondary-container" />
              <span className="text-[11px] text-secondary-container font-medium">Terminal connection verified</span>
            </div>
          </div>

          {/* Strategy Architect Section */}
          <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Settings2 className="w-16 h-16" />
            </div>
            <h2 className="font-headline text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Strategy Architect
            </h2>
            <p className="text-[11px] text-on-surface-variant mb-6 leading-relaxed">
              Visually build and edit your trading logic using the WINM AI block-based interface.
            </p>
            <button 
              onClick={() => setShowBuilder(true)}
              className="w-full py-3 bg-surface-container-highest text-on-surface text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-surface-bright transition-all flex items-center justify-center gap-2 border border-outline-variant/20 group"
            >
              <Settings2 className="w-4 h-4 text-primary group-hover:rotate-90 transition-transform duration-500" />
              Open Visual Builder
            </button>
          </div>

          {/* Backtesting Section */}
          <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/10">
            <h2 className="font-headline text-lg font-bold mb-6 flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Strategy Backtesting
            </h2>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold ml-1">Strategy</label>
                <select className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-primary transition-colors px-4 py-3 text-sm font-medium outline-none appearance-none">
                  <option>Gold Scalper V2</option>
                  <option>EUR/USD Trend Follower</option>
                  <option>Volatility Arbitrage</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold ml-1">Start Date</label>
                  <input type="date" className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-primary transition-colors px-4 py-3 text-xs font-medium outline-none" defaultValue="2024-01-01" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold ml-1">End Date</label>
                  <input type="date" className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-primary transition-colors px-4 py-3 text-xs font-medium outline-none" defaultValue="2024-03-28" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold ml-1">Initial Capital</label>
                <div className="relative">
                  <input type="text" className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-primary transition-colors px-4 py-3 text-sm font-bold outline-none tnum" defaultValue="10000" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-on-surface-variant">USD</span>
                </div>
              </div>
              
              <button 
                onClick={runBacktest}
                disabled={isBacktesting}
                className="w-full py-3 bg-primary text-on-primary text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isBacktesting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Run Backtest
                  </>
                )}
              </button>

              <AnimatePresence>
                {backtestResult && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-outline-variant/10 space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-surface-container-highest/50 rounded">
                        <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Net Profit</p>
                        <p className="text-sm font-bold text-secondary-container tnum">{backtestResult.profit}</p>
                      </div>
                      <div className="p-3 bg-surface-container-highest/50 rounded">
                        <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Win Rate</p>
                        <p className="text-sm font-bold text-on-surface tnum">{backtestResult.winRate}</p>
                      </div>
                      <div className="p-3 bg-surface-container-highest/50 rounded">
                        <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Max Drawdown</p>
                        <p className="text-sm font-bold text-tertiary-container tnum">{backtestResult.drawdown}</p>
                      </div>
                      <div className="p-3 bg-surface-container-highest/50 rounded">
                        <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Total Trades</p>
                        <p className="text-sm font-bold text-on-surface tnum">{backtestResult.trades}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        <section className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-container-low p-6 rounded-lg md:col-span-2">
            <h2 className="font-headline text-lg font-bold mb-8 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              Strategy Parameters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Leverage</label>
                  <span className="text-primary font-bold tnum text-lg">1:200</span>
                </div>
                <input
                  className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                  max="500"
                  min="1"
                  type="range"
                  defaultValue="200"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant font-medium uppercase tracking-tighter">
                  <span>1:1</span>
                  <span>1:500</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Risk per Trade (%)</label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-primary transition-colors px-4 py-3 text-lg font-bold outline-none tnum"
                    step="0.1"
                    type="number"
                    defaultValue="1.5"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">%</span>
                </div>
                <p className="text-[11px] text-on-surface-variant/60 italic">Suggested range: 0.5% - 2.0%</p>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Max Simultaneous Trades</label>
                <div className="flex gap-2">
                  <button className="w-12 h-12 bg-surface-container-highest flex items-center justify-center hover:bg-surface-bright transition-colors">
                    -
                  </button>
                  <input
                    className="flex-1 bg-surface-container-highest border-b border-outline-variant/20 text-center text-lg font-bold outline-none tnum"
                    type="text"
                    defaultValue="05"
                  />
                  <button className="w-12 h-12 bg-surface-container-highest flex items-center justify-center hover:bg-surface-bright transition-colors">
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Asset Selection</label>
                <div className="grid grid-cols-2 gap-3">
                  {["XAU/USD", "EUR/USD", "GBP/JPY", "BTC/USD"].map((asset) => (
                    <label
                      key={asset}
                      className="flex items-center gap-3 p-3 bg-surface-container-highest rounded cursor-pointer border border-transparent hover:border-primary/20 transition-all"
                    >
                      <input
                        className="w-4 h-4 rounded-sm border-outline-variant bg-surface-container text-primary focus:ring-primary/20"
                        type="checkbox"
                        defaultChecked={asset !== "GBP/JPY"}
                      />
                      <span className="text-xs font-bold tracking-tight tnum">{asset}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end pt-4">
            <button className="px-10 py-4 gold-gradient text-on-primary font-bold uppercase tracking-widest text-sm rounded shadow-[0_12px_24px_-8px_rgba(212,175,55,0.4)] active:scale-95 transition-all flex items-center gap-3">
              Apply Configuration
              <Bolt className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>

      <div className="mt-20 border-t border-outline-variant/10 pt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: ShieldCheck, title: "Encrypted Link", desc: "All credentials are stored in local AES-256 encrypted containers." },
          { icon: Zap, title: "Latency Opt", desc: "Global execution relay ensuring <5ms order placement." },
          { icon: Activity, title: "Smart Sizing", desc: "Dynamic position sizing based on live volatility markers." },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-4">
            <item.icon className="w-5 h-5 text-primary" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-1">{item.title}</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
