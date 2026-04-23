import { Landmark, ShieldCheck, Zap, Activity, Bolt, Play, History, TrendingUp, BarChart3, Loader2, Settings2, BarChart } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { BacktestView } from "./BacktestView";

export function Config() {
  const navigate = useNavigate();
  const [showBacktest, setShowBacktest] = useState(false);

  // Bot Parameters State
  const [lotSize, setLotSize] = useState(0.10);
  const [leverage, setLeverage] = useState(200);
  const [stopLoss, setStopLoss] = useState(50);
  const [takeProfit, setTakeProfit] = useState(150);

  return (
    <div className="space-y-10">
      <AnimatePresence>
        {showBacktest && (
          <BacktestView onClose={() => setShowBacktest(false)} />
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
                { label: "News API Key", value: import.meta.env.VITE_NEWS_API_KEY || "", type: "text" },
              ].map((field) => (
                <div key={field.label} className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold ml-1">
                    {field.label}
                  </label>
                  <input
                    className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-primary transition-colors px-4 py-3 text-sm font-medium outline-none tnum"
                    defaultValue={field.value}
                    type={field.type}
                    placeholder={field.label === "News API Key" ? "Enter News API Key" : undefined}
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
              onClick={() => navigate("/builder")}
              className="w-full py-3 bg-surface-container-highest text-on-surface text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-surface-bright transition-all flex items-center justify-center gap-2 border border-outline-variant/20 group"
            >
              <Settings2 className="w-4 h-4 text-primary group-hover:rotate-90 transition-transform duration-500" />
              Open Visual Builder
            </button>
          </div>

          {/* Backtesting Section */}
          <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <BarChart className="w-16 h-16" />
            </div>
            <h2 className="font-headline text-lg font-bold mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Advanced Backtesting
            </h2>
            <p className="text-[11px] text-on-surface-variant mb-6 leading-relaxed">
              Launch the Neural Backtesting engine to audit performance against historical market nodes with complex growth analytics.
            </p>
            <button 
              onClick={() => setShowBacktest(true)}
              className="w-full py-3 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <BarChart3 className="w-4 h-4" />
              Launch Backtest Engine
            </button>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-8">
          <div className="bg-surface-container-low p-8 rounded-lg border border-outline-variant/10 shadow-sm">
            <h2 className="font-headline text-xl font-bold mb-10 flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
              Trading Bot Parameters
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
              {/* Lot Size & Leverage */}
              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Base Lot Size</label>
                    <span className="text-primary font-bold tnum text-lg">{lotSize.toFixed(2)} Lots</span>
                  </div>
                  <input
                    className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                    max="5.0"
                    min="0.01"
                    step="0.01"
                    type="range"
                    value={lotSize}
                    onChange={(e) => setLotSize(parseFloat(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] text-on-surface-variant font-medium uppercase tracking-tighter">
                    <span>0.01</span>
                    <span>5.00</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Account Leverage</label>
                    <span className="text-primary font-bold tnum text-lg">1:{leverage}</span>
                  </div>
                  <input
                    className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                    max="500"
                    min="1"
                    type="range"
                    value={leverage}
                    onChange={(e) => setLeverage(parseInt(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] text-on-surface-variant font-medium uppercase tracking-tighter">
                    <span>1:1</span>
                    <span>1:500</span>
                  </div>
                </div>
              </div>

              {/* SL & TP */}
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Stop-Loss (Pips)</label>
                  <div className="relative group">
                    <input
                      className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-tertiary-container transition-colors px-4 py-3 text-lg font-bold outline-none tnum"
                      step="1"
                      type="number"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(parseInt(e.target.value))}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-tertiary-container font-bold text-xs uppercase tracking-widest">Pips</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant/60 italic">Hard equity protection threshold.</p>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Take-Profit (Pips)</label>
                  <div className="relative group">
                    <input
                      className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-secondary-container transition-colors px-4 py-3 text-lg font-bold outline-none tnum"
                      step="1"
                      type="number"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(parseInt(e.target.value))}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-container font-bold text-xs uppercase tracking-widest">Pips</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant/60 italic">Target profit realization level.</p>
                </div>
              </div>

              {/* Asset Selection */}
              <div className="md:col-span-2 space-y-6 pt-4">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold flex items-center gap-2">
                  <BarChart3 className="w-3 h-3" />
                  Active Asset Selection
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["XAU/USD", "EUR/USD", "GBP/JPY", "BTC/USD", "ETH/USD", "USD/JPY", "AUD/USD", "XAG/USD"].map((asset) => (
                    <label
                      key={asset}
                      className="flex items-center justify-between p-4 bg-surface-container-highest/50 rounded-lg cursor-pointer border border-outline-variant/10 hover:border-primary/40 hover:bg-surface-container-highest transition-all group"
                    >
                      <span className="text-xs font-bold tracking-tight tnum group-hover:text-primary transition-colors">{asset}</span>
                      <input
                        className="w-4 h-4 rounded-sm border-outline-variant bg-surface-container text-primary focus:ring-primary/20 cursor-pointer"
                        type="checkbox"
                        defaultChecked={["XAU/USD", "BTC/USD", "EUR/USD"].includes(asset)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button className="px-12 py-5 gold-gradient text-on-primary font-bold uppercase tracking-widest text-sm rounded shadow-[0_16px_32px_-12px_rgba(212,175,55,0.5)] active:scale-95 transition-all flex items-center gap-3">
              Deploy Configuration
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
